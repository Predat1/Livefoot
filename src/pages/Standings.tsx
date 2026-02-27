import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { useStandings } from "@/hooks/useApiFootball";
import { Trophy, ArrowUp, ArrowDown, Minus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import TeamLogo from "@/components/TeamLogo";
import { Skeleton } from "@/components/ui/skeleton";

const LEAGUES = [
  { id: "39", name: "Premier League", season: "2024" },
  { id: "140", name: "La Liga", season: "2024" },
  { id: "135", name: "Serie A", season: "2024" },
  { id: "78", name: "Bundesliga", season: "2024" },
  { id: "61", name: "Ligue 1", season: "2024" },
];

const Standings = () => {
  const [selectedLeague, setSelectedLeague] = useState(LEAGUES[0]);

  const { data: standings, isLoading, isError } = useStandings(selectedLeague.id, selectedLeague.season);

  const getFormBadge = (char: string) => {
    const colors: Record<string, string> = {
      W: "bg-primary text-primary-foreground",
      D: "bg-muted text-muted-foreground",
      L: "bg-destructive text-destructive-foreground",
    };
    return (
      <span className={cn("w-4 h-4 sm:w-5 sm:h-5 rounded text-[10px] sm:text-xs font-bold flex items-center justify-center", colors[char] || "bg-muted text-muted-foreground")}>
        {char}
      </span>
    );
  };

  return (
    <Layout>
      <SEOHead
        title="Classements Football - Tableaux des Ligues"
        description="Classements en direct de Premier League, La Liga, Serie A, Bundesliga et Ligue 1. Points, victoires, différence de buts et forme récente."
        keywords="classement ligue 1, classement premier league, tableau la liga, classement serie a, bundesliga classement"
      />
      <div className="container py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
            <h1 className="text-xl sm:text-3xl font-black text-foreground">Standings</h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground ml-3 sm:ml-4">League tables and rankings</p>
        </div>

        {/* League Selector */}
        <div className="mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 min-w-max">
            {LEAGUES.map((league) => (
              <button
                key={league.id}
                onClick={() => setSelectedLeague(league)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap",
                  selectedLeague.id === league.id
                    ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
                )}
              >
                {league.name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-6 rounded-lg" />
                  <Skeleton className="h-4 w-32" />
                  <div className="flex-1" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            Unable to load standings. Please try again.
          </div>
        )}

        {/* Standings Table */}
        {!isLoading && !isError && standings && (
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-4 sm:px-5 py-3 border-b border-border flex items-center gap-3">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-bold text-foreground">{selectedLeague.name}</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{selectedLeague.season}/{parseInt(selectedLeague.season) + 1}</p>
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-border text-[10px] sm:text-xs text-muted-foreground">
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">#</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Team</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">P</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">W</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">D</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">L</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">GF</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">GA</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">GD</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">Pts</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium hidden sm:table-cell">Form</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team, idx) => (
                    <tr key={team.team.id} className={cn("border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30", idx < 4 && "bg-primary/5")}>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <span className={cn("w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold", idx < 4 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                          {team.rank}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <Link to={`/teams/${team.team.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                          {team.team.logo ? (
                            <img src={team.team.logo} alt={team.team.name} className="h-6 w-6 object-contain" />
                          ) : (
                            <TeamLogo teamName={team.team.name} size="xs" className="!h-6 !w-6" />
                          )}
                          <span className="font-semibold text-xs sm:text-sm text-foreground">{team.team.name}</span>
                        </Link>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.played}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.win}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.draw}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.lose}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.goalsFor}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.goalsAgainst}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                        <span className={cn("text-xs sm:text-sm font-medium", team.goalsDiff > 0 ? "text-primary" : team.goalsDiff < 0 ? "text-destructive" : "text-muted-foreground")}>
                          {team.goalsDiff > 0 ? "+" : ""}{team.goalsDiff}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-xs sm:text-sm text-foreground">{team.points}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                          {team.form?.split("").map((char, i) => <span key={i}>{getFormBadge(char)}</span>)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isLoading && !isError && (!standings || standings.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            No standings data available for this league.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Standings;
