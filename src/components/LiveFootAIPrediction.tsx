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
}

const riskColors = {
  low: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30", label: "Faible risque" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30", label: "Risque modéré" },
  high: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/30", label: "Risque élevé" },
};

const LiveFootAIPredictionCard = ({
  homeTeamId, awayTeamId, homeTeamName, awayTeamName,
  homeLogo, awayLogo, standings, injuries,
}: LiveFootAIPredictionCardProps) => {
  const [isCopying, setIsCopying] = useState(false);
  const isMock = homeTeamId.startsWith("mock") || awayTeamId.startsWith("mock");

  const { data: homeFormData } = useTeamForm(isMock ? "" : homeTeamId);
  const { data: awayFormData } = useTeamForm(isMock ? "" : awayTeamId);
  const { data: h2hData } = useHeadToHead(isMock ? "" : homeTeamId, isMock ? "" : awayTeamId);

  const prediction = useMemo<LiveFootAIPrediction | null>(() => {
    if (isMock) {
      // Return high-quality mock prediction
      return {
        outcome: homeTeamId === "mock1" ? "home" : "draw",
        confidence: 88,
        predictedScore: homeTeamId === "mock1" ? { home: 2, away: 1 } : { home: 2, away: 2 },
        probabilities: homeTeamId === "mock1" ? { home: 45, draw: 30, away: 25 } : { home: 35, draw: 40, away: 25 },
        factors: [
          { icon: "📈", label: "Forme Étincelante", impact: "positive", description: "L'équipe à domicile survole ses derniers matchs." },
          { icon: "🚑", label: "Effectif Complet", impact: "positive", description: "Aucun blessé majeur à déplorer." },
          { icon: "🏟️", label: "Avantage Terrain", impact: "positive", description: "Une forteresse imprenable cette saison." }
        ],
        advice: homeTeamId === "mock1" ? "Victoire logique à domicile." : "Match très serré, le nul est probable.",
        risk: "low",
        bestBets: [
          { type: "1X2", label: "Victoire Domicile", confidence: 85, emoji: "💰" },
          { type: "Score Exact", label: homeTeamId === "mock1" ? "2-1" : "2-2", confidence: 25, emoji: "🎯" },
          { type: "Double Chance", label: "1X", confidence: 92, emoji: "🛡️" }
        ]
      };
    }

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
  }, [homeFormData, awayFormData, h2hData, standings, homeTeamId, awayTeamId, homeTeamName, awayTeamName, injuries, isMock]);

  if (!prediction) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-violet-500/5 via-card to-blue-500/5 border border-violet-500/20 p-6 text-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-violet-500/10 flex items-center justify-center">
            <Brain className="h-6 w-6 text-violet-400" />
          </div>
          <p className="text-sm text-muted-foreground">LiveFoot AI analyse le match...</p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-1.5 w-6 rounded-full bg-violet-500/30"
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
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-cyan-500/20 blur-sm" />
      
      <div className="relative rounded-2xl bg-gradient-to-br from-[#0f0a1e] via-[#131025] to-[#0a0e1a] border border-violet-500/20 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-violet-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />

        {/* Header */}
        <div className="relative px-3.5 sm:px-6 py-3 sm:py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/20"
            >
              <Brain className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1">
                  LiveFoot AI
                  <Sparkles className="h-3 w-3 text-violet-400" />
                </h3>
                {isValueBet && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[8px] font-black uppercase tracking-tighter">
                    <Zap className="h-2 w-2" /> Value
                  </span>
                )}
              </div>
              <p className="text-[9px] sm:text-[10px] text-violet-300/60">Analyse intelligente</p>
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
              className="text-xs text-violet-300/50 uppercase tracking-widest mb-2"
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
            <p className="text-xs text-violet-300/60">{prediction.advice}</p>
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
                prediction.outcome === "home" ? "text-violet-400" : "text-white/80"
              )}>
                {prediction.predictedScore.home}
              </span>
              <span className="text-lg text-white/20 font-light">:</span>
              <span className={cn(
                "text-3xl sm:text-4xl font-black tabular-nums",
                prediction.outcome === "away" ? "text-violet-400" : "text-white/80"
              )}>
                {prediction.predictedScore.away}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              {awayLogo && <img src={awayLogo} alt="" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />}
              <span className="text-[10px] font-medium text-white/60 truncate max-w-[80px] text-center">{awayTeamName}</span>
            </div>
          </motion.div>

          {/* Probability Bars */}
          <div className="mb-5">
            <div className="flex items-center justify-between text-[10px] mb-2">
              <span className="font-bold text-white">{prediction.probabilities.home}%</span>
              <span className="text-white/40">Probabilités</span>
              <span className="font-bold text-white">{prediction.probabilities.away}%</span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5 bg-white/5">
              <motion.div
                className="bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"
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
                className="bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
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
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#06b6d4" />
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
              <Zap className="h-3 w-3 text-violet-400" />
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
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${bet.confidence}%` }}
                        transition={{ duration: 0.8, delay: 1.4 + i * 0.1 }}
                      />
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-bold text-violet-300">{bet.confidence}%</span>
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
                  text: `L'Oracle LiveFoot AI prédit un score de ${prediction.predictedScore.home}-${prediction.predictedScore.away} (${prediction.confidence}% de confiance).`,
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
