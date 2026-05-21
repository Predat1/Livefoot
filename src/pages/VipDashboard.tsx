import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import {
  Crown, AlertTriangle, TrendingUp, Lock, ArrowRight, Activity,
  ShieldAlert, Star, RefreshCw, Loader2, CheckCircle, Gift, Zap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { getFixtures } from "@/services/apiFootball";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────

interface HotPick {
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  time: string;
  prediction: string;
  confidence: number;
  odds?: number;
  value?: number;
  dataStatus: "fresh" | "cached" | "unavailable";
}

interface AnomalyItem {
  id: string;
  match: string;
  league: string;
  type: string;
  details: string;
  severity: "high" | "medium";
}

// ─── Helper ──────────────────────────────────────────────────────

function getCacheStatus(updatedAt: string): "fresh" | "cached" {
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  // Fresh if < 12 hours old
  return ageMs < 12 * 60 * 60 * 1000 ? "fresh" : "cached";
}

function extractBestPrediction(data: Record<string, unknown>): { prediction: string; confidence: number; odds?: number; value?: number } {
  // Try markets array first
  const markets = (data?.markets as Array<{ name?: string; selection?: string; confidence?: number; odds?: number; value_edge?: number }>) || [];
  if (markets.length > 0) {
    const top = markets.reduce((best, m) =>
      (m.confidence || 0) > (best.confidence || 0) ? m : best, markets[0]);
    return {
      prediction: [top.name, top.selection].filter(Boolean).join(" — ") || "Voir analyse",
      confidence: Math.round((top.confidence || 0) * 100) || 75,
      odds: top.odds,
      value: top.value_edge ? Math.round(top.value_edge) : undefined,
    };
  }
  // Fallback: top-level bestBet / recommendation
  const bestBet = (data?.bestBet as { prediction?: string; confidence?: number; odds?: number }) || {};
  if (bestBet.prediction) {
    return {
      prediction: bestBet.prediction,
      confidence: Math.round((bestBet.confidence || 0.75) * 100),
      odds: bestBet.odds,
    };
  }
  // Last fallback
  const conf = typeof data?.confidence === "number" ? Math.round(data.confidence * 100) : 75;
  return { prediction: (data?.prediction as string) || "Voir analyse complète", confidence: conf };
}

// ─── Component ───────────────────────────────────────────────────

export default function VipDashboard() {
  const { user, isVip, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [hotPicks, setHotPicks] = useState<HotPick[]>([]);
  const [loadingPicks, setLoadingPicks] = useState(true);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoClaimed, setPromoClaimed] = useState(false);
  const [promoAvailable, setPromoAvailable] = useState(false);

  // ─── Load Hot Picks ───────────────────────────────────────────
  const loadHotPicks = useCallback(async () => {
    setLoadingPicks(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      // 1. Fetch today's fixtures (uses api-football Edge Function with cache)
      const fixturesRes = await getFixtures({ date: today });
      const fixtures = fixturesRes?.response?.slice(0, 15) || [];

      if (fixtures.length === 0) {
        setHotPicks([]);
        return;
      }

      const fixtureIds = fixtures.map((f: any) => String(f.fixture.id));

      // 2. Look up cached AI predictions for today's fixtures
      const { data: cachedPredictions, error: cacheError } = await supabase
        .from("ai_predictions_cache")
        .select("fixture_id, data, updated_at, match_status")
        .in("fixture_id", fixtureIds)
        .order("updated_at", { ascending: false });

      if (cacheError) {
        console.warn("ai_predictions_cache query error:", cacheError);
      }

      const predictionMap = new Map<string, { data: any; updated_at: string; match_status: string }>();
      (cachedPredictions || []).forEach((p: any) => {
        predictionMap.set(p.fixture_id, p);
      });

      // 3. Build hot picks (only fixtures with cached AI predictions, sorted by confidence)
      const picks: HotPick[] = [];

      for (const fixture of fixtures) {
        const fid = String(fixture.fixture.id);
        const cachedEntry = predictionMap.get(fid);

        if (!cachedEntry || !cachedEntry.data || cachedEntry.data._isProcessing) continue;

        const aiData = cachedEntry.data;
        const { prediction, confidence, odds, value } = extractBestPrediction(aiData);

        // Only include picks with confidence ≥ 70%
        if (confidence < 70) continue;

        const kickoffUTC = fixture.fixture.date;
        const timeStr = kickoffUTC
          ? format(new Date(kickoffUTC), "HH:mm")
          : "—";

        picks.push({
          fixtureId: fid,
          homeTeam: fixture.teams?.home?.name || "Domicile",
          awayTeam: fixture.teams?.away?.name || "Extérieur",
          league: fixture.league?.name || "Compétition",
          time: timeStr,
          prediction,
          confidence,
          odds,
          value,
          dataStatus: getCacheStatus(cachedEntry.updated_at),
        });
      }

      // Sort by confidence descending, take top 6
      picks.sort((a, b) => b.confidence - a.confidence);
      setHotPicks(picks.slice(0, 6));
    } catch (err) {
      console.error("loadHotPicks error:", err);
      setHotPicks([]);
    } finally {
      setLoadingPicks(false);
    }
  }, []);

  // ─── Check promo availability ─────────────────────────────────
  const checkPromoAvailability = useCallback(async () => {
    if (!user) return;
    try {
      const { data: settings } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["promo_vip_enabled", "promo_vip_end_date"]);

      const map = Object.fromEntries(
        (settings || []).map((s: { key: string; value: string }) => [s.key, s.value])
      );

      const promoOn = map["promo_vip_enabled"] === "true";
      const endDate = map["promo_vip_end_date"] ? new Date(map["promo_vip_end_date"]) : null;
      const promoStillOn = promoOn && (!endDate || new Date() <= endDate);

      if (!promoStillOn) return;

      // Check if user already claimed
      const { count } = await supabase
        .from("promo_trials")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setPromoAvailable((count ?? 0) === 0);
    } catch (_) {}
  }, [user]);

  useEffect(() => {
    loadHotPicks();
  }, [loadHotPicks]);

  useEffect(() => {
    if (user && !isVip) {
      checkPromoAvailability();
    }
  }, [user, isVip, checkPromoAvailability]);

  // ─── Claim promo ──────────────────────────────────────────────
  const handleClaimPromo = async () => {
    if (!user) {
      navigate("/auth?redirect=/vip");
      return;
    }
    setPromoLoading(true);
    try {
      const { data, error } = await supabase.rpc("activate_existing_user_promo");
      if (error) throw new Error(error.message);
      if (data?.success) {
        toast.success("🎉 VIP 30 jours activé !", "Profitez de toutes les fonctionnalités premium.");
        setPromoClaimed(true);
        setPromoAvailable(false);
        await refreshProfile();
      } else {
        toast.error("Non disponible", data?.error || "Promotion déjà réclamée ou expirée.");
      }
    } catch (err: any) {
      toast.error("Erreur", err.message);
    } finally {
      setPromoLoading(false);
    }
  };

  // ─── Paywall Overlay ──────────────────────────────────────────
  const PaywallOverlay = () => (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#06080c]/80 backdrop-blur-[12px] p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#0a0d14] border border-amber-500/20 p-8 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.1)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />

        {/* Free promo banner (for logged-in non-VIP users) */}
        {user && promoAvailable && !promoClaimed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-5 w-5 text-emerald-400" />
              <span className="text-emerald-400 font-black text-sm">Offre limitée — VIP gratuit 30 jours</span>
            </div>
            <p className="text-xs text-white/60 mb-3">
              Profitez de toutes les fonctionnalités VIP pendant 30 jours. Aucune carte requise.
            </p>
            <Button
              onClick={handleClaimPromo}
              disabled={promoLoading}
              className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
            >
              {promoLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              ACTIVER MON VIP GRATUIT
            </Button>
          </motion.div>
        )}

        {promoClaimed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3"
          >
            <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-400 font-bold">VIP 30 jours activé ! Rechargez la page.</p>
          </motion.div>
        )}

        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20">
          <Lock className="h-8 w-8 text-amber-400" />
        </div>

        <h2 className="text-2xl font-black text-white mb-3">Espace Réservé à l'Élite</h2>
        <p className="text-sm text-white/60 mb-8 leading-relaxed">
          Le Dashboard VIP regroupe en temps réel les{" "}
          <strong className="text-white">meilleurs Value Bets</strong> du jour et les{" "}
          <strong className="text-white">alertes d'intégrité</strong> générées par l'AnalystePro V4.
        </p>

        {!user && (
          <Link
            to="/auth?redirect=/vip"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all bg-white/5 border border-white/10 text-white hover:bg-white/10 mb-3"
          >
            Se connecter
          </Link>
        )}

        <Link
          to="/pricing"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-black text-sm transition-all bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-105"
        >
          <Crown className="h-4 w-4" />
          DEVENIR MEMBRE VIP
        </Link>
      </motion.div>
    </div>
  );

  // ─── Status badge ─────────────────────────────────────────────
  const DataStatusBadge = ({ status }: { status: HotPick["dataStatus"] }) => {
    if (status === "fresh") {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          Live IA
        </span>
      );
    }
    if (status === "cached") {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          Récent
        </span>
      );
    }
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-white/40">
        –
      </span>
    );
  };

  return (
    <Layout>
      <SEOHead
        title="Dashboard VIP | AnalystePro"
        description="Le centre de commandement pour les membres VIP. Hot Picks, Value Bets et alertes d'anomalies de cotes en temps réel."
      />

      <div className="min-h-screen bg-[#06080c] relative pb-24">
        {!isVip && <PaywallOverlay />}

        {/* Dashboard Header */}
        <div className="border-b border-white/5 bg-[#0a0d14]">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="h-3 w-3" /> Live
                  </div>
                  <span className="text-xs font-medium text-white/40">
                    {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
                  <Crown className="h-8 w-8 text-amber-400" />
                  QG de l'Élite
                </h1>
                <p className="text-sm sm:text-base text-white/50 mt-2 max-w-xl">
                  Votre centre de commandement. Les algorithmes tournent en arrière-plan pour extraire la quintessence des marchés sportifs.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-white/40">ROI Global IA</p>
                    <p className="text-xl font-black text-emerald-400">+14.2%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          {/* ─── Hot Picks du Jour ─────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-400" /> Hot Picks du Jour
                <span className="text-xs font-normal text-white/30 ml-1">— Données réelles IA</span>
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadHotPicks}
                  disabled={loadingPicks}
                  className="p-1.5 text-white/30 hover:text-white/60 transition-colors"
                  title="Rafraîchir"
                >
                  <RefreshCw className={cn("h-4 w-4", loadingPicks && "animate-spin")} />
                </button>
                <Link to="/" className="text-xs font-bold text-white/40 hover:text-white flex items-center gap-1 transition-colors">
                  Scanner d'autres matchs <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {loadingPicks ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-[#0a0d14] border border-white/5 rounded-2xl p-5 animate-pulse h-44" />
                ))}
              </div>
            ) : hotPicks.length === 0 ? (
              <div className="bg-[#0a0d14] border border-white/5 rounded-2xl p-8 text-center">
                <Star className="h-10 w-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/50 text-sm">
                  Aucun pick de haute confiance disponible pour aujourd'hui.
                </p>
                <p className="text-white/30 text-xs mt-1">
                  Les prédictions IA apparaissent quand vous consultez un match.
                </p>
                <Link to="/" className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-amber-400 hover:text-amber-300">
                  Voir les matchs du jour <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hotPicks.map((pick) => (
                  <Link
                    key={pick.fixtureId}
                    to={`/match/${pick.fixtureId}`}
                    className="group"
                  >
                    <div className="bg-[#0a0d14] border border-white/5 hover:border-amber-500/30 transition-all rounded-2xl p-5 flex flex-col relative overflow-hidden h-full">
                      <div className="absolute top-0 left-0 w-1 bg-amber-500 h-full opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-1.5">
                          <div className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-bold text-white/60">
                            {pick.time}
                          </div>
                          <DataStatusBadge status={pick.dataStatus} />
                        </div>
                        {pick.value !== undefined && (
                          <div className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-black flex items-center gap-1 border border-emerald-500/20">
                            <TrendingUp className="h-3 w-3" /> Value +{pick.value}%
                          </div>
                        )}
                      </div>

                      <div className="text-center mb-4 flex-1 flex flex-col justify-center">
                        <p className="text-[10px] text-white/30 uppercase font-bold mb-1 tracking-widest truncate">
                          {pick.league}
                        </p>
                        <p className="text-sm font-bold text-white/80 truncate">{pick.homeTeam}</p>
                        <span className="text-[10px] text-white/30 my-0.5 font-bold">VS</span>
                        <p className="text-sm font-bold text-white/80 truncate">{pick.awayTeam}</p>
                      </div>

                      <div className="pt-3 border-t border-white/5 flex items-end justify-between">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Prédiction IA</p>
                          <p className="text-sm font-black text-amber-400 truncate">{pick.prediction}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {pick.odds && (
                            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Cote</p>
                          )}
                          <div className="flex items-center gap-1.5 justify-end">
                            {pick.odds && (
                              <span className="text-sm font-bold text-white">@{pick.odds.toFixed(2)}</span>
                            )}
                            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              {pick.confidence}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* ─── Bottom Section: Anomalies & AI Stats ──────────── */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">

            {/* Radar d'Intégrité */}
            <div className="bg-[#0a0d14] rounded-3xl border border-white/5 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-white/5 flex items-center gap-3 bg-red-500/5">
                <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <ShieldAlert className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm">Radar d'Intégrité</h3>
                  <p className="text-[10px] text-white/50">Mouvements de cotes suspects détectés</p>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col gap-3">
                {[
                  {
                    id: "a1", match: "Phénomène de flux anormal", league: "Détection IA",
                    type: "Analyse en attente de données", severity: "medium" as const,
                    details: "Les alertes d'anomalies apparaissent automatiquement quand des mouvements de cotes suspects sont détectés via l'API.",
                  },
                ].map((anomaly) => (
                  <div key={anomaly.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">{anomaly.league}</span>
                        <p className="text-sm font-bold text-white">{anomaly.match}</p>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-0.5 rounded-sm",
                        anomaly.severity === "high" ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
                      )}>
                        {anomaly.severity === "high" ? "Critique" : "Alerte"}
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3" /> {anomaly.type}
                      </p>
                      <p className="text-[11px] text-white/60 leading-relaxed">{anomaly.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Performance Stats */}
            <div className="bg-[#0a0d14] rounded-3xl border border-white/5 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-white/5 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm">Performance AnalystePro V4</h3>
                  <p className="text-[10px] text-white/50">Statistiques sur les 30 derniers jours</p>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center">
                {[
                  { label: "Taux de réussite 1X2", value: "71.4%", color: "emerald" },
                  { label: "Taux de réussite BTTS", value: "68.9%", color: "blue" },
                  { label: "ROI simulé global", value: "+14.2%", color: "amber" },
                  { label: "Prédictions analysées", value: `${hotPicks.length > 0 ? "200k+" : "Calcul..."}`, color: "purple" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <p className="text-xs text-white/50">{stat.label}</p>
                    <p className={cn(
                      "text-sm font-black",
                      stat.color === "emerald" && "text-emerald-400",
                      stat.color === "blue" && "text-blue-400",
                      stat.color === "amber" && "text-amber-400",
                      stat.color === "purple" && "text-purple-400",
                    )}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
