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
import TelegramBanner from "@/components/TelegramBanner";
import { trackConversionEvent } from "@/lib/conversionTracking";

// ─── Features par plan ───────────────────────────────────────

// Features de base communes à tous les plans
const BASE_FEATURES = [
  { icon: "🤖", text: "Accès illimité à l'IA AnalystePro V4", highlight: false },
  { icon: "🎯", text: "Détecteur de matchs truqués & anomalies de cotes", highlight: false },
  { icon: "📈", text: "Value Bets exclusifs générés par l'IA", highlight: false },
  { icon: "📊", text: "Confiance par marché (1X2, BTTS, O/U, Handicap)", highlight: false },
  { icon: "🔢", text: "Modèle Double Poisson Dixon-Coles & ELO", highlight: false },
  { icon: "🚫", text: "Sans publicité", highlight: false },
];

const WEEKLY_FEATURES = [
  ...BASE_FEATURES,
  { icon: "🔒", text: "Value Bet Détecteur temps réel", highlight: false, locked: true },
  { icon: "🔒", text: "IA Conversationnelle sur chaque match", highlight: false, locked: true },
  { icon: "🔒", text: "Simulateur de scénarios live", highlight: false, locked: true },
  { icon: "🔒", text: "Profil parieur personnalisé", highlight: false, locked: true },
  { icon: "🔒", text: "Alertes push prédictives", highlight: false, locked: true },
];

const MONTHLY_FEATURES = [
  ...BASE_FEATURES,
  { icon: "🔥", text: "Value Bet Détecteur temps réel", highlight: true },
  { icon: "🧠", text: "IA Conversationnelle sur chaque match", highlight: true },
  { icon: "🔒", text: "Simulateur de scénarios live", highlight: false, locked: true },
  { icon: "🔒", text: "Profil parieur personnalisé", highlight: false, locked: true },
  { icon: "🔒", text: "Alertes push prédictives", highlight: false, locked: true },
];

const QUARTERLY_FEATURES = [
  ...BASE_FEATURES,
  { icon: "🔥", text: "Value Bet Détecteur temps réel", highlight: false },
  { icon: "🧠", text: "IA Conversationnelle sur chaque match", highlight: false },
  { icon: "🔄", text: "Simulateur de scénarios live (Poisson interactif)", highlight: true },
  { icon: "🎯", text: "Profil parieur personnalisé (IA adaptive)", highlight: true },
  { icon: "🔒", text: "Alertes push prédictives", highlight: false, locked: true },
];

const ANNUAL_FEATURES = [
  ...BASE_FEATURES,
  { icon: "🔥", text: "Value Bet Détecteur temps réel", highlight: false },
  { icon: "🧠", text: "IA Conversationnelle sur chaque match", highlight: false },
  { icon: "🔄", text: "Simulateur de scénarios live", highlight: false },
  { icon: "🎯", text: "Profil parieur personnalisé", highlight: false },
  { icon: "⚡", text: "Alertes push prédictives exclusives", highlight: true },
  { icon: "👑", text: "Accès prioritaire aux nouvelles fonctionnalités", highlight: true },
  { icon: "💰", text: "Économie instantanée de 90€ vs mensuel", highlight: true },
];

const PLAN_VALUES: Record<string, number> = {
  weekly: 9.99,
  monthly: 19.99,
  quarterly: 49.99,
  annual: 149.99,
};

export default function Pricing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [licenseKey, setLicenseKey] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  
  // ─── Handle Redirect from Chariow ─────────────────────────────
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      trackConversionEvent({
        goalName: "VIP Checkout Success",
        userId: user?.id,
        metadata: {
          source: "pricing",
          checkout_status: "success",
        },
      });
      toast.success(t("pricing.payment_success_message") || "Paiement réussi ! Votre accès VIP est en cours d'activation.");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("checkout") === "cancel") {
      trackConversionEvent({
        goalName: "VIP Checkout Cancel",
        userId: user?.id,
        metadata: {
          source: "pricing",
          checkout_status: "cancel",
        },
      });
      toast.error("Paiement annulé.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [t, user?.id]);

  // ─── Checkout via Chariow Direct Link (Requested by user) ────
  const handleCheckout = (planId: string, productId: string) => {
    if (!user) {
      toast.error(t("auth.login_required"));
      navigate("/auth");
      return;
    }

    setIsProcessing(planId);
    trackConversionEvent({
      goalName: "VIP Checkout Started",
      userId: user.id,
      valueEur: PLAN_VALUES[planId],
      metadata: {
        source: "pricing",
        plan_id: planId,
        product_id: productId,
      },
    });
    
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

              <div className="space-y-2.5">
                {WEEKLY_FEATURES.map((f, i) => (
                  <div key={i} className={`flex items-start gap-2.5 ${f.locked ? "opacity-35" : ""}`}>
                    <span className="text-xs shrink-0 mt-0.5">{f.icon}</span>
                    <span className={`text-xs ${f.locked ? "text-white/30 line-through" : "text-white/80"}`}>{f.text}</span>
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

              <div className="space-y-2.5">
                {MONTHLY_FEATURES.map((f, i) => (
                  <div key={i} className={`flex items-start gap-2.5 ${f.locked ? "opacity-35" : ""}`}>
                    <span className="text-xs shrink-0 mt-0.5">{f.icon}</span>
                    <span className={`text-xs font-${f.highlight ? "bold" : "normal"} ${f.locked ? "text-white/30 line-through" : f.highlight ? "text-amber-300" : "text-white/80"}`}>{f.text}</span>
                    {f.highlight && <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 rounded-full shrink-0">NEW</span>}
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

              <div className="space-y-2.5">
                {QUARTERLY_FEATURES.map((f, i) => (
                  <div key={i} className={`flex items-start gap-2.5 ${f.locked ? "opacity-35" : ""}`}>
                    <span className="text-xs shrink-0 mt-0.5">{f.icon}</span>
                    <span className={`text-xs font-${f.highlight ? "bold" : "normal"} ${f.locked ? "text-white/30 line-through" : f.highlight ? "text-emerald-300" : "text-white/80"}`}>{f.text}</span>
                    {f.highlight && <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 rounded-full shrink-0">NEW</span>}
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

              <div className="space-y-2.5 relative z-10">
                {ANNUAL_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-xs shrink-0 mt-0.5">{f.icon}</span>
                    <span className={`text-xs ${f.highlight ? "text-amber-300 font-bold" : "text-white/80"}`}>{f.text}</span>
                    {f.highlight && <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 rounded-full shrink-0">EXCLU</span>}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ═══ Tableau comparatif des fonctionnalités ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-24 max-w-5xl mx-auto"
          >
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-black uppercase tracking-widest mb-4">
                <Sparkles className="h-3 w-3" /> 10 ans d'avance — Fonctionnalités exclusives
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white">Ce que <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">personne d'autre ne fait</span></h2>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0a0d14] overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-5 border-b border-white/10">
                <div className="p-4 text-xs font-black text-white/40 uppercase tracking-widest col-span-1">Fonctionnalité</div>
                {[
                  { label: "Hebdo", color: "text-white/60" },
                  { label: "Mensuel", color: "text-amber-400" },
                  { label: "Trimestriel", color: "text-emerald-400" },
                  { label: "Annuel", color: "text-amber-300" },
                ].map(h => (
                  <div key={h.label} className="p-4 text-center">
                    <span className={`text-xs font-black uppercase tracking-widest ${h.color}`}>{h.label}</span>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {[
                {
                  icon: "🤖", label: "AnalystePro V4", desc: "Pronos 1X2 / BTTS / O/U / Score",
                  weekly: true, monthly: true, quarterly: true, annual: true,
                },
                {
                  icon: "📊", label: "Value Bet Détecteur", desc: "Alerte quand l'IA bat le bookmaker de +15%",
                  weekly: false, monthly: true, quarterly: true, annual: true,
                  badge: { text: "ROI prouvé", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                },
                {
                  icon: "🧠", label: "IA Conversationnelle", desc: "Posez vos questions sur chaque match",
                  weekly: false, monthly: true, quarterly: true, annual: true,
                  badge: { text: "Exclusif monde", color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
                },
                {
                  icon: "🔄", label: "Simulateur scénarios live", desc: "Recalcul Poisson en temps réel",
                  weekly: false, monthly: false, quarterly: true, annual: true,
                  badge: { text: "Temps réel", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
                },
                {
                  icon: "🎯", label: "Profil parieur IA", desc: "Recommandations adaptées à votre style",
                  weekly: false, monthly: false, quarterly: true, annual: true,
                  badge: { text: "IA adaptive", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                },
                {
                  icon: "⚡", label: "Alertes push prédictives", desc: "Blessures / mouvements cotes / météo",
                  weekly: false, monthly: false, quarterly: false, annual: true,
                  badge: { text: "Annuel only", color: "text-red-400 bg-red-500/10 border-red-500/20" },
                },
              ].map((row, i) => (
                <div key={i} className={`grid grid-cols-5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors`}>
                  <div className="p-4 flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{row.icon}</span>
                      <span className="text-xs font-bold text-white">{row.label}</span>
                      {row.badge && (
                        <span className={`hidden sm:inline text-[9px] font-black border px-1.5 py-0.5 rounded-full ${row.badge.color}`}>{row.badge.text}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/30 pl-7">{row.desc}</span>
                  </div>
                  {(["weekly", "monthly", "quarterly", "annual"] as const).map(plan => (
                    <div key={plan} className="p-4 flex items-center justify-center">
                      {row[plan] ? (
                        <div className="h-6 w-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center">
                          <Lock className="h-3 w-3 text-white/20" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Telegram community CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto mb-10"
          >
            <TelegramBanner variant="card" dismissible={false} />
          </motion.div>

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
