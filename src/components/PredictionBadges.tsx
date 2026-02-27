import { Trophy, Flame, Target, Star, Award, Zap, Crown, Medal, Shield, Eye, Brain, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  earned: boolean;
  tier?: "bronze" | "silver" | "gold" | "legendary";
}

interface PredictionBadgesProps {
  totalPredictions: number;
  exactScores: number;
  correctResults: number;
  streak: number;
}

const tierStyles = {
  bronze: "ring-1 ring-amber-700/30",
  silver: "ring-1 ring-slate-400/40",
  gold: "ring-1 ring-amber-400/50 shadow-amber-400/10 shadow-md",
  legendary: "ring-2 ring-purple-500/50 shadow-purple-500/20 shadow-lg",
};

export function computeBadges({ totalPredictions, exactScores, correctResults, streak }: PredictionBadgesProps): Badge[] {
  return [
    {
      id: "first", name: "Premier Pas", description: "1er pronostic soumis",
      icon: <Star className="h-5 w-5" />, color: "text-amber-500", bgColor: "bg-amber-500/10",
      earned: totalPredictions >= 1, tier: "bronze",
    },
    {
      id: "regular", name: "Habitué", description: "10 pronostics soumis",
      icon: <Target className="h-5 w-5" />, color: "text-primary", bgColor: "bg-primary/10",
      earned: totalPredictions >= 10, tier: "bronze",
    },
    {
      id: "dedicated", name: "Passionné", description: "50 pronostics soumis",
      icon: <Trophy className="h-5 w-5" />, color: "text-primary", bgColor: "bg-primary/10",
      earned: totalPredictions >= 50, tier: "silver",
    },
    {
      id: "master", name: "Maître", description: "100 pronostics soumis",
      icon: <Medal className="h-5 w-5" />, color: "text-purple-500", bgColor: "bg-purple-500/10",
      earned: totalPredictions >= 100, tier: "gold",
    },
    {
      id: "sniper", name: "Sniper", description: "1 score exact deviné",
      icon: <Zap className="h-5 w-5" />, color: "text-emerald-500", bgColor: "bg-emerald-500/10",
      earned: exactScores >= 1, tier: "silver",
    },
    {
      id: "oracle", name: "Oracle", description: "5 scores exacts",
      icon: <Crown className="h-5 w-5" />, color: "text-amber-500", bgColor: "bg-amber-500/10",
      earned: exactScores >= 5, tier: "gold",
    },
    {
      id: "visionary", name: "Visionnaire", description: "10 scores exacts",
      icon: <Eye className="h-5 w-5" />, color: "text-cyan-500", bgColor: "bg-cyan-500/10",
      earned: exactScores >= 10, tier: "legendary",
    },
    {
      id: "streak3", name: "En Forme", description: "3 bons résultats d'affilée",
      icon: <Flame className="h-5 w-5" />, color: "text-orange-500", bgColor: "bg-orange-500/10",
      earned: streak >= 3, tier: "bronze",
    },
    {
      id: "streak5", name: "Inarrêtable", description: "5 bons résultats d'affilée",
      icon: <Flame className="h-5 w-5" />, color: "text-red-500", bgColor: "bg-red-500/10",
      earned: streak >= 5, tier: "silver",
    },
    {
      id: "streak10", name: "Légendaire", description: "10 bons résultats d'affilée",
      icon: <Rocket className="h-5 w-5" />, color: "text-purple-500", bgColor: "bg-purple-500/10",
      earned: streak >= 10, tier: "legendary",
    },
    {
      id: "analyst", name: "Analyste", description: "10 résultats corrects",
      icon: <Award className="h-5 w-5" />, color: "text-blue-500", bgColor: "bg-blue-500/10",
      earned: correctResults >= 10, tier: "silver",
    },
    {
      id: "strategist", name: "Stratège", description: "25 résultats corrects",
      icon: <Brain className="h-5 w-5" />, color: "text-indigo-500", bgColor: "bg-indigo-500/10",
      earned: correctResults >= 25, tier: "gold",
    },
  ];
}

export function computePoints({ exactScores, correctResults, totalPredictions }: { exactScores: number; correctResults: number; totalPredictions: number }): number {
  // Enhanced scoring: 15 pts exact, 5 pts correct result, 3 pts correct goal diff, 1 pt participation
  return exactScores * 15 + correctResults * 5 + totalPredictions;
}

export default function BadgeGrid({ badges }: { badges: Badge[] }) {
  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  return (
    <div className="space-y-4">
      {earned.length > 0 && (
        <>
          <p className="text-xs font-bold text-foreground">🏅 Débloqués ({earned.length})</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {earned.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "rounded-2xl p-3 text-center border border-border/50",
                  badge.bgColor,
                  badge.tier && tierStyles[badge.tier]
                )}
              >
                <div className={cn("mx-auto mb-1.5", badge.color)}>{badge.icon}</div>
                <p className="text-[11px] font-bold text-foreground">{badge.name}</p>
                <p className="text-[8px] text-muted-foreground mt-0.5">{badge.description}</p>
              </motion.div>
            ))}
          </div>
        </>
      )}
      {locked.length > 0 && (
        <>
          <p className="text-xs font-bold text-muted-foreground mt-2">🔒 À débloquer ({locked.length})</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {locked.map((badge) => (
              <div
                key={badge.id}
                className="rounded-2xl p-3 text-center border border-border/20 opacity-35 grayscale"
              >
                <div className="mx-auto mb-1.5 text-muted-foreground">{badge.icon}</div>
                <p className="text-[11px] font-bold text-muted-foreground">{badge.name}</p>
                <p className="text-[8px] text-muted-foreground mt-0.5">{badge.description}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
