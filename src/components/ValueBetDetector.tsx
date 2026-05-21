import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingUp, Lock, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ValueBetDetectorProps {
  odds?: any[];
  prediction?: {
    probabilities: { home: number; draw: number; away: number };
    confidence: number;
  };
  homeTeamName: string;
  awayTeamName: string;
}

interface ValueBetResult {
  market: string;
  ourProb: number;
  bookmakerProb: number;
  edge: number;
  bookmakerName: string;
  odd: number;
  label: string;
}

function impliedProb(odd: number): number {
  return odd > 0 ? Math.round((1 / odd) * 100) : 0;
}

export default function ValueBetDetector({
  odds, prediction, homeTeamName, awayTeamName,
}: ValueBetDetectorProps) {
  const { isVip } = useAuth();

  if (!prediction || !odds || odds.length === 0) return null;

  // Safeguard: compute probabilities if missing in prediction object
  let probabilities = prediction.probabilities;
  if (!probabilities) {
    let home = 0, draw = 0, away = 0;
    const pred = prediction as any;
    if (pred.homeWinProb && pred.awayWinProb) {
      home = pred.homeWinProb;
      draw = pred.drawProb || (100 - pred.homeWinProb - pred.awayWinProb);
      away = pred.awayWinProb;
    } else if (pred.confidence && pred.predictedScore) {
      const conf = Math.round((pred.confidence || 0) * 100);
      const predictedScore = typeof pred.predictedScore === "string" ? pred.predictedScore : "0-0";
      const [h, a] = predictedScore.split("-").map(Number);
      if (!isNaN(h) && !isNaN(a)) {
        if (h > a) {
          home = conf;
          draw = Math.round((100 - conf) * 0.45);
          away = 100 - home - draw;
        } else if (a > h) {
          away = conf;
          draw = Math.round((100 - conf) * 0.45);
          home = 100 - away - draw;
        } else {
          draw = conf;
          home = Math.round((100 - conf) * 0.55);
          away = 100 - draw - home;
        }
      }
    }

    const total = home + draw + away;
    if (total > 0) {
      if (total !== 100) {
        home = Math.round((home / total) * 100);
        draw = Math.round((draw / total) * 100);
        away = 100 - home - draw;
      }
      probabilities = { home, draw, away };
    }
  }

  if (!probabilities || typeof probabilities.home !== "number" || typeof probabilities.draw !== "number" || typeof probabilities.away !== "number") {
    return null;
  }


  // Cherche les value bets dans les cotes bookmakers
  const valueBets: ValueBetResult[] = [];

  odds.slice(0, 5).forEach((bookmakerEntry: any) => {
    const bk = bookmakerEntry.bookmakers?.[0];
    if (!bk) return;
    const bets1x2 = bk.bets?.find((b: any) => b.name === "Match Winner");
    if (!bets1x2) return;

    bets1x2.values?.forEach((v: any) => {
      const odd = parseFloat(v.odd);
      if (!odd || odd <= 1) return;
      const bkProb = impliedProb(odd);
      let ourProb = 0;
      let label = "";

      if (v.value === "Home") { ourProb = probabilities.home; label = `Victoire ${homeTeamName}`; }
      else if (v.value === "Away") { ourProb = probabilities.away; label = `Victoire ${awayTeamName}`; }
      else if (v.value === "Draw") { ourProb = probabilities.draw; label = "Match Nul"; }

      const edge = ourProb - bkProb;
      if (edge >= 10) {
        valueBets.push({ market: "1X2", ourProb, bookmakerProb: bkProb, edge, bookmakerName: bk.name, odd, label });
      }
    });
  });

  if (valueBets.length === 0) return null;

  const best = valueBets.sort((a, b) => b.edge - a.edge)[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden"
    >
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-amber-500/20 blur-md" />

      <div className="relative rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/80 to-[#050f0a] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-emerald-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Zap className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                Value Bet Détecteur
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[8px] font-black text-emerald-400 uppercase">
                  LIVE
                </span>
              </h4>
              <p className="text-[9px] text-emerald-400/50">Modèle Poisson vs Bookmakers</p>
            </div>
          </div>
          {!isVip && (
            <Link to="/pricing" className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-400 hover:bg-amber-500/20 transition-colors">
              <Crown className="h-3 w-3" /> VIP
            </Link>
          )}
        </div>

        <div className="p-4 relative">
          {/* Blur overlay for non-VIP */}
          {!isVip && (
            <div className="absolute inset-0 z-10 backdrop-blur-sm bg-black/40 flex flex-col items-center justify-center gap-2 rounded-b-2xl">
              <Lock className="h-5 w-5 text-amber-400" />
              <p className="text-xs font-black text-white">Réservé aux membres VIP</p>
              <p className="text-[10px] text-white/50 text-center max-w-[200px]">
                Détecte automatiquement les cotes sous-évaluées par les bookmakers
              </p>
              <Link to="/pricing" className="mt-2 px-4 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black hover:bg-amber-400 transition-colors">
                Débloquer VIP
              </Link>
            </div>
          )}

          {/* Best value bet */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold mb-0.5">Meilleure opportunité</p>
              <p className="text-sm font-black text-white">{best.label}</p>
              <p className="text-[10px] text-white/40">{best.bookmakerName} · Cote {best.odd.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-emerald-400">+{best.edge}%</div>
              <p className="text-[9px] text-emerald-400/60 font-bold uppercase">Edge</p>
            </div>
          </div>

          {/* Prob comparison bar */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-white/50">Notre modèle</span>
              <span className="font-black text-emerald-400">{best.ourProb}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${best.ourProb}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-white/50">Bookmaker implique</span>
              <span className="font-black text-red-400">{best.bookmakerProb}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full bg-red-500/50 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${best.bookmakerProb}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              />
            </div>
          </div>

          {/* Edge badge */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
            <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
            <p className="text-[11px] text-emerald-300 font-semibold">
              Écart de <strong>+{best.edge}%</strong> détecté — La cote {best.odd.toFixed(2)} offre une valeur mathématique positive
            </p>
          </div>

          {/* All value bets */}
          {valueBets.length > 1 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[9px] text-white/30 uppercase font-bold">{valueBets.length - 1} autre{valueBets.length > 2 ? "s" : ""} opportunité{valueBets.length > 2 ? "s" : ""}</p>
              {valueBets.slice(1, 3).map((vb, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-xs text-white/70">{vb.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40">Cote {vb.odd.toFixed(2)}</span>
                    <span className="text-xs font-black text-emerald-400">+{vb.edge}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
