import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, TrendingUp, Zap, Sparkles, Target, Share2, Copy, Check,
  AlertTriangle, Eye, User, Clock, Calendar, Swords, Video, ShieldCheck,
  Grid3X3, Flame, Shield, Loader2, Brain, Star, Crown, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generatePrediction, type LiveFootAIPrediction, type TeamFormData } from "@/lib/livefoot-ai";
import { useTeamForm, useHeadToHead, useAiExpert } from "@/hooks/useApiFootball";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getRandomPartner } from "@/data/partnersData";
import PartnerCard from "@/components/PartnerCard";
import { Link } from "react-router-dom";

interface LiveFootAIPredictionCardProps {
  fixtureId?: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeLogo?: string;
  awayLogo?: string;
  standings?: any[];
  injuries?: { home: number; away: number };
  apiPredictions?: any;
  leagueName?: string;
  aiExpertPrediction?: {
    analysis: string;
    predictedScore: string;
    confidence: number;
    keyFactor: string;
    predictions?: {
      winner: string;
      btts: string;
      overUnder25: string;
      doubleChance: string;
      corners: string;
      cards: string;
      possession: string;
      firstScorer: string;
      anytimeScorer: string;
      penalty: string;
      var: string;
      cleanSheet: string;
      timingFirstGoal: string;
      highestScoringHalf: string;
      winningMargin: string;
    };
  };
}

const riskColors = {
  low: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30", label: "Faible risque" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30", label: "Risque modéré" },
  high: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/30", label: "Risque élevé" },
};

const LiveFootAIPredictionCard = ({
  fixtureId, homeTeamId, awayTeamId, homeTeamName, awayTeamName,
  homeLogo, awayLogo, standings, injuries, apiPredictions,
  aiExpertPrediction: initialAiExpertPrediction,
  leagueName = "Football",
}: LiveFootAIPredictionCardProps) => {
  const [isCopying, setIsCopying] = useState(false);
  const { isVip, user } = useAuth();
  
  // Only fetch AI Expert if not already provided by parent (avoids double API call)
  const shouldFetchAi = !initialAiExpertPrediction && !!fixtureId;
  const { data: fetchedAiExpertData } = useAiExpert({
    fixtureId: shouldFetchAi ? (fixtureId || "") : "",
    homeTeam: homeTeamName,
    awayTeam: awayTeamName,
    leagueName: leagueName
  });

  const aiExpertPrediction = initialAiExpertPrediction || fetchedAiExpertData;

  const { data: homeFormData } = useTeamForm(homeTeamId);
  const { data: awayFormData } = useTeamForm(awayTeamId);
  const { data: h2hData } = useHeadToHead(homeTeamId, awayTeamId);

  const featuredPartner = useMemo(() => getRandomPartner(), []);

  const prediction = useMemo<LiveFootAIPrediction | null>(() => {
    // Priority 0: Use AI Expert Prediction from OpenRouter if available
    if (aiExpertPrediction) {
      try {
        const predictedScore = aiExpertPrediction.predictedScore || "0-0";
        const [homeScore, awayScore] = predictedScore.includes("-") 
          ? predictedScore.split("-").map(Number)
          : [0, 0];
        
        const outcome = homeScore > awayScore ? "home" : homeScore < awayScore ? "away" : "draw";
        
        const extractedBets: { type: string; label: string; confidence: number; emoji: string }[] = [];
        const baseConf = Math.round((aiExpertPrediction.confidence || 0) * 100);
        
        // Compute real probabilities from AI confidence + outcome
        let homeProb = 0, drawProb = 0, awayProb = 0;
        if (outcome === "home") {
          homeProb = baseConf;
          drawProb = Math.round((100 - baseConf) * 0.45);
          awayProb = 100 - homeProb - drawProb;
        } else if (outcome === "away") {
          awayProb = baseConf;
          drawProb = Math.round((100 - baseConf) * 0.45);
          homeProb = 100 - awayProb - drawProb;
        } else {
          drawProb = baseConf;
          homeProb = Math.round((100 - baseConf) * 0.55);
          awayProb = 100 - drawProb - homeProb;
        }
        // Clamp
        homeProb = Math.max(5, Math.min(90, homeProb));
        awayProb = Math.max(5, Math.min(90, awayProb));
        drawProb = Math.max(5, 100 - homeProb - awayProb);

        // Extract rich betting suggestions from AI predictions
        if (aiExpertPrediction.predictions) {
          const p = aiExpertPrediction.predictions;
          if (p.winner && p.winner !== "N/A") extractedBets.push({ type: "1X2", label: `Vainqueur: ${p.winner}`, confidence: baseConf, emoji: "🏆" });
          if (p.btts && p.btts !== "N/A") extractedBets.push({ type: "BTTS", label: `Les 2 marquent: ${p.btts}`, confidence: Math.max(55, baseConf - 5), emoji: "⚽" });
          if (p.overUnder25 && p.overUnder25 !== "N/A") extractedBets.push({ type: "O/U", label: `Buts 2.5: ${p.overUnder25}`, confidence: Math.max(50, baseConf - 10), emoji: "🔥" });
          if (p.doubleChance && p.doubleChance !== "N/A") extractedBets.push({ type: "DC", label: `Double Chance: ${p.doubleChance}`, confidence: Math.min(95, baseConf + 15), emoji: "🛡️" });
          if (p.cleanSheet && p.cleanSheet !== "N/A" && p.cleanSheet !== "None") extractedBets.push({ type: "CS", label: `Clean Sheet: ${p.cleanSheet}`, confidence: Math.max(40, baseConf - 15), emoji: "🧤" });
          if (p.corners && p.corners !== "N/A") extractedBets.push({ type: "Corners", label: `Corners: ${p.corners}`, confidence: Math.max(45, baseConf - 20), emoji: "📐" });
          if (p.highestScoringHalf && p.highestScoringHalf !== "N/A") extractedBets.push({ type: "Half", label: `Mi-temps +: ${p.highestScoringHalf}`, confidence: Math.max(45, baseConf - 15), emoji: "⏱️" });
          if (p.winningMargin && p.winningMargin !== "N/A") extractedBets.push({ type: "Marge", label: `Marge: ${p.winningMargin}`, confidence: Math.max(35, baseConf - 25), emoji: "📊" });
        }
        if (extractedBets.length === 0) {
          extractedBets.push({ type: "AI", label: `Score prédit: ${predictedScore}`, confidence: baseConf, emoji: "✨" });
        }
        // Always add the exact score as a bet
        extractedBets.push({ type: "Score Exact", label: `${homeScore}-${awayScore}`, confidence: Math.max(15, baseConf - 30), emoji: "🎯" });

        // Extract multiple factors from AI data
        const factors: any[] = [{
          icon: "🧠",
          label: aiExpertPrediction.matchState === "En direct" ? "Analyse Live" : "Analyse Expert IA",
          description: aiExpertPrediction.keyFactor || "Analyse en cours...",
          impact: "neutral",
          team: "both"
        }];
        if (aiExpertPrediction.reasoning) {
          factors.push({
            icon: "📊",
            label: "Raisonnement",
            description: aiExpertPrediction.reasoning,
            impact: "neutral",
            team: "both"
          });
        }
        if (aiExpertPrediction.xgHome != null && aiExpertPrediction.xgAway != null) {
          factors.push({
            icon: "📈",
            label: "Expected Goals (xG)",
            description: `xG: ${aiExpertPrediction.xgHome.toFixed(1)} - ${aiExpertPrediction.xgAway.toFixed(1)}`,
            impact: aiExpertPrediction.xgHome > aiExpertPrediction.xgAway ? "positive" : "negative",
            team: aiExpertPrediction.xgHome > aiExpertPrediction.xgAway ? "home" : "away"
          });
        }
        if (aiExpertPrediction.valueBet && typeof aiExpertPrediction.valueBet === 'string' && aiExpertPrediction.valueBet.toLowerCase() !== "null") {
          factors.push({
            icon: "💎",
            label: "Value Bet détecté",
            description: aiExpertPrediction.valueBet,
            impact: "positive",
            team: "both"
          });
        }

        return {
          outcome,
          confidence: baseConf,
          predictedScore: { home: homeScore || 0, away: awayScore || 0 },
          probabilities: { home: homeProb, draw: drawProb, away: awayProb },
          factors: factors.slice(0, 5),
          advice: aiExpertPrediction.analysis || "",
          reasoning: aiExpertPrediction.reasoning,
          risk: baseConf > 70 ? "low" : baseConf > 50 ? "medium" : "high",
          matchState: aiExpertPrediction.matchState,
          confidenceStars: aiExpertPrediction.confidenceStars || Math.round((aiExpertPrediction.confidence || 0) * 5),
          xgHome: aiExpertPrediction.xgHome,
          xgAway: aiExpertPrediction.xgAway,
          valueBet: (aiExpertPrediction.valueBet && typeof aiExpertPrediction.valueBet === 'string' && aiExpertPrediction.valueBet.toLowerCase() !== "null") ? aiExpertPrediction.valueBet : null,
          bestBets: extractedBets.slice(0, 6),
          isExpert: true,
          detailedPredictions: aiExpertPrediction.predictions || {}
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

        // Map API percent strings to numbers and normalize to 100%
        let homeProb = parseInt(p.percent.home) || 33;
        let drawProb = parseInt(p.percent.draw) || 34;
        let awayProb = parseInt(p.percent.away) || 33;

        const totalProb = homeProb + drawProb + awayProb;
        if (totalProb > 0 && totalProb !== 100) {
          homeProb = Math.round((homeProb / totalProb) * 100);
          drawProb = Math.round((drawProb / totalProb) * 100);
          awayProb = 100 - homeProb - drawProb; // Ensure exact 100 sum
        }

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

        const fallbackBets = [
          { type: "API", label: p.advice, confidence: Math.max(homeProb, drawProb, awayProb), emoji: "🎯" }
        ];

        if (parseInt(p.goals.home) + parseInt(p.goals.away) > 2.5) {
          fallbackBets.push({ type: "API", label: "+2.5 Buts", confidence: 65, emoji: "🔥" });
        } else {
          fallbackBets.push({ type: "API", label: "-2.5 Buts", confidence: 60, emoji: "🛡️" });
        }
        
        if (parseInt(p.goals.home) > 0 && parseInt(p.goals.away) > 0) {
          fallbackBets.push({ type: "API", label: "Les 2 marquent: Oui", confidence: 55, emoji: "⚽" });
        } else {
          fallbackBets.push({ type: "API", label: "Clean Sheet probable", confidence: 55, emoji: "⛔" });
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
          bestBets: fallbackBets.slice(0, 3)
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
                <span className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-tighter",
                  isVip 
                    ? "bg-gradient-to-r from-amber-500/30 to-amber-600/20 border-amber-500/40 text-amber-300" 
                    : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                )}>
                  {isVip ? <><Crown className="h-2 w-2" /> VIP</> : "GRATUIT"}
                </span>
                {prediction.valueBet && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[8px] font-black uppercase tracking-tighter">
                    <Zap className="h-2 w-2" /> Value Bet
                  </span>
                )}
                {prediction.matchState && (
                  <span className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter",
                    prediction.matchState === "En direct" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                    prediction.matchState === "Terminé" ? "bg-white/10 text-white/60 border border-white/20" :
                    "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  )}>
                    {prediction.matchState}
                  </span>
                )}
              </div>
              <p className="text-[9px] sm:text-[10px] text-emerald-300/60">
                {isVip ? "AnalystePro V3 — Précision VIP" : (prediction as any).isExpert ? "Analyse AnalystePro" : "Analyse intelligente"}
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
            <p className="text-xs text-emerald-300/80 font-medium mb-1">{prediction.advice}</p>
            {prediction.reasoning && (
              <p className="text-[10px] sm:text-xs text-emerald-300/50 italic mt-2 border-t border-emerald-500/10 pt-2">
                "{prediction.reasoning}"
              </p>
            )}
            
            {/* Confidence Stars */}
            {prediction.confidenceStars !== undefined && (
              <div className="flex justify-center gap-0.5 mt-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={cn(
                      "h-3 w-3 sm:h-4 sm:w-4", 
                      star <= prediction.confidenceStars! ? "fill-amber-400 text-amber-400" : "fill-white/10 text-white/10"
                    )} 
                  />
                ))}
              </div>
            )}
          </div>

          {/* Value Bet Banner — VIP ONLY */}
          {prediction.valueBet && (
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className={cn("mb-6 rounded-xl p-3 sm:p-4 flex items-start gap-3 relative overflow-hidden", isVip ? "bg-amber-500/10 border border-amber-500/20" : "bg-white/5 border border-white/10")}
             >
               {!isVip && (
                 <>
                   <div className="absolute inset-0 backdrop-blur-md bg-black/40 z-10 flex flex-col items-center justify-center gap-2">
                     <Lock className="h-5 w-5 text-amber-400" />
                     <p className="text-[10px] font-black text-amber-400 uppercase">Réservé VIP</p>
                   </div>
                 </>
               )}
               <Zap className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
               <div>
                 <h5 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-1">Value Bet Détecté</h5>
                 <p className="text-sm font-medium text-amber-100">{prediction.valueBet}</p>
               </div>
             </motion.div>
          )}

          {/* Score prediction */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center justify-center gap-3 sm:gap-5 mb-6"
          >
            <div className="flex flex-col items-center gap-1.5 w-24">
              {homeLogo && <img src={homeLogo} alt="" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />}
              <span className="text-[10px] font-medium text-white/60 truncate max-w-full text-center">{homeTeamName}</span>
              {prediction.xgHome !== undefined && (
                <span className="text-[9px] font-bold text-white/40 bg-white/5 px-1.5 py-0.5 rounded">xG: {prediction.xgHome}</span>
              )}
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

            <div className="flex flex-col items-center gap-1.5 w-24">
              {awayLogo && <img src={awayLogo} alt="" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />}
              <span className="text-[10px] font-medium text-white/60 truncate max-w-full text-center">{awayTeamName}</span>
              {prediction.xgAway !== undefined && (
                <span className="text-[9px] font-bold text-white/40 bg-white/5 px-1.5 py-0.5 rounded">xG: {prediction.xgAway}</span>
              )}
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

          {/* Detailed Expert Predictions Grid — FREE: first 3 visible, rest blurred. VIP: all visible */}
          {(prediction as any).detailedPredictions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-4 mb-8"
            >
              <div className="flex items-center gap-2 mb-3">
                <Grid3X3 className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Événements du Match</h4>
                {!isVip && <span className="ml-auto text-[8px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-black"><Crown className="h-2 w-2 inline mr-0.5" />VIP</span>}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 relative">
                {Object.entries((prediction as any).detailedPredictions).map(([key, value], idx) => {
                  const labels: Record<string, { label: string, icon: any }> = {
                    winner: { label: "Vainqueur", icon: Trophy },
                    btts: { label: "BTTS", icon: Zap },
                    overUnder25: { label: "Buts +/- 2.5", icon: Flame },
                    doubleChance: { label: "Double Chance", icon: Shield },
                    corners: { label: "Corners", icon: TrendingUp },
                    cards: { label: "Cartons", icon: AlertTriangle },
                    possession: { label: "Possession", icon: Eye },
                    firstScorer: { label: "1er Buteur", icon: User },
                    anytimeScorer: { label: "Buteur", icon: User },
                    penalty: { label: "Penalty", icon: Target },
                    var: { label: "VAR", icon: Video },
                    cleanSheet: { label: "Clean Sheet", icon: ShieldCheck },
                    timingFirstGoal: { label: "Temps 1er But", icon: Clock },
                    highestScoringHalf: { label: "Mi-temps +", icon: Calendar },
                    winningMargin: { label: "Marge", icon: Swords },
                  };
                  const config = labels[key];
                  if (!config) return null;
                  const Icon = config.icon;
                  const isLocked = !isVip && idx >= 3;
                  
                  return (
                    <div key={key} className={cn(
                      "bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center text-center group transition-colors relative overflow-hidden",
                      isLocked ? "" : "hover:bg-white/10",
                      isVip && "border-amber-500/10 hover:border-amber-500/30"
                    )}>
                      {isLocked && (
                        <div className="absolute inset-0 backdrop-blur-[6px] bg-black/30 z-10 flex items-center justify-center">
                          <Lock className="h-3.5 w-3.5 text-amber-400/60" />
                        </div>
                      )}
                      <Icon className={cn("h-4 w-4 mb-2 transition-colors", isVip ? "text-amber-400/70 group-hover:text-amber-400" : "text-primary/60 group-hover:text-primary")} />
                      <p className="text-[9px] text-white/40 uppercase font-bold mb-1">{config.label}</p>
                      <p className="text-xs font-black text-white">{value as string}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Key Factors — FREE: 1 factor. VIP: all */}
          <div className="space-y-1.5 sm:space-y-2 mb-5">
            <p className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Zap className="h-3 w-3 text-primary" />
              Facteurs clés
              {!isVip && prediction.factors.length > 1 && <span className="text-amber-400 text-[8px] ml-1">+{prediction.factors.length - 1} VIP</span>}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(isVip ? prediction.factors : prediction.factors.slice(0, 1)).map((factor, i) => (
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

          {/* Best Bets — FREE: 2 visible + blur. VIP: all visible */}
          <div className="space-y-2">
            <p className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Target className="h-3 w-3 text-cyan-400" />
              Suggestions de paris
              {!isVip && prediction.bestBets.length > 2 && <span className="text-amber-400 text-[8px] ml-1">+{prediction.bestBets.length - 2} VIP</span>}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {prediction.bestBets.map((bet, i) => {
                const isLocked = !isVip && i >= 2;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 + i * 0.1 }}
                    className={cn(
                      "rounded-xl border p-2.5 sm:p-3 text-center transition-colors relative overflow-hidden",
                      isVip ? "bg-gradient-to-b from-amber-500/5 to-transparent border-amber-500/10 hover:border-amber-500/30" : "bg-white/5 border-white/5 hover:bg-white/8",
                      i === 2 && "col-span-2 sm:col-span-1"
                    )}
                  >
                    {isLocked && (
                      <div className="absolute inset-0 backdrop-blur-[6px] bg-black/40 z-10 flex items-center justify-center">
                        <Lock className="h-3.5 w-3.5 text-amber-400/60" />
                      </div>
                    )}
                    <span className="text-base sm:text-lg">{bet.emoji}</span>
                    <p className="text-[9px] sm:text-[10px] font-bold text-white mt-1">{bet.label}</p>
                    <div className="flex items-center justify-center gap-1 mt-1.5">
                      <div className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          className={cn("h-full rounded-full", isVip ? "bg-gradient-to-r from-amber-400 to-amber-600" : "bg-gradient-to-r from-primary to-emerald-500")}
                          initial={{ width: 0 }}
                          animate={{ width: `${bet.confidence}%` }}
                          transition={{ duration: 0.8, delay: 1.4 + i * 0.1 }}
                        />
                      </div>
                      <span className={cn("text-[8px] sm:text-[9px] font-bold", isVip ? "text-amber-400" : "text-primary")}>{bet.confidence}%</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* VIP CTA for Free Users */}
          {!isVip && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
              className="mt-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 p-4 sm:p-5 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-amber-500/10 rounded-full blur-2xl" />
              <Crown className="h-8 w-8 text-amber-400 mx-auto mb-2 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
              <h4 className="text-sm font-black text-amber-300 mb-1">Débloquer toutes les prédictions</h4>
              <p className="text-[10px] text-amber-100/60 mb-3 max-w-xs mx-auto">
                Accédez aux Value Bets, aux {prediction.bestBets.length - 2}+ suggestions de paris supplémentaires, aux facteurs clés complets et à l'analyse xG avancée.
              </p>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-105 transition-all"
              >
                <Crown className="h-3.5 w-3.5" />
                DEVENIR VIP
              </Link>
            </motion.div>
          )}

          {/* Affiliate CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-8 pt-6 border-t border-white/5"
          >
            <p className="text-[10px] font-black text-primary/80 uppercase tracking-widest text-center mb-4">
              Profitez du Bonus pour ce match
            </p>
            <PartnerCard partner={featuredPartner} variant="full" />
          </motion.div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex flex-col gap-0.5">
            <p className="text-[9px] text-white/20">
              {isVip ? "AnalystePro V3 — Précision VIP" : "Analyse LiveFoot AI v3.0"}
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
