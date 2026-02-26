import { Link } from "react-router-dom";
import { Star, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import TeamLogo from "./TeamLogo";

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
    <Link
      to={`/match/${match.id}`}
      className="group relative flex items-center justify-between px-3 sm:px-5 py-4 sm:py-5 transition-all duration-300 hover:bg-muted/30 border-b border-border/50 last:border-b-0"
    >
      {/* Live indicator bar */}
      {isLive && (
        <div className="absolute left-0 top-0 h-full w-1 bg-live rounded-r-full" />
      )}

      {/* Favorite button - hidden on mobile */}
      <button
        onClick={(e) => e.preventDefault()}
        className="mr-2 sm:mr-3 text-muted-foreground/40 hidden sm:block opacity-0 group-hover:opacity-100 transition-all duration-300 hover:text-primary hover:scale-110"
      >
        <Star className="h-4 w-4" />
      </button>

      {/* Home Team */}
      <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-3 min-w-0">
        <span
          className={cn(
            "text-sm sm:text-base font-semibold transition-colors truncate text-right",
            isFinished && match.homeTeam.score! > match.awayTeam.score!
              ? "text-foreground"
              : isFinished
                ? "text-muted-foreground"
                : "text-foreground"
          )}
        >
          {match.homeTeam.name}
        </span>
        {match.homeTeam.logo?.startsWith("http") ? (
          <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="h-6 w-6 sm:h-8 sm:w-8 object-contain flex-shrink-0" />
        ) : (
          <TeamLogo teamName={match.homeTeam.name} size="sm" />
        )}
      </div>

      {/* Score / Time */}
      <div className="mx-3 sm:mx-6 flex min-w-[80px] sm:min-w-[110px] flex-col items-center flex-shrink-0">
        {isLive || isFinished ? (
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <span
              className={cn(
                "min-w-[28px] sm:min-w-[36px] rounded-md sm:rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-center text-base sm:text-lg font-black shadow-sm transition-all duration-300",
                isLive
                  ? "bg-live text-primary-foreground shadow-live/30"
                  : "bg-score-bg text-primary-foreground"
              )}
            >
              {match.homeTeam.score}
            </span>
            <span className="text-base sm:text-xl font-bold text-muted-foreground">-</span>
            <span
              className={cn(
                "min-w-[28px] sm:min-w-[36px] rounded-md sm:rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-center text-base sm:text-lg font-black shadow-sm transition-all duration-300",
                isLive
                  ? "bg-live text-primary-foreground shadow-live/30"
                  : "bg-score-bg text-primary-foreground"
              )}
            >
              {match.awayTeam.score}
            </span>
          </div>
        ) : (
          <div className="rounded-md sm:rounded-lg bg-primary/10 px-3 sm:px-5 py-1.5 sm:py-2">
            <span className="text-sm sm:text-lg font-bold text-primary">
              {match.time}
            </span>
          </div>
        )}
        {isLive && match.minute && (
          <div className="mt-1 sm:mt-1.5 flex items-center gap-1">
            <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-live live-pulse" />
            <span className="text-[10px] sm:text-xs font-bold text-live">
              {match.minute}'
            </span>
          </div>
        )}
        {isFinished && (
          <span className="mt-0.5 sm:mt-1 text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            FT
          </span>
        )}
      </div>

      {/* Away Team */}
      <div className="flex flex-1 items-center gap-1.5 sm:gap-3 min-w-0">
        {match.awayTeam.logo?.startsWith("http") ? (
          <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="h-6 w-6 sm:h-8 sm:w-8 object-contain flex-shrink-0" />
        ) : (
          <TeamLogo teamName={match.awayTeam.name} size="sm" />
        )}
        <span
          className={cn(
            "text-sm sm:text-base font-semibold transition-colors truncate",
            isFinished && match.awayTeam.score! > match.homeTeam.score!
              ? "text-foreground"
              : isFinished
                ? "text-muted-foreground"
                : "text-foreground"
          )}
        >
          {match.awayTeam.name}
        </span>
      </div>

      {/* Arrow - hidden on mobile */}
      <div className="ml-2 sm:ml-3 text-muted-foreground/40 hidden sm:block opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:text-primary">
        <ChevronRight className="h-5 w-5" />
      </div>
    </Link>
  );
};

export default MatchCard;
