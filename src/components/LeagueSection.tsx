import { MoreVertical } from "lucide-react";
import MatchCard from "./MatchCard";

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
}

const LeagueSection = ({ league }: LeagueSectionProps) => {
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

  return (
    <div className="mb-4 animate-fade-in overflow-hidden rounded-lg bg-card shadow-sm">
      {/* League Header */}
      <div className="flex items-center justify-between bg-league-header px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getFlagEmoji(league.country)}</span>
          <span className="text-sm font-bold uppercase tracking-wide text-foreground">
            {league.name}
          </span>
        </div>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Matches */}
      <div>
        {league.matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
};

export default LeagueSection;
