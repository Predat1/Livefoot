import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

import { Check, Shield, Zap, Target, Lock, Crown, Star, ArrowLeft, Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
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

  useEffect(() => {
    // Chariow Widget Loader
    const script = document.createElement('script');
    script.src = 'https://js.chariowcdn.com/v1/widget.min.js';
    script.async = true;
    document.head.appendChild(script);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://js.chariowcdn.com/v1/widget.min.css';
    document.head.appendChild(link);

    return () => {
      try {
        if (document.head.contains(script)) document.head.removeChild(script);
        if (document.head.contains(link)) document.head.removeChild(link);
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    };
  }, []);

  const triggerChariow = (planId: string) => {
    if (!user) {
      toast.error(t("auth.login_required"));
      navigate("/auth");
      return;
    }

    const widget = document.getElementById(`chariow-${planId}`);
    const button = widget?.querySelector("button, .chariow-cta, [role='button']");
    if (button) {
      (button as HTMLElement).click();
    } else {
      // Fallback
      handleSubscribe(planId);
    }
  };

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
      
      // Update local state or reload to reflect VIP status
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      console.error("License activation error:", error);
      toast.error(error.message || t("pricing.license_error"));
    } finally {
      setIsActivating(false);
    }
  };

  const handleSubscribe = (planName: string) => {
    if (!user) {
      toast.error(t("auth.login_required"));
      navigate("/auth");
      return;
    }

    
    setIsProcessing(planName);
    
    // Fallback message if Chariow widget is not loaded
    toast.error(
      <div className="flex flex-col gap-1">
        <span className="font-bold text-red-400">Erreur de Paiement</span>
        <span className="text-white text-sm">Le module de paiement Chariow n'a pas pu être chargé. Veuillez rafraîchir la page ou contacter le support.</span>
      </div>
    );
    setIsProcessing(null);
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
              Débloquez l'IA <strong className="text-white">AnalystePro V3</strong>. Un algorithme propriétaire conçu pour repérer les failles des bookmakers, les mouvements de cotes suspects et les Value Bets à forte rentabilité.
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
                <div className="mt-1 text-[11px] font-medium text-white/30">
                  ≈ 6 550 FCFA
                </div>
              </div>

              <button 
                onClick={() => triggerChariow("weekly")}
                disabled={isProcessing !== null}
                className="w-full py-3 rounded-xl font-black text-sm transition-all bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2 mt-auto mb-6"
              >
                {isProcessing === "weekly" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("pricing.select")}
              </button>

              <div id="chariow-weekly" data-product-id="prd_ec21i6" data-store-domain="nhvjjgbn.mychariow.shop" data-style="tap" style={{ display: 'none' }}></div>

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
                <div className="mt-1 text-[11px] font-medium text-white/30">
                  ≈ 13 100 FCFA
                </div>
              </div>

              <button 
                onClick={() => triggerChariow("monthly")}
                disabled={isProcessing !== null}
                className="w-full py-3 rounded-xl font-black text-sm transition-all bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-auto mb-6"
              >
                {isProcessing === "monthly" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("pricing.start")}
              </button>

              <div id="chariow-monthly" data-product-id="prd_gjr4pb" data-store-domain="nhvjjgbn.mychariow.shop" data-style="tap" style={{ display: 'none' }}></div>

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
                onClick={() => triggerChariow("quarterly")}
                disabled={isProcessing !== null}
                className="w-full py-3 rounded-xl font-black text-sm transition-all bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2 mt-auto mb-6"
              >
                {isProcessing === "quarterly" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("pricing.select")}
              </button>

              <div id="chariow-quarterly" data-product-id="prd_g3msqc" data-store-domain="nhvjjgbn.mychariow.shop" data-style="tap" style={{ display: 'none' }}></div>

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
                onClick={() => triggerChariow("annual")}
                disabled={isProcessing !== null}
                className="w-full py-3 rounded-xl font-black text-sm transition-all bg-gradient-to-r from-amber-500 to-amber-400 hover:to-amber-300 text-black shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 mt-auto mb-6 relative z-10"
              >
                {isProcessing === "annual" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("pricing.join")}
              </button>

              <div id="chariow-annual" data-product-id="prd_c84m5a" data-store-domain="nhvjjgbn.mychariow.shop" data-style="tap" style={{ display: 'none' }}></div>

              <div className="space-y-3 relative z-10">
                {TIER_FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-4 w-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-amber-400" />
                    </div>
                    <span className="text-xs text-white/90 font-medium">{feature}</span>
                  </div>
                ))}
                {/* Extra Annual Feature */}
                <div className="flex items-start gap-3 pt-3 border-t border-white/5">
                  <div className="h-4 w-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="h-2.5 w-2.5 text-emerald-400" />
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">Économie instantanée de 90€</span>
                </div>
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
                <p className="text-sm text-white/60 leading-relaxed">L'AnalystePro V3 n'est pas un robot de conseils aléatoires. Il effectue des millions de calculs ELO, compare les marges et tourne sur des serveurs d'intelligence artificielle surpuissants (Double Poisson Model). Ce coût d'infrastructure garantit la meilleure précision du marché. Un seul pari Value Bet suffit généralement à rentabiliser le mois.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
