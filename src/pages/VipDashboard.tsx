import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Crown, AlertTriangle, TrendingUp, Lock, ArrowRight, Activity, ShieldAlert, Star, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Mock data for the dashboard presentation
const MOCK_HOT_PICKS = [
  {
    id: 1,
    homeTeam: "Real Madrid",
    awayTeam: "Manchester City",
    prediction: "BTTS - Oui",
    confidence: 88,
    odds: 1.65,
    value: 12,
    time: "21:00"
  },
  {
    id: 2,
    homeTeam: "Arsenal",
    awayTeam: "Bayern Munich",
    prediction: "Victoire Arsenal",
    confidence: 82,
    odds: 2.10,
    value: 18,
    time: "21:00"
  },
  {
    id: 3,
    homeTeam: "PSG",
    awayTeam: "FC Barcelone",
    prediction: "Over 2.5 Buts",
    confidence: 79,
    odds: 1.85,
    value: 9,
    time: "Demain"
  }
];

const MOCK_ANOMALIES = [
  {
    id: 1,
    match: "Fenerbahçe vs Galatasaray",
    league: "Süper Lig",
    type: "Chute de cote anormale",
    details: "La cote de Galatasaray est passée de 2.80 à 2.10 en 30 minutes sans raison apparente (blessure/compo).",
    severity: "high"
  },
  {
    id: 2,
    match: "Juventus vs AC Milan",
    league: "Serie A",
    type: "Draw Collapse (Biscotto)",
    details: "Probabilité du match nul estimée à 42% par le marché. Forte concentration des mises sur le Nul.",
    severity: "medium"
  }
];

export default function VipDashboard() {
  const { user, isVip } = useAuth();
  const navigate = useNavigate();

  // If user is not authenticated at all, we still show the paywall
  // If they are authenticated but not VIP, we show the paywall
  
  const PaywallOverlay = () => (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#06080c]/80 backdrop-blur-[12px] p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#0a0d14] border border-amber-500/20 p-8 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.1)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
        
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20">
          <Lock className="h-8 w-8 text-amber-400" />
        </div>
        
        <h2 className="text-2xl font-black text-white mb-3">Espace Réservé à l'Élite</h2>
        <p className="text-sm text-white/60 mb-8 leading-relaxed">
          Le Dashboard VIP regroupe en temps réel les <strong className="text-white">meilleurs Value Bets</strong> du jour et les <strong className="text-white">alertes d'intégrité</strong> générées par l'AnalystePro V3.
        </p>
        
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
          
          {/* Top Section: Hot Picks */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-400" /> Hot Picks du Jour
              </h2>
              <Link to="/" className="text-xs font-bold text-white/40 hover:text-white flex items-center gap-1 transition-colors">
                Scanner d'autres matchs <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MOCK_HOT_PICKS.map((pick) => (
                <div key={pick.id} className="bg-[#0a0d14] border border-white/5 hover:border-amber-500/30 transition-colors rounded-2xl p-5 flex flex-col relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 bg-amber-500 h-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="px-2.5 py-1 rounded-md bg-white/5 text-[10px] font-bold text-white/60">
                      {pick.time}
                    </div>
                    <div className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-black flex items-center gap-1 border border-emerald-500/20">
                      <TrendingUp className="h-3 w-3" /> Value +{pick.value}%
                    </div>
                  </div>
                  
                  <div className="text-center mb-6 flex-1 flex flex-col justify-center">
                    <p className="text-sm font-bold text-white/80">{pick.homeTeam}</p>
                    <span className="text-[10px] text-white/30 my-1 font-bold">VS</span>
                    <p className="text-sm font-bold text-white/80">{pick.awayTeam}</p>
                  </div>
                  
                  <div className="pt-4 border-t border-white/5 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Prédiction IA</p>
                      <p className="text-sm font-black text-amber-400">{pick.prediction}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Cote & Confiance</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">@{pick.odds.toFixed(2)}</span>
                        <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{pick.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom Section: Anomalies & Arbitrage */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
            
            {/* Anomalies */}
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
                {MOCK_ANOMALIES.map((anomaly) => (
                  <div key={anomaly.id} className="p-4 rounded-xl border border-white/5 bg-white/3">
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
                  <h3 className="font-black text-white text-sm">Performance AnalystePro V3</h3>
                  <p className="text-[10px] text-white/50">Statistiques sur les 30 derniers jours</p>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <p className="text-2xl font-black text-emerald-400 mb-1">87%</p>
                    <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Hit Rate (1N2)</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <p className="text-2xl font-black text-amber-400 mb-1">2.15</p>
                    <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Cote Moyenne Gagnante</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <p className="text-2xl font-black text-white mb-1">142</p>
                    <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Value Bets Détectés</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <p className="text-2xl font-black text-cyan-400 mb-1">18%</p>
                    <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Yield Moyen</p>
                  </div>
                </div>
              </div>
            </div>
            
          </section>
        </div>
      </div>
    </Layout>
  );
}
