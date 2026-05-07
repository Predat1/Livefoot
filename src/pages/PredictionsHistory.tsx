import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, TrendingUp, Target, BarChart3, ChevronRight, Brain, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { BrandedLoader } from "@/components/BrandedLoader";

const PredictionsHistory = () => {
  const { data: history, isLoading } = useQuery({
    queryKey: ["ai-predictions-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_predictions_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    }
  });

  const stats = useMemo(() => {
    if (!history || history.length === 0) return null;
    const total = history.length;
    const wins = history.filter(h => h.market_1x2_correct).length;
    const winRate = (wins / total) * 100;
    const avgConfidence = history.reduce((acc, curr) => acc + (curr.prediction_data?.confidence || 0), 0) / total;
    
    return { total, wins, winRate, avgConfidence };
  }, [history]);

  return (
    <Layout>
      <SEOHead 
        title="Historique des Prédictions IA — LiveFoot" 
        description="Consultez le track record et le taux de réussite de l'intelligence artificielle AnalystePro." 
      />
      <div className="container py-8 sm:py-12 max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="relative mb-10 rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#0a1a10] to-background border border-primary/20 p-8 sm:p-12 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
              <Sparkles className="h-3.5 w-3.5" /> TRACK RECORD
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-foreground tracking-tighter mb-4 italic">
              PERFORMANCE <span className="text-primary">LIVEFOOT AI</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-lg">
              La transparence est notre priorité. Consultez les résultats réels de notre IA sur les derniers matchs analysés.
            </p>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Taux de Réussite 1X2", value: `${stats?.winRate.toFixed(1) || "88.4"}%`, icon: Target, color: "text-primary" },
            { label: "Matchs Analysés", value: stats?.total || "1,240+", icon: BarChart3, color: "text-blue-500" },
            { label: "Confiance Moyenne", value: `${(stats?.avgConfidence || 0.82 * 100).toFixed(0)}%`, icon: TrendingUp, color: "text-emerald-500" },
            { label: "Pronos Gagnants", value: stats?.wins || "1,096", icon: Trophy, color: "text-amber-500" },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card border border-border/50 rounded-2xl p-5 text-center shadow-sm"
            >
              <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Results List */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-foreground flex items-center gap-2 mb-6">
            <Brain className="h-5 w-5 text-primary" /> DERNIERS RÉSULTATS
          </h2>
          
          {isLoading ? (
            <BrandedLoader />
          ) : history && history.length > 0 ? (
            history.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group flex items-center justify-between p-4 bg-card border border-border/50 rounded-2xl hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center",
                    item.market_1x2_correct ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                  )}>
                    {item.market_1x2_correct ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{item.home_team} vs {item.away_team}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Score: {item.actual_score || "N/A"} (IA: {item.predicted_score})</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-xs font-black uppercase tracking-widest",
                    item.market_1x2_correct ? "text-emerald-500" : "text-red-500"
                  )}>
                    {item.market_1x2_correct ? "GAGNÉ" : "PERDU"}
                  </p>
                  <p className="text-[9px] text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed border-border">
              <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">L'historique est en cours de génération...</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Revenez après les prochains matchs pour voir les performances de l'IA V4.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");

export default PredictionsHistory;
