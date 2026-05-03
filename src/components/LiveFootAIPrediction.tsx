import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, TrendingUp, Shield, Zap, ChevronRight, Sparkles, Target, Share2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { generatePrediction, type LiveFootAIPrediction, type TeamFormData } from "@/lib/livefoot-ai";
import { useTeamForm, useHeadToHead } from "@/hooks/useApiFootball";
import { toast } from "sonner";

interface LiveFootAIPredictionCardProps {
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeLogo?: string;
  awayLogo?: string;
  standings?: any[];
  injuries?: { home: number; away: number };
  apiPredictions?: any;
  aiExpertPrediction?: {
    analysis: string;
    predictedScore: string;
    confidence: number;
    keyFactor: string;
  };
}

const riskColors = {
  low: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30", label: "Faible risque" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30", label: "Risque modéré" },
  high: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/30", label: "Risque élevé" },
};

const LiveFootAIPredictionCard = ({
  homeTeamId, awayTeamId, homeTeamName, awayTeamName,
  homeLogo, awayLogo, standings, injuries, apiPredictions,
  aiExpertPrediction,
}: LiveFootAIPredictionCardProps) => {
  const [isCopying, setIsCopying] = useState(false);
  const { data: homeFormData } = useTeamForm(homeTeamId);
  const { data: awayFormData } = useTeamForm(awayTeamId);
  const { data: h2hData } = useHeadToHead(homeTeamId, awayTeamId);

  const prediction = useMemo<LiveFootAIPrediction | null>(() => {
    // Priority 0: Use AI Expert Prediction from OpenRouter if available
    if (aiExpertPrediction) {
      try {
        const [homeScore, awayScore] = aiExpertPrediction.predictedScore.split("-").map(Number);
        const outcome = homeScore > awayScore ? "home" : homeScore < awayScore ? "away" : "draw";
        
        return {
          outcome,
          confidence: Math.round(aiExpertPrediction.confidence * 100),
          predictedScore: { home: homeScore, away: awayScore },
          probabilities: { home: 0, draw: 0, away: 0 }, // We might not have these from expert but we can estimate or leave as 0
          factors: [{
            icon: "🧠",
            label: "Analyse Expert",
            description: aiExpertPrediction.keyFactor,
            impact: "neutral",
            team: "both"
          }],
          advice: aiExpertPrediction.analysis,
          risk: aiExpertPrediction.confidence > 0.7 ? "low" : "medium",
          bestBets: [
            { type: "AI", label: `Oracle: ${aiExpertPrediction.predictedScore}`, confidence: Math.round(aiExpertPrediction.confidence * 100), emoji: "✨" }
          ],
          isExpert: true
        };
      } catch (e) {
        console.error("Error mapping Expert prediction:", e);
      }
    }

    // Priority 1: Use API Predictions if available
    if (apiPredictions) {
      try {
        const p = apiPredictions.predictions;
        const h2h = apiPredictions.h2h || [];
        const comp = apiPredictions.comparison;

        // Map API percent strings to numbers
        const homeProb = parseInt(p.percent.home) || 33;
        const drawProb = parseInt(p.percent.draw) || 34;
        const awayProb = parseInt(p.percent.away) || 33;

        const outcome = p.winner.id === parseInt(homeTeamId) ? "home" 
          : p.winner.id === parseInt(awayTeamId) ? "away" : "draw";

        // Map factors from comparison
        const factors: any[] = [];
        if (comp) {
          if (parseInt(comp.form.home) > parseInt(comp.form.away) + 10) {
            factors.push({ icon: "🔥", label: "Forme", description: `${homeTeamName} a une meilleure dynamique (${comp.form.home})`, impact: "positive", team: "home" });
          }
          if (parseInt(comp.att.home) > parseInt(comp.att.away) + 10) {
            factors.push({ icon: "🎯", label: "Attaque", description: `Offensive plus percutante pour ${homeTeamName}`, impact: "positive", team: "home" });
          }
          if (parseInt(comp.def.away) > parseInt(comp.def.home) + 10) {
            factors.push({ icon: "🛡️", label: "Défense", description: `Solidité défensive pour ${awayTeamName}`, impact: "positive", team: "away" });
          }
        }

        return {
          outcome,
          confidence: Math.max(homeProb, drawProb, awayProb),
          predictedScore: { 
            home: parseInt(p.goals.home) || 0, 
            away: parseInt(p.goals.away) || 0 
          },
          probabilities: { home: homeProb, draw: drawProb, away: awayProb },
          factors: factors.slice(0, 5),
          advice: p.advice,
          risk: (Math.max(homeProb, drawProb, awayProb) > 60) ? "low" : "medium",
          bestBets: [
            { type: "API", label: p.advice, confidence: Math.max(homeProb, drawProb, awayProb), emoji: "✅" }
          ]
        };
      } catch (e) {
        console.error("Error mapping API prediction:", e);
      }
    }

    // Priority 2: Fallback to local algorithm
    if (!homeFormData || !awayFormData) return null;

    return generatePrediction({
      homeForm: homeFormData as TeamFormData[],
      awayForm: awayFormData as TeamFormData[],
      h2hMatches: (h2hData as any[]) || [],
      standings: standings || [],
      homeTeamId,
      awayTeamId,
      homeTeamName,
      awayTeamName,
      injuries,
    });
  }, [homeFormData, awayFormData, h2hData, standings, homeTeamId, awayTeamId, homeTeamName, awayTeamName, injuries, apiPredictions, aiExpertPrediction]);

  if (!prediction) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-card to-emerald-500/5 border border-primary/20 p-6 text-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">LiveFoot AI analyse le match...</p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-1.5 w-6 rounded-full bg-primary/30"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isValueBet = prediction.confidence > 65 && prediction.risk === "low";

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = `🎯 Pronostic LiveFoot AI: ${homeTeamName} vs ${awayTeamName}\n🏆 Mon prono: ${prediction.advice}\n📈 Confiance: ${prediction.confidence}%\n🔥 Découvrez plus sur LiveFoot AI !`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setIsCopying(true);
      toast.success("Copié dans le presse-papier !");
      setTimeout(() => setIsCopying(false), 2000);
    }
  };

  const risk = riskColors[prediction.risk];
  const winnerName = prediction.outcome === "home" ? homeTeamName
    : prediction.outcome === "away" ? awayTeamName
    : "Match Nul";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="rounded-2xl overflow-hidden relative"
    >
      {/* Glowing border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-emerald-500/20 to-teal-500/20 blur-sm" />
      
      <div className="relative rounded-2xl bg-gradient-to-br from-[#0a1a10] via-[#050f0a] to-[#020503] border border-primary/20 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" />

        {/* Header */}
        <div className="relative px-3.5 sm:px-6 py-3 sm:py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <Brain className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1">
                  LiveFoot AI
                  <Sparkles className="h-3 w-3 text-primary" />
                </h3>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[8px] font-black uppercase tracking-tighter">
                  100% GRATUIT
                </span>
                {isValueBet && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[8px] font-black uppercase tracking-tighter">
                    <Zap className="h-2 w-2" /> Value
                  </span>
                )}
              </div>
              <p className="text-[9px] sm:text-[10px] text-emerald-300/60">
                {(prediction as any).isExpert ? "Analyse LiveFoot Expert" : "Analyse intelligente"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-white"
              title="Partager"
            >
              {isCopying ? <Check className="h-3 w-3 text-emerald-400" /> : <Share2 className="h-3 w-3" />}
            </button>
            <div className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold border whitespace-nowrap", risk.bg, risk.text, risk.border)}>
              <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {risk.label}
            </div>
          </div>
        </div>

        {/* Main Prediction */}
        <div className="relative px-4 sm:px-6 py-5 sm:py-6">
          {/* Predicted outcome + confidence */}
          <div className="text-center mb-5">
            <motion.p
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-xs text-emerald-300/50 uppercase tracking-widest mb-2"
            >
              Pronostic du jour
            </motion.p>
            <motion.h4
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-lg sm:text-xl font-black text-white mb-1"
            >
              {winnerName}
            </motion.h4>
            <p className="text-xs text-emerald-300/60">{prediction.advice}</p>
          </div>

          {/* Score prediction */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center justify-center gap-3 sm:gap-5 mb-6"
          >
            <div className="flex flex-col items-center gap-1.5">
              {homeLogo && <img src={homeLogo} alt="" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />}
              <span className="text-[10px] font-medium text-white/60 truncate max-w-[80px] text-center">{homeTeamName}</span>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <span className={cn(
                "text-3xl sm:text-4xl font-black tabular-nums",
                prediction.outcome === "home" ? "text-primary" : "text-white/80"
              )}>
                {prediction.predictedScore.home}
              </span>
              <span className="text-lg text-white/20 font-light">:</span>
              <span className={cn(
                "text-3xl sm:text-4xl font-black tabular-nums",
                prediction.outcome === "away" ? "text-primary" : "text-white/80"
              )}>
                {prediction.predictedScore.away}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              {awayLogo && <img src={awayLogo} alt="" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />}
              <span className="text-[10px] font-medium text-white/60 truncate max-w-[80px] text-center">{awayTeamName}</span>
            </div>
          </motion.div>

          {prediction.probabilities.home > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between text-[10px] mb-2">
                <span className="font-bold text-white">{prediction.probabilities.home}%</span>
                <span className="text-white/40">Probabilités</span>
                <span className="font-bold text-white">{prediction.probabilities.away}%</span>
              </div>
              <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5 bg-white/5">
                <motion.div
                  className="bg-gradient-to-r from-primary to-emerald-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${prediction.probabilities.home}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                />
                <motion.div
                  className="bg-white/20 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${prediction.probabilities.draw}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
                />
                <motion.div
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${prediction.probabilities.away}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] text-white/30 mt-1">
                <span>{homeTeamName}</span>
                <span>Nul {prediction.probabilities.draw}%</span>
                <span>{awayTeamName}</span>
              </div>
            </div>
          )}

          {/* Confidence Ring */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center gap-4 mb-5"
          >
            <div className="relative h-16 w-16">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                <motion.circle
                  cx="32" cy="32" r="28" fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - prediction.confidence / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-white">{prediction.confidence}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-white">Indice de confiance</p>
              <p className="text-[10px] text-white/40">Basé sur {prediction.factors.length} facteurs d'analyse</p>
            </div>
          </motion.div>

          {/* Key Factors */}
          <div className="space-y-1.5 sm:space-y-2 mb-5">
            <p className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Zap className="h-3 w-3 text-primary" />
              Facteurs clés
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {prediction.factors.map((factor, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className={cn(
                    "flex items-start gap-2 p-2 sm:p-2.5 rounded-xl border",
                    factor.impact === "positive" ? "bg-emerald-500/5 border-emerald-500/10" :
                    factor.impact === "negative" ? "bg-red-500/5 border-red-500/10" :
                    "bg-white/3 border-white/5"
                  )}
                >
                  <span className="text-sm sm:text-base flex-shrink-0 mt-0.5">{factor.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-white leading-tight">{factor.label}</p>
                    <p className="text-[9px] sm:text-[10px] text-white/50 leading-relaxed line-clamp-2">{factor.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Best Bets */}
          <div className="space-y-2">
            <p className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Target className="h-3 w-3 text-cyan-400" />
              Suggestions de paris
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {prediction.bestBets.map((bet, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + i * 0.1 }}
                  className={cn(
                    "rounded-xl bg-white/5 border border-white/5 p-2.5 sm:p-3 text-center hover:bg-white/8 transition-colors",
                    i === 2 && "col-span-2 sm:col-span-1" // Third bet takes full width on mobile for better balance
                  )}
                >
                  <span className="text-base sm:text-lg">{bet.emoji}</span>
                  <p className="text-[9px] sm:text-[10px] font-bold text-white mt-1">{bet.label}</p>
                  <div className="flex items-center justify-center gap-1 mt-1.5">
                    <div className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${bet.confidence}%` }}
                        transition={{ duration: 0.8, delay: 1.4 + i * 0.1 }}
                      />
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-bold text-primary">{bet.confidence}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex flex-col gap-0.5">
            <p className="text-[9px] text-white/20">
              Analyse LiveFoot AI v2.0
            </p>
            <p className="text-[8px] text-white/10 uppercase tracking-tighter">Données Temps Réel</p>
          </div>
          
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Prono LiveFoot AI: ${homeTeamName} vs ${awayTeamName}`,
                  text: `L'IA LiveFoot prédit un score de ${prediction.predictedScore.home}-${prediction.predictedScore.away} (${prediction.confidence}% de confiance).`,
                  url: window.location.href,
                });
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[10px] font-bold hover:bg-white/10 active:scale-95 transition-all"
          >
            <Share2 className="h-3.5 w-3.5" /> PARTAGER
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default LiveFootAIPredictionCard;
