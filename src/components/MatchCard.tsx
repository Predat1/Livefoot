import { MoreVertical } from "lucide-react";
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
    <div className="group flex items-center justify-between border-b border-border px-4 py-3 transition-colors hover:bg-muted/50 last:border-b-0">
      {/* Home Team */}
      <div className="flex flex-1 items-center justify-end gap-2">
        <span className="text-sm font-medium text-foreground">
          {match.homeTeam.name}
        </span>
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
          {match.homeTeam.logo ? (
            <img
              src={match.homeTeam.logo}
              alt={match.homeTeam.name}
              className="h-5 w-5 object-contain"
            />
          ) : (
            <div className="h-4 w-4 rounded-full bg-primary/30" />
          )}
        </div>
      </div>

      {/* Score / Time */}
      <div className="mx-4 flex min-w-[80px] flex-col items-center">
        {isLive || isFinished ? (
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "min-w-[24px] rounded px-1.5 py-0.5 text-center text-sm font-bold",
                isLive
                  ? "bg-live text-primary-foreground"
                  : "bg-score-bg text-primary-foreground"
              )}
            >
              {match.homeTeam.score}
            </span>
            <span className="text-muted-foreground">-</span>
            <span
              className={cn(
                "min-w-[24px] rounded px-1.5 py-0.5 text-center text-sm font-bold",
                isLive
                  ? "bg-live text-primary-foreground"
                  : "bg-score-bg text-primary-foreground"
              )}
            >
              {match.awayTeam.score}
            </span>
          </div>
        ) : (
          <span className="text-sm font-semibold text-match-time">
            {match.time}
          </span>
        )}
        {isLive && match.minute && (
          <span className="mt-1 text-xs font-medium text-live live-pulse">
            {match.minute}'
          </span>
        )}
      </div>

      {/* Away Team */}
      <div className="flex flex-1 items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
          {match.awayTeam.logo ? (
            <img
              src={match.awayTeam.logo}
              alt={match.awayTeam.name}
              className="h-5 w-5 object-contain"
            />
          ) : (
            <div className="h-4 w-4 rounded-full bg-primary/30" />
          )}
        </div>
        <span className="text-sm font-medium text-foreground">
          {match.awayTeam.name}
        </span>
      </div>

      {/* More options */}
      <button className="ml-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        <MoreVertical className="h-4 w-4" />
      </button>
    </div>
  );
};

export default MatchCard;
