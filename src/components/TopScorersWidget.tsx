import { useTopScorers } from "@/hooks/useApiFootball";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { buildEntitySlug } from "@/utils/slugify";
import { Trophy, ArrowRight, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ShareWidget from "./ShareWidget";

interface TopScorersWidgetProps {
  leagueId: string;
  season: string;
  title: string;
  className?: string;
}

const TopScorersWidget = ({ leagueId, season, title, className }: TopScorersWidgetProps) => {
  const { data: scorers, isLoading } = useTopScorers(leagueId, season);

  if (isLoading) {
    return (
      <div className={cn("flex gap-2 overflow-x-auto scrollbar-hide", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="flex-shrink-0 w-28 h-36 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!scorers || scorers.length === 0) return null;

  return (
    <section className={cn("mb-6 sm:mb-8", className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
          <Trophy className="h-4 w-4 text-primary" />
          <h2 className="text-sm sm:text-base font-bold text-foreground">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <ShareWidget 
            variant="minimal"
            title={`Meilleurs Buteurs - ${title}`}
            text={`Découvre les meilleurs buteurs de ${title} sur LiveFoot.fun !`}
            url={`/rankings?league=${leagueId}`}
          />
          <Link
            to={`/rankings?league=${leagueId}`}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Classement <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
      <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-1">
        {scorers.slice(0, 6).map((player, index) => (
          <Link
            key={player.id}
            to={`/players/${buildEntitySlug(player.id, player.name)}`}
            className="flex-shrink-0 w-28 sm:w-32 rounded-xl bg-card border border-border/50 p-3 text-center hover-lift transition-all animate-scale-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="relative mx-auto mb-2">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-primary/20 overflow-hidden mx-auto bg-muted">
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span className={cn(
                "absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black shadow-lg",
                index === 0 ? "bg-amber-500 text-white" :
                index === 1 ? "bg-slate-400 text-white" :
                index === 2 ? "bg-amber-700 text-white" :
                "bg-primary/20 text-primary"
              )}>
                {index + 1}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-bold text-foreground truncate">{player.name}</p>
            <div className="flex flex-col items-center mt-1">
               <span className="text-xs font-black text-primary">{player.goals} buts</span>
               <span className="text-[9px] text-muted-foreground truncate w-full">{player.team}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default TopScorersWidget;
