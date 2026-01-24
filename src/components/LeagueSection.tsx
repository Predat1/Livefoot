import { ChevronDown, Star } from "lucide-react";
import { useState } from "react";
import MatchCard from "./MatchCard";
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

interface League {
  id: string;
  name: string;
  country: string;
  countryFlag?: string;
  matches: Match[];
}

interface LeagueSectionProps {
  league: League;
  index?: number;
}

const LeagueSection = ({ league, index = 0 }: LeagueSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getFlagEmoji = (country: string) => {
    const flags: Record<string, string> = {
      England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      Spain: "🇪🇸",
      Italy: "🇮🇹",
      Germany: "🇩🇪",
      France: "🇫🇷",
      Argentina: "🇦🇷",
      Portugal: "🇵🇹",
      Netherlands: "🇳🇱",
    };
    return flags[country] || "⚽";
  };

  const hasLiveMatch = league.matches.some(m => m.status === "live");

  return (
    <div 
      className="mb-4 overflow-hidden rounded-2xl bg-card shadow-sm hover-lift card-shine animate-slide-up border border-border/50"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* League Header */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between bg-league-header px-4 py-3 transition-colors hover:bg-muted/50 group"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl drop-shadow-sm">{getFlagEmoji(league.country)}</span>
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold uppercase tracking-wide text-foreground">
              {league.name}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              {league.country} • {league.matches.length} matches
            </span>
          </div>
          {hasLiveMatch && (
            <div className="flex items-center gap-1.5 rounded-full bg-live/10 px-2.5 py-1 ml-2">
              <span className="h-2 w-2 rounded-full bg-live live-pulse" />
              <span className="text-[10px] font-bold text-live uppercase">Live</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="text-muted-foreground/50 hover:text-primary transition-colors p-1 opacity-0 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <Star className="h-4 w-4" />
          </button>
          <ChevronDown 
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-300",
              !isExpanded && "-rotate-90"
            )} 
          />
        </div>
      </button>

      {/* Matches */}
      <div className={cn(
        "transition-all duration-300 overflow-hidden",
        isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
      )}>
        {league.matches.map((match, matchIndex) => (
          <div 
            key={match.id}
            className="animate-fade-in"
            style={{ animationDelay: `${matchIndex * 50}ms` }}
          >
            <MatchCard match={match} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeagueSection;
