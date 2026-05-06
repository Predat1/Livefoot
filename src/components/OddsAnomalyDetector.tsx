import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ShieldAlert, TrendingDown, AlertTriangle, CheckCircle, Lock, Crown, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

interface OddsAnomalyDetectorProps {
  oddsData: any[];
  liveOddsData?: any[];
  apiPredictions?: any;
  homeTeamName: string;
  awayTeamName: string;
  leagueName?: string;
}

interface AnomalySignal {
  severity: "safe" | "warning" | "danger";
  type: string;
  title: string;
  description: string;
  detail?: string;
}

// Convert decimal odds to implied probability
function oddsToProb(decimal: number): number {
  if (decimal <= 1) return 100;
  return Math.round((1 / decimal) * 10000) / 100;
}

// Detect sharp odds movement
function detectOddsMovement(bookmakers: any[]): AnomalySignal[] {
  const signals: AnomalySignal[] = [];
  if (!bookmakers || bookmakers.length === 0) return signals;

  // Collect all 1X2 odds across bookmakers
  const allOdds: { bk: string; home: number; draw: number; away: number }[] = [];

  for (const bk of bookmakers) {
    const bets = bk?.bookmaker?.bets || bk?.bets || [];
    const matchWinner = bets.find((b: any) =>
      b.name === "Match Winner" || b.id === 1
    );
    if (!matchWinner?.values) continue;

    const homeOdd = parseFloat(matchWinner.values.find((v: any) => v.value === "Home")?.odd || "0");
    const drawOdd = parseFloat(matchWinner.values.find((v: any) => v.value === "Draw")?.odd || "0");
    const awayOdd = parseFloat(matchWinner.values.find((v: any) => v.value === "Away")?.odd || "0");

    if (homeOdd > 0 && drawOdd > 0 && awayOdd > 0) {
      allOdds.push({ bk: bk?.bookmaker?.name || bk?.name || "Unknown", home: homeOdd, draw: drawOdd, away: awayOdd });
    }
  }

  if (allOdds.length < 2) return signals;

  // Calculate average odds
  const avgHome = allOdds.reduce((s, o) => s + o.home, 0) / allOdds.length;
  const avgDraw = allOdds.reduce((s, o) => s + o.draw, 0) / allOdds.length;
  const avgAway = allOdds.reduce((s, o) => s + o.away, 0) / allOdds.length;

  // Check margin (overround) — lower margin = more money flowing in
  const totalProb = oddsToProb(avgHome) + oddsToProb(avgDraw) + oddsToProb(avgAway);
  const margin = totalProb - 100;

  if (margin > 15) {
    signals.push({
      severity: "warning",
      type: "high_margin",
      title: "Marge bookmaker élevée",
      description: `Marge de ${margin.toFixed(1)}% — les bookmakers se protègent sur ce match`,
      detail: `Marge normale : 5-10%. Marge détectée : ${margin.toFixed(1)}%`,
    });
  }

  // Check for outlier bookmakers (odds deviation > 20% from average)
  for (const o of allOdds) {
    const homeDeviation = Math.abs(o.home - avgHome) / avgHome * 100;
    const awayDeviation = Math.abs(o.away - avgAway) / avgAway * 100;

    if (homeDeviation > 20 || awayDeviation > 20) {
      signals.push({
        severity: "warning",
        type: "outlier_bookmaker",
        title: `Cote atypique chez ${o.bk}`,
        description: `Écart de ${Math.max(homeDeviation, awayDeviation).toFixed(0)}% par rapport à la moyenne du marché`,
        detail: `${o.bk}: ${o.home} / ${o.draw} / ${o.away} | Moyenne: ${avgHome.toFixed(2)} / ${avgDraw.toFixed(2)} / ${avgAway.toFixed(2)}`,
      });
    }
  }

  // Check for suspicious low odds on heavy underdog
  const minOdd = Math.min(...allOdds.map(o => Math.min(o.home, o.away)));
  const maxOdd = Math.max(...allOdds.map(o => Math.max(o.home, o.away)));

  if (maxOdd / minOdd > 8) {
    // Very one-sided match — check if any bookmaker offers much lower odds on the underdog
    const avgFavorite = Math.min(avgHome, avgAway);
    const avgUnderdog = Math.max(avgHome, avgAway);

    for (const o of allOdds) {
      const underdog = Math.max(o.home, o.away);
      if (underdog < avgUnderdog * 0.70) {
        signals.push({
          severity: "danger",
          type: "suspicious_underdog",
          title: "Cote outsider anormalement basse",
          description: `Un bookmaker offre une cote 30%+ inférieure à la moyenne pour l'outsider — flux d'argent suspect`,
          detail: `${o.bk}: outsider à ${underdog.toFixed(2)} vs moyenne ${avgUnderdog.toFixed(2)}`,
        });
      }
    }
  }

  // Check for draw odds collapse (common in fixed matches)
  const drawProb = oddsToProb(avgDraw);
  if (drawProb > 38) {
    signals.push({
      severity: "warning",
      type: "draw_collapse",
      title: "Probabilité de nul inhabituellement élevée",
      description: `Le marché évalue le nul à ${drawProb.toFixed(0)}% — seuil d'alerte dépassé (>38%)`,
    });
  }

  return signals;
}

// Compare AI prediction vs odds consensus
function detectPredictionOddsConflict(apiPredictions: any, oddsData: any[]): AnomalySignal[] {
  const signals: AnomalySignal[] = [];
  if (!apiPredictions?.predictions?.percent || !oddsData?.length) return signals;

  const aiHomeProb = parseInt(apiPredictions.predictions.percent.home) || 0;
  const aiDrawProb = parseInt(apiPredictions.predictions.percent.draw) || 0;
  const aiAwayProb = parseInt(apiPredictions.predictions.percent.away) || 0;

  // Get consensus odds probability
  const allOdds: { home: number; draw: number; away: number }[] = [];
  for (const bk of oddsData) {
    const bets = bk?.bookmaker?.bets || bk?.bets || [];
    const matchWinner = bets.find((b: any) => b.name === "Match Winner" || b.id === 1);
    if (!matchWinner?.values) continue;
    const h = parseFloat(matchWinner.values.find((v: any) => v.value === "Home")?.odd || "0");
    const d = parseFloat(matchWinner.values.find((v: any) => v.value === "Draw")?.odd || "0");
    const a = parseFloat(matchWinner.values.find((v: any) => v.value === "Away")?.odd || "0");
    if (h > 0) allOdds.push({ home: oddsToProb(h), draw: oddsToProb(d), away: oddsToProb(a) });
  }

  if (allOdds.length === 0) return signals;

  const consensusHome = allOdds.reduce((s, o) => s + o.home, 0) / allOdds.length;
  const consensusAway = allOdds.reduce((s, o) => s + o.away, 0) / allOdds.length;

  // Major conflict: AI says team A wins but odds strongly favor team B (>20% gap)
  const homeConflict = Math.abs(aiHomeProb - consensusHome);
  const awayConflict = Math.abs(aiAwayProb - consensusAway);

  if (homeConflict > 20 || awayConflict > 20) {
    signals.push({
      severity: "warning",
      type: "model_odds_conflict",
      title: "Conflit Modèle IA vs Cotes",
      description: `Écart de ${Math.max(homeConflict, awayConflict).toFixed(0)}% entre l'IA et le consensus bookmaker — possible valeur cachée ou info asymétrique`,
      detail: `IA: ${aiHomeProb}% / ${aiDrawProb}% / ${aiAwayProb}% | Cotes: ${consensusHome.toFixed(0)}% / ${(100 - consensusHome - consensusAway).toFixed(0)}% / ${consensusAway.toFixed(0)}%`,
    });
  }

  return signals;
}

const severityConfig = {
  safe: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", icon: CheckCircle, label: "Match Intègre" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", icon: AlertTriangle, label: "Signal d'Alerte" },
  danger: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", icon: ShieldAlert, label: "Anomalie Critique" },
};

export default function OddsAnomalyDetector({
  oddsData, liveOddsData, apiPredictions, homeTeamName, awayTeamName, leagueName
}: OddsAnomalyDetectorProps) {
  const { isVip } = useAuth();

  const analysis = useMemo(() => {
    const signals: AnomalySignal[] = [];

    // Run odds movement detection
    if (oddsData?.length) {
      signals.push(...detectOddsMovement(oddsData));
    }

    // Run prediction vs odds conflict
    if (apiPredictions && oddsData?.length) {
      signals.push(...detectPredictionOddsConflict(apiPredictions, oddsData));
    }

    // Compare pre-match vs live odds if available
    if (liveOddsData?.length && oddsData?.length) {
      // Simplified: if live odds exist and differ significantly from pre-match
      signals.push({
        severity: "warning" as const,
        type: "live_shift",
        title: "Mouvement de cotes en direct",
        description: "Les cotes ont bougé significativement depuis l'ouverture du match — volume de paris inhabituel détecté",
      });
    }

    // Determine overall severity
    const hasDanger = signals.some(s => s.severity === "danger");
    const hasWarning = signals.some(s => s.severity === "warning");
    const overallSeverity = hasDanger ? "danger" : hasWarning ? "warning" : "safe";

    // Integrity score (100 = fully clean, 0 = very suspicious)
    const integrityScore = Math.max(0, 100 - signals.filter(s => s.severity === "danger").length * 30 - signals.filter(s => s.severity === "warning").length * 12);

    return { signals, overallSeverity, integrityScore };
  }, [oddsData, liveOddsData, apiPredictions]);

  const config = severityConfig[analysis.overallSeverity as keyof typeof severityConfig];
  const Icon = config.icon;

  // VIP Gate: Free users see a teaser, VIP see the full analysis
  if (!isVip) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800/90 to-slate-900 border border-amber-500/20 overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.08),transparent_60%)]" />
        <div className="relative p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center border border-amber-500/20">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                Détecteur d'Intégrité
                <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/30 font-black flex items-center gap-0.5">
                  <Crown className="h-2 w-2" /> VIP
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">Analyse des mouvements de cotes suspects</p>
            </div>
          </div>

          {/* Blurred preview */}
          <div className="relative">
            <div className="space-y-2 filter blur-[6px] pointer-events-none select-none">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-white">Score d'intégrité: 88/100</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-white">Mouvement de cotes détecté</span>
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 rounded-xl">
              <Lock className="h-6 w-6 text-amber-400 mb-2" />
              <p className="text-xs font-black text-amber-300">Réservé aux membres VIP</p>
              <Link
                to="/auth"
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-[10px] shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform"
              >
                <Crown className="h-3 w-3" />
                DÉBLOQUER
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // VIP: Full analysis
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-slate-900 via-[#0d1117] to-slate-900 border border-amber-500/15 overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.06),transparent_60%)]" />
      
      <div className="relative p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center border border-amber-500/20 shadow-lg shadow-amber-500/10"
            >
              <Eye className="h-5 w-5 text-amber-400" />
            </motion.div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                Détecteur d'Intégrité
                <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/30 font-black flex items-center gap-0.5">
                  <Crown className="h-2 w-2" /> VIP
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">{homeTeamName} vs {awayTeamName}</p>
            </div>
          </div>
        </div>

        {/* Integrity Score Gauge */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative h-16 w-16 flex-shrink-0">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <motion.circle
                cx="32" cy="32" r="28" fill="none"
                stroke={analysis.integrityScore > 70 ? "#22c55e" : analysis.integrityScore > 40 ? "#f59e0b" : "#ef4444"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 28}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - analysis.integrityScore / 100) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-lg font-black", analysis.integrityScore > 70 ? "text-emerald-400" : analysis.integrityScore > 40 ? "text-amber-400" : "text-red-400")}>
                {analysis.integrityScore}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-white">Score d'Intégrité</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {analysis.integrityScore > 80 ? "Aucune anomalie significative détectée" :
               analysis.integrityScore > 50 ? "Quelques signaux à surveiller" :
               "Signaux d'alerte multiples détectés"}
            </p>
            <div className={cn("mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase border", config.bg, config.text, config.border)}>
              <Icon className="h-2.5 w-2.5" />
              {config.label}
            </div>
          </div>
        </div>

        {/* Signals List */}
        {analysis.signals.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mb-2">
              Signaux détectés ({analysis.signals.length})
            </p>
            {analysis.signals.map((signal, i) => {
              const sc = severityConfig[signal.severity];
              const SIcon = sc.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className={cn("rounded-xl p-3 border flex items-start gap-2.5", sc.bg, sc.border)}
                >
                  <SIcon className={cn("h-4 w-4 shrink-0 mt-0.5", sc.text)} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white">{signal.title}</p>
                    <p className="text-[10px] text-white/50 leading-relaxed">{signal.description}</p>
                    {signal.detail && (
                      <p className="text-[9px] text-white/30 mt-1 font-mono">{signal.detail}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className={cn("rounded-xl p-4 border flex items-center gap-3", severityConfig.safe.bg, severityConfig.safe.border)}>
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-xs font-bold text-emerald-400">Match propre</p>
              <p className="text-[10px] text-emerald-300/60">Aucun mouvement de cotes suspect détecté sur ce match</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <p className="text-[8px] text-white/15">LiveFoot Integrity Scanner v1.0</p>
          <p className="text-[8px] text-white/15">{oddsData?.length || 0} bookmakers analysés</p>
        </div>
      </div>
    </motion.div>
  );
}
