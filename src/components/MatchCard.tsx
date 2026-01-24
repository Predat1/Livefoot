import { Star, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Team {
  name: string;
  logo?: string;
  score?: number;
}

interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  time: string;
  status: "scheduled" | "live" | "finished";
  minute?: number;
}

interface MatchCardProps {
  match: Match;
}

const MatchCard = ({ match }: MatchCardProps) => {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  return (
    <div className="group relative flex items-center justify-between px-4 py-4 transition-all duration-300 hover:bg-muted/30 border-b border-border/50 last:border-b-0">
      {/* Live indicator bar */}
      {isLive && (
        <div className="absolute left-0 top-0 h-full w-1 bg-live rounded-r-full" />
      )}

      {/* Favorite button */}
      <button className="mr-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:text-primary hover:scale-110">
        <Star className="h-4 w-4" />
      </button>

      {/* Home Team */}
      <div className="flex flex-1 items-center justify-end gap-3">
        <span className={cn(
          "text-sm font-semibold transition-colors",
          isFinished && match.homeTeam.score! > match.awayTeam.score! 
            ? "text-foreground" 
            : isFinished 
              ? "text-muted-foreground" 
              : "text-foreground"
        )}>
          {match.homeTeam.name}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/80 shadow-sm transition-transform duration-300 group-hover:scale-110">
          {match.homeTeam.logo ? (
            <img
              src={match.homeTeam.logo}
              alt={match.homeTeam.name}
              className="h-6 w-6 object-contain"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-primary/40 to-primary/20" />
          )}
        </div>
      </div>

      {/* Score / Time */}
      <div className="mx-5 flex min-w-[100px] flex-col items-center">
        {isLive || isFinished ? (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "min-w-[32px] rounded-lg px-2 py-1 text-center text-base font-black shadow-sm transition-all duration-300",
                isLive
                  ? "bg-live text-primary-foreground shadow-live/30"
                  : "bg-score-bg text-primary-foreground"
              )}
            >
              {match.homeTeam.score}
            </span>
            <span className="text-lg font-bold text-muted-foreground">-</span>
            <span
              className={cn(
                "min-w-[32px] rounded-lg px-2 py-1 text-center text-base font-black shadow-sm transition-all duration-300",
                isLive
                  ? "bg-live text-primary-foreground shadow-live/30"
                  : "bg-score-bg text-primary-foreground"
              )}
            >
              {match.awayTeam.score}
            </span>
          </div>
        ) : (
          <div className="rounded-lg bg-primary/10 px-4 py-1.5">
            <span className="text-base font-bold text-primary">
              {match.time}
            </span>
          </div>
        )}
        {isLive && match.minute && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-live live-pulse" />
            <span className="text-xs font-bold text-live">
              {match.minute}'
            </span>
          </div>
        )}
        {isFinished && (
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Full Time
          </span>
        )}
      </div>

      {/* Away Team */}
      <div className="flex flex-1 items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/80 shadow-sm transition-transform duration-300 group-hover:scale-110">
          {match.awayTeam.logo ? (
            <img
              src={match.awayTeam.logo}
              alt={match.awayTeam.name}
              className="h-6 w-6 object-contain"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-accent/40 to-accent/20" />
          )}
        </div>
        <span className={cn(
          "text-sm font-semibold transition-colors",
          isFinished && match.awayTeam.score! > match.homeTeam.score! 
            ? "text-foreground" 
            : isFinished 
              ? "text-muted-foreground" 
              : "text-foreground"
        )}>
          {match.awayTeam.name}
        </span>
      </div>

      {/* Arrow */}
      <button className="ml-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:text-primary">
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

export default MatchCard;
