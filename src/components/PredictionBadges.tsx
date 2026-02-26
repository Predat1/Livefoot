import { Trophy, Flame, Target, Star, Award, Zap, Crown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  earned: boolean;
}

interface PredictionBadgesProps {
  totalPredictions: number;
  exactScores: number;
  correctResults: number;
  streak: number;
}

export function computeBadges({ totalPredictions, exactScores, correctResults, streak }: PredictionBadgesProps): Badge[] {
  return [
    {
      id: "first",
      name: "Premier Pas",
      description: "Premier pronostic soumis",
      icon: <Star className="h-4 w-4" />,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      earned: totalPredictions >= 1,
    },
    {
      id: "regular",
      name: "Habitué",
      description: "10 pronostics soumis",
      icon: <Target className="h-4 w-4" />,
      color: "text-primary",
      bgColor: "bg-primary/10",
      earned: totalPredictions >= 10,
    },
    {
      id: "dedicated",
      name: "Passionné",
      description: "50 pronostics soumis",
      icon: <Trophy className="h-4 w-4" />,
      color: "text-primary",
      bgColor: "bg-primary/10",
      earned: totalPredictions >= 50,
    },
    {
      id: "sniper",
      name: "Sniper",
      description: "Score exact deviné",
      icon: <Zap className="h-4 w-4" />,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      earned: exactScores >= 1,
    },
    {
      id: "oracle",
      name: "Oracle",
      description: "5 scores exacts",
      icon: <Crown className="h-4 w-4" />,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      earned: exactScores >= 5,
    },
    {
      id: "streak3",
      name: "En Forme",
      description: "3 bons résultats d'affilée",
      icon: <Flame className="h-4 w-4" />,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      earned: streak >= 3,
    },
    {
      id: "streak5",
      name: "Inarrêtable",
      description: "5 bons résultats d'affilée",
      icon: <Flame className="h-4 w-4" />,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      earned: streak >= 5,
    },
    {
      id: "analyst",
      name: "Analyste",
      description: "10 résultats corrects",
      icon: <Award className="h-4 w-4" />,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      earned: correctResults >= 10,
    },
    {
      id: "master",
      name: "Maître",
      description: "100 pronostics soumis",
      icon: <Medal className="h-4 w-4" />,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      earned: totalPredictions >= 100,
    },
  ];
}

export function computePoints({ exactScores, correctResults, totalPredictions }: { exactScores: number; correctResults: number; totalPredictions: number }): number {
  // 10 pts per exact score, 3 pts per correct result, 1 pt per prediction
  return exactScores * 10 + correctResults * 3 + totalPredictions;
}

export default function BadgeGrid({ badges }: { badges: Badge[] }) {
  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  return (
    <div className="space-y-3">
      {earned.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {earned.map((badge) => (
            <div
              key={badge.id}
              className={cn(
                "rounded-xl p-3 text-center border border-border/50",
                badge.bgColor
              )}
            >
              <div className={cn("mx-auto mb-1", badge.color)}>{badge.icon}</div>
              <p className="text-[10px] font-bold text-foreground">{badge.name}</p>
              <p className="text-[8px] text-muted-foreground">{badge.description}</p>
            </div>
          ))}
        </div>
      )}
      {locked.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {locked.map((badge) => (
            <div
              key={badge.id}
              className="rounded-xl p-3 text-center border border-border/30 opacity-40"
            >
              <div className="mx-auto mb-1 text-muted-foreground">{badge.icon}</div>
              <p className="text-[10px] font-bold text-muted-foreground">{badge.name}</p>
              <p className="text-[8px] text-muted-foreground">{badge.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
