import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

import { Check, Shield, Zap, Target, Lock, Crown, ArrowLeft, Loader2, Brain, TrendingUp, Sparkles, Bell, Sliders, MessageSquare, Flame, ChevronRight, Star, AlertTriangle, BarChart3, Repeat2 } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const getTierFeatures = (t: any) => [
  t("pricing.features_title"),
  t("pricing.feature_1"),
  t("pricing.feature_2"),
  t("pricing.feature_3"),
  t("pricing.feature_4"),
  t("pricing.feature_5"),
];

export default function Pricing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const TIER_FEATURES = getTierFeatures(t);
  const [licenseKey, setLicenseKey] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  
  // ─── Handle Redirect from Chariow ─────────────────────────────
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      toast.success(t("pricing.payment_success_message") || "Paiement réussi ! Votre accès VIP est en cours d'activation.");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("checkout") === "cancel") {
      toast.error("Paiement annulé.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [t]);

  // ─── Checkout via Chariow Direct Link (Requested by user) ────
  const handleCheckout = (planId: string, productId: string) => {
    if (!user) {
      toast.error(t("auth.login_required"));
      navigate("/auth");
      return;
    }

    setIsProcessing(planId);
    
    try {
      // The user provided specific URLs: https://nhvjjgbn.mychariow.shop/prd_xxxxxx/checkout
      const storeDomain = "nhvjjgbn.mychariow.shop";
      
      const checkoutUrl = `https://${storeDomain}/${productId}/checkout`;
      
      console.log("Redirecting to direct checkout:", checkoutUrl);
      window.location.href = checkoutUrl;
    } catch (err: any) {
      console.error("Checkout redirection error:", err);
      toast.error("Impossible d'ouvrir la page de paiement. Réessayez.");
      setIsProcessing(null);
    }
  };

  // ─── License key activation ───────────────────────────────────
  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) return;
    if (!user) {
      toast.error(t("auth.login_required"));
      navigate("/auth");
      return;
    }

    setIsActivating(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-license", {
        body: { licenseKey: licenseKey.trim() },
      });

      if (error) throw error;
      
      toast.success(t("pricing.license_success"));
      setLicenseKey("");
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      console.error("License activation error:", error);
      toast.error(error.message || t("pricing.license_error"));
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <Layout>
      <SEOHead 
        title={t("pricing.title")}
        description={t("pricing.subtitle")}
      />
      
      <div className="min-h-screen bg-[#06080c] relative overflow-hidden pb-24">
        {/* Abstract Gold Background Glow */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-[60%] right-[-10%] w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="container relative z-10 pt-8 sm:pt-12 px-4 sm:px-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-bold bg-white/5 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" /> {t("common.back_home")}
            </Link>
          </div>

          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center p-4 rounded-3xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30 mb-6 shadow-[0_0_40px_rgba(245,158,11,0.15)] relative"
            >
              <div className="absolute inset-0 rounded-3xl overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50" />
              </div>
              <Crown className="h-12 w-12 text-amber-400 drop-shadow-lg" />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl font-black text-white mb-6 tracking-tight leading-[1.1]"
            >
              {t("pricing.title")}<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600">
                {t("pricing.subtitle")}
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
            >
              Débloquez l'IA <strong className="text-white">AnalystePro V4</strong>. Un algorithme propriétaire conçu pour repérer les failles des bookmakers, les mouvements de cotes suspects et les Value Bets à forte rentabilité.
            </motion.p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto items-stretch mb-20">
            
            {/* Weekly Tier */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-3xl p-6 border bg-[#0a0d14] border-white/10 hover:border-white/20 transition-all flex flex-col"
            >
              <h3 className="text-xl font-black text-white mb-2">{t("pricing.weekly_name")}</h3>
              <p className="text-xs text-white/50 mb-6">{t("pricing.weekly_desc")}</p>
              
              <div className="flex flex-col mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-white/30 line-through font-medium">{t("pricing.weekly_price_original")}</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-white">{t("pricing.weekly_price")}</span>
                  <span className="text-sm text-white/40 font-bold pb-1">{t("pricing.weekly_period")}</span>
                </div>
                <div className="mt-1 text-[11px] font-medium text-white/30">≈ 6 550 FCFA</div>
              </div>

              <button 
                onClick={() => handleCheckout("weekly", "prd_ec21i6")}
                disabled={isProcessing !== null}
                className="w-full py-3 rounded-xl font-black text-sm transition-all bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2 mt-auto mb-6"
              >
                {isProcessing === "weekly" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("pricing.select")}
              </button>

              <div className="space-y-3">
                {TIER_FEATURES.slice(0, 3).map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-4 w-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-amber-400" />
                    </div>
                    <span className="text-xs text-white/80">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Monthly Tier */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-3xl p-6 border bg-[#0a0d14] border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.05)] transition-all flex flex-col relative"
            >
              <div className="absolute top-0 right-0 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl z-20">
                {t("pricing.popular")}
              </div>
              <h3 className="text-xl font-black text-white mb-2">{t("pricing.monthly_name")}</h3>
              <p className="text-xs text-white/50 mb-6">{t("pricing.monthly_desc")}</p>
              
              <div className="flex flex-col mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-white/30 line-through font-medium">{t("pricing.monthly_price_original")}</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-white">{t("pricing.monthly_price")}</span>
                  <span className="text-sm text-white/40 font-bold pb-1">{t("pricing.monthly_period")}</span>
                </div>
                <div className="mt-1 text-[11px] font-medium text-white/30">≈ 13 100 FCFA</div>
              </div>

              <button 
                onClick={() => handleCheckout("monthly", "prd_gjr4pb")}
                disabled={isProcessing !== null}
                className="w-full py-3 rounded-xl font-black text-sm transition-all bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-auto mb-6"
              >
                {isProcessing === "monthly" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("pricing.start")}
              </button>

              <div className="space-y-3">
                {TIER_FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-4 w-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-amber-400" />
                    </div>
                    <span className="text-xs text-white/80">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quarterly Tier */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-3xl p-6 border bg-[#0a0d14] border-white/10 hover:border-white/20 transition-all flex flex-col relative"
            >
              <h3 className="text-xl font-black text-white mb-2">{t("pricing.quarterly_name")}</h3>
              <p className="text-xs text-white/50 mb-6">{t("pricing.quarterly_desc")}</p>
              
              <div className="flex flex-col mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-white/30 line-through font-medium">{t("pricing.quarterly_price_original")}</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-white">{t("pricing.quarterly_price")}</span>
                  <span className="text-sm text-white/40 font-bold pb-1">{t("pricing.quarterly_period")}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-medium text-white/30">≈ 32 800 FCFA</span>
                  <span className="text-[10px] font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 rounded">Économisez 10€</span>
                </div>
              </div>

              <button 
                onClick={() => handleCheckout("quarterly", "prd_g3msqc")}
                disabled={isProcessing !== null}
                className="w-full py-3 rounded-xl font-black text-sm transition-all bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2 mt-auto mb-6"
              >
                {isProcessing === "quarterly" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("pricing.select")}
              </button>

              <div className="space-y-3">
                {TIER_FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-4 w-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-amber-400" />
                    </div>
                    <span className="text-xs text-white/80">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Premium Tier (Annual) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-3xl p-6 border bg-[#0a0d14] border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative overflow-hidden transition-all z-10 flex flex-col scale-100 sm:scale-105"
            >
              <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl z-20">
                {t("pricing.best_choice")}
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
              
              <h3 className="text-xl font-black text-white mb-2 relative z-10">{t("pricing.annual_name")}</h3>
              <p className="text-xs text-white/50 mb-6 relative z-10">{t("pricing.annual_desc")}</p>
              
              <div className="flex flex-col mb-8 relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-white/30 line-through font-medium">{t("pricing.annual_price_original")}</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-amber-400">{t("pricing.annual_price")}</span>
                  <span className="text-sm text-white/40 font-bold pb-1">{t("pricing.annual_period")}</span>
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[11px] font-medium text-amber-500/50">≈ 98 400 FCFA</span>
                  <span className="text-[10px] font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 rounded w-fit">Soit 12,49€ par mois (-40%)</span>
                </div>
              </div>

              <button 
                onClick={() => handleCheckout("annual", "prd_c84m5a")}
                disabled={isProcessing !== null}
                className="w-full py-3 rounded-xl font-black text-sm transition-all bg-gradient-to-r from-amber-500 to-amber-400 hover:to-amber-300 text-black shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 mt-auto mb-6 relative z-10"
              >
                {isProcessing === "annual" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("pricing.join")}
              </button>

              <div className="space-y-3 relative z-10">
                {TIER_FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-4 w-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-amber-400" />
                    </div>
                    <span className="text-xs text-white/90 font-medium">{feature}</span>
                  </div>
                ))}
                <div className="flex items-start gap-3 pt-3 border-t border-white/5">
                  <div className="h-4 w-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="h-2.5 w-2.5 text-emerald-400" />
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">Économie instantanée de 90€</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
               SECTION : 10 ANS D'AVANCE — Fonctionnalités exclusives
          ═══════════════════════════════════════════════════════════════ */}
          <div className="mb-28">
            {/* Header section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-black uppercase tracking-widest mb-5">
                <Sparkles className="h-3 w-3" /> Exclusif VIP — Inexistant chez nos concurrents
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 leading-tight">
                10 ans d'avance sur <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">l'industrie</span>
              </h2>
              <p className="text-white/50 text-base max-w-xl mx-auto">Ces 5 fonctionnalités n'existent sur aucun autre service de pronostics au monde. Elles sont <strong className="text-white">réservées aux membres VIP</strong>.</p>
            </motion.div>

            <div className="space-y-6 max-w-5xl mx-auto">

              {/* Feature 1: IA Conversationnelle */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative rounded-3xl overflow-hidden border border-violet-500/20 bg-gradient-to-r from-violet-950/60 to-[#0a0d14] p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start group hover:border-violet-500/40 transition-all"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-400 to-violet-700 rounded-l-3xl" />
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-violet-500/5 to-transparent pointer-events-none" />
                <div className="shrink-0">
                  <div className="h-14 w-14 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-500/10">
                    <MessageSquare className="h-7 w-7 text-violet-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">Exclusif Monde</span>
                    <span className="text-[10px] font-bold text-white/30">Inexistant sur BeSoccer, SofaScore, Flashscore</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-2">🧠 IA Conversationnelle sur chaque match</h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-4">Posez n'importe quelle question à l'IA directement sur la page du match. <em className="text-white/80">"Et si Benzema ne joue pas ?"</em> <em className="text-white/80">"Pourquoi tu préfères le nul ?"</em> — L'IA répond avec les données réelles du match en contexte.</p>
                  <div className="flex flex-wrap gap-2">
                    {["Analyse tactique en temps réel", "Scénarios alternatifs", "Explication des probabilités"].map(t => (
                      <span key={t} className="text-[11px] text-violet-300 bg-violet-500/10 border border-violet-500/15 px-3 py-1 rounded-full font-semibold">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 self-center opacity-30 group-hover:opacity-60 transition-opacity">
                  <ChevronRight className="h-6 w-6 text-violet-400" />
                </div>
              </motion.div>

              {/* Feature 2: Value Bet Detector */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative rounded-3xl overflow-hidden border border-emerald-500/20 bg-gradient-to-r from-emerald-950/60 to-[#0a0d14] p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start group hover:border-emerald-500/40 transition-all"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-emerald-700 rounded-l-3xl" />
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
                <div className="shrink-0">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                    <TrendingUp className="h-7 w-7 text-emerald-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">ROI Prouvé</span>
                    <span className="text-[10px] font-bold text-white/30">Les bookmakers détestent ça</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-2">📊 Détecteur de Value Bet en temps réel</h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-4">Notre modèle Poisson Dixon-Coles calcule la probabilité réelle de chaque résultat. Quand elle dépasse la probabilité implicite d'un bookmaker de <strong className="text-white">+15%</strong>, un badge <strong className="text-emerald-400">VALUE BET 🔥</strong> s'allume instantanément — avant que la cote ne se corrige.</p>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <AlertTriangle className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-xs text-emerald-300 font-semibold">Exemple : Modèle donne 68% victoire domicile → Cote bookmaker implique 45% → Écart +23% → VALUE BET détecté</span>
                  </div>
                </div>
              </motion.div>

              {/* Feature 3: Live Scenario Simulator */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative rounded-3xl overflow-hidden border border-blue-500/20 bg-gradient-to-r from-blue-950/60 to-[#0a0d14] p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start group hover:border-blue-500/40 transition-all"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-blue-700 rounded-l-3xl" />
                <div className="shrink-0">
                  <div className="h-14 w-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/10">
                    <Sliders className="h-7 w-7 text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Live Uniquement</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-2">🔄 Simulateur de scénarios live</h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-4">Match en cours ? Utilisez le simulateur interactif : <em className="text-white/80">"Si l'équipe A marque dans les 10 prochaines minutes"</em> → le modèle Poisson recalcule instantanément les probabilités selon la minute, le score et le momentum actuel.</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "But à 70'→", val: "+34%", color: "text-emerald-400" },
                      { label: "But à 85'→", val: "+18%", color: "text-amber-400" },
                      { label: "Carton rouge→", val: "-22%", color: "text-red-400" },
                    ].map(s => (
                      <div key={s.label} className="text-center p-2 rounded-xl bg-blue-500/5 border border-blue-500/10">
                        <div className="text-[10px] text-white/40 mb-1">{s.label}</div>
                        <div className={`text-lg font-black ${s.color}`}>{s.val}</div>
                        <div className="text-[9px] text-white/30">prob victoire</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Feature 4: Profil Parieur Personnalisé */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative rounded-3xl overflow-hidden border border-amber-500/20 bg-gradient-to-r from-amber-950/40 to-[#0a0d14] p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start group hover:border-amber-500/40 transition-all"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-amber-700 rounded-l-3xl" />
                <div className="shrink-0">
                  <div className="h-14 w-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
                    <Brain className="h-7 w-7 text-amber-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">IA Adaptive</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-2">🎯 Profil de parieur personnalisé</h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-4">L'IA mémorise vos préférences et adapte ses recommandations. Vous misez plutôt sur BTTS ? Sur les gros cotes ? Sur les handicaps asiatiques ? Le système apprend et ne vous propose <strong className="text-white">que ce qui correspond à votre style</strong> — et à votre bankroll.</p>
                  <div className="flex flex-wrap gap-2">
                    {["BTTS specialist", "Value Hunter", "Safe bettor", "Combo builder", "Asian handicap"].map(tag => (
                      <span key={tag} className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/15 px-3 py-1 rounded-full font-semibold">{tag}</span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Feature 5: Alertes Prédictives Push */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative rounded-3xl overflow-hidden border border-red-500/20 bg-gradient-to-r from-red-950/40 to-[#0a0d14] p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start group hover:border-red-500/40 transition-all"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-400 to-red-700 rounded-l-3xl" />
                <div className="shrink-0">
                  <div className="h-14 w-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/10 relative">
                    <Bell className="h-7 w-7 text-red-400" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-[#06080c] flex items-center justify-center">
                      <span className="text-[8px] font-black text-white">!</span>
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">Temps Réel</span>
                    <span className="text-[10px] font-bold text-white/30">Avant tout le monde</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-2">⚡ Alertes prédictives push</h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-4">Recevez une notification push dès qu'un événement modifie significativement les probabilités d'un match que vous suivez : blessure de dernière minute, changement de cote brutal, conditions météo défavorables.</p>
                  <div className="space-y-2">
                    {[
                      { icon: "🏥", text: "Arsenal : Ramsdale forfait — Under 2.5 passe de 42% à 61%", time: "2h avant" },
                      { icon: "📉", text: "Cote 1X2 PSG chute de 1.45→1.28 en 10min (mouvement suspect)", time: "45min avant" },
                      { icon: "🌧️", text: "Pluie battante à Manchester — BTTS recalibré à la baisse", time: "3h avant" },
                    ].map((a, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-red-500/5 border border-red-500/10">
                        <span className="text-base shrink-0">{a.icon}</span>
                        <span className="text-xs text-white/70 flex-1">{a.text}</span>
                        <span className="text-[10px] text-red-400 font-bold shrink-0">{a.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

            </div>

            {/* CTA récapitulatif */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 text-center"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <Star className="h-5 w-5 text-amber-400" />
                <span className="text-sm text-white font-bold">Ces 5 fonctionnalités sont incluses dans <span className="text-amber-400">tous les plans VIP</span> — dès le premier jour</span>
                <Star className="h-5 w-5 text-amber-400" />
              </div>
            </motion.div>
          </div>

          {/* License Activation Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl mx-auto mb-20 p-8 rounded-3xl bg-white/5 border border-white/10 text-center relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
            <h2 className="text-xl font-black text-white mb-2">{t("pricing.have_license")}</h2>
            <p className="text-sm text-white/50 mb-6">{t("pricing.license_help")}</p>
            
            <form onSubmit={handleActivateLicense} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                placeholder={t("pricing.license_placeholder")}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-colors font-mono"
              />
              <Button 
                type="submit"
                disabled={isActivating || !licenseKey.trim()}
                className="bg-white text-black hover:bg-white/90 rounded-xl font-black px-6"
              >
                {isActivating ? <Loader2 className="h-4 w-4 animate-spin" /> : t("pricing.activate_license")}
              </Button>
            </form>
          </motion.div>

          {/* Security / Trust Badges */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-6 sm:gap-12 opacity-60 mb-24"
          >
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-white" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">Paiement Sécurisé</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-white" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">Anonymat Garanti</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-white" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">IA Transparente</span>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto mt-20">
            <h3 className="text-2xl font-black text-white text-center mb-10">Questions Fréquentes</h3>
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h4 className="text-base font-bold text-white mb-2">Comment fonctionne la détection de matchs truqués ?</h4>
                <p className="text-sm text-white/60 leading-relaxed">Notre algorithme scanne en temps réel les cotes de plus de 60 bookmakers asiatiques et européens. S'il détecte un mouvement de cote massif (chute inexpliquée) ou une faille entre la probabilité mathématique (Poisson) et la cote, l'IA déclenche une alerte rouge "Value Bet suspect".</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h4 className="text-base font-bold text-white mb-2">Puis-je annuler mon abonnement mensuel ?</h4>
                <p className="text-sm text-white/60 leading-relaxed">Oui, absolument. Vous pouvez annuler votre abonnement à tout moment d'un simple clic dans votre espace client. Vous continuerez d'avoir accès jusqu'à la fin de la période facturée.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h4 className="text-base font-bold text-white mb-2">{t("pricing.faq_why_expensive_title")}</h4>
                <p className="text-sm text-white/60 leading-relaxed">L'AnalystePro V4 n'est pas un robot de conseils aléatoires. Il implémente le modèle Double Poisson Dixon-Coles, la pondération ELO exponentielle, la détection de Value Bets en temps réel et une IA conversationnelle — et tourne sur des serveurs d'intelligence artificielle surpuissants (Gemini 2.5 Flash + fallback Claude). Ce coût d'infrastructure garantit la meilleure précision du marché. Un seul pari Value Bet suffit généralement à rentabiliser le mois.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
