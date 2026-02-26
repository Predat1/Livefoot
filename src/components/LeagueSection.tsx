import { ChevronDown, Star } from "lucide-react";
import { useState } from "react";
import MatchCard from "./MatchCard";
import LeagueLogo from "./LeagueLogo";
import CountryFlag from "./CountryFlag";
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
  flag?: string;
  logo?: string;
  matches: Match[];
}

interface LeagueSectionProps {
  league: League;
  index?: number;
}

const LeagueSection = ({ league, index = 0 }: LeagueSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const hasLiveMatch = league.matches.some((m) => m.status === "live");

  return (
    <div
      className="mb-3 sm:mb-4 overflow-hidden rounded-xl sm:rounded-2xl bg-card shadow-sm hover-lift card-shine animate-slide-up border border-border/50"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* League Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between bg-league-header px-3 sm:px-4 py-2.5 sm:py-3 transition-colors hover:bg-muted/50 group"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5">
            {league.flag ? (
              <img src={league.flag} alt={league.country} className="h-5 w-7 rounded-sm object-cover shadow-sm" />
            ) : (
              <CountryFlag country={league.country} size="md" />
            )}
            {league.logo ? (
              <img src={league.logo} alt={league.name} className="h-6 w-6 sm:h-8 sm:w-8 object-contain" />
            ) : (
              <LeagueLogo leagueId={league.id} leagueName={league.name} size="sm" />
            )}
          </div>
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm sm:text-base font-bold uppercase tracking-wide text-foreground truncate max-w-[150px] sm:max-w-none">
              {league.name}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
              {league.matches.length} matches
            </span>
          </div>
          {hasLiveMatch && (
            <div className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-live/10 px-2 py-0.5 sm:py-1 flex-shrink-0">
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-live live-pulse" />
              <span className="text-[9px] sm:text-[10px] font-bold text-live uppercase">Live</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            className="text-muted-foreground/50 hover:text-primary transition-colors p-1 hidden sm:block opacity-0 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <Star className="h-4 w-4" />
          </button>
          <ChevronDown
            className={cn(
              "h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-transform duration-300",
              !isExpanded && "-rotate-90"
            )}
          />
        </div>
      </button>

      {/* Matches */}
      <div
        className={cn(
          "transition-all duration-300 overflow-hidden",
          isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
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
