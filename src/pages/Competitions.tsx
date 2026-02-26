import { useState } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { useTrendingLeagues, useStandings, useTopScorers, type StandingTeam } from "@/hooks/useApiFootball";
import { Trophy, Users, Target, ChevronRight, ChevronDown, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFavorites } from "@/hooks/useFavorites";
import { Skeleton } from "@/components/ui/skeleton";

const Competitions = () => {
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  const { data: leagues, isLoading } = useTrendingLeagues();

  const selectedLeague = leagues?.find((l) => l.id === selectedCompetition);

  return (
    <Layout>
      <SEOHead title="Football Competitions" description="Explore leagues, cups and tournaments from around the world." />
      <div className="container py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
            <h1 className="text-xl sm:text-3xl font-black text-foreground">Competitions</h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground ml-3 sm:ml-4">Trending leagues and tournaments from around the world</p>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && leagues && (
          <div className="space-y-3 sm:space-y-4">
            {leagues.map((competition, index) => (
              <div key={competition.id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                <div
                  onClick={() => setSelectedCompetition(selectedCompetition === competition.id ? null : competition.id)}
                  className={cn(
                    "group cursor-pointer rounded-xl sm:rounded-2xl bg-card border border-border/50 p-4 sm:p-5 transition-all duration-300 hover-lift",
                    selectedCompetition === competition.id && "ring-2 ring-primary"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {competition.logo ? (
                        <img src={competition.logo} alt={competition.name} className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
                      ) : (
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-muted flex items-center justify-center">
                          <Trophy className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors">{competition.name}</h3>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          {competition.countryFlag && <img src={competition.countryFlag} alt="" className="h-3 w-4 object-cover rounded-sm" />}
                          <span>{competition.country}</span>
                          <span>•</span>
                          <span>{competition.season}/{parseInt(competition.season) + 1}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite("competitions", competition.id, competition.name); }} className="p-1">
                        <Star className={cn("h-4 w-4", isFavorite("competitions", competition.id) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40 hover:text-primary")} />
                      </button>
                      {selectedCompetition === competition.id ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </div>
                </div>

                {selectedCompetition === competition.id && selectedLeague && (
                  <CompetitionDetail leagueId={selectedLeague.id} season={selectedLeague.season} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

// Sub-component for competition details (standings + top scorers)
function CompetitionDetail({ leagueId, season }: { leagueId: string; season: string }) {
  const { data: standings, isLoading: loadingStandings } = useStandings(leagueId, season);
  const { data: scorers, isLoading: loadingScorers } = useTopScorers(leagueId, season);

  const getFormBadge = (result: string) => {
    const colors: Record<string, string> = { W: "bg-primary text-primary-foreground", D: "bg-muted text-muted-foreground", L: "bg-destructive text-destructive-foreground" };
    return <span className={cn("w-4 h-4 sm:w-5 sm:h-5 rounded text-[10px] sm:text-xs font-bold flex items-center justify-center", colors[result])}>{result}</span>;
  };

  return (
    <div className="mt-2 rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden animate-fade-in">
      <Tabs defaultValue="standings" className="w-full">
        <div className="bg-league-header px-3 sm:px-5 py-2 sm:py-3 border-b border-border">
          <TabsList className="bg-transparent h-auto p-0 gap-1 sm:gap-2">
            <TabsTrigger value="standings" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md sm:rounded-lg">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Standings
            </TabsTrigger>
            <TabsTrigger value="scorers" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md sm:rounded-lg">
              <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Top Scorers
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="standings" className="m-0">
          {loadingStandings ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
            </div>
          ) : standings && standings.length > 0 ? (
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-border text-[10px] sm:text-xs text-muted-foreground">
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">#</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Team</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">P</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">W</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">D</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">L</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">GD</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">Pts</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium hidden sm:table-cell">Form</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team: StandingTeam, idx: number) => (
                    <tr key={team.team.id} className={cn("border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30", idx < 4 && "bg-primary/5")}>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <span className={cn("w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold", idx < 4 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{team.rank}</span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center gap-2">
                          {team.team.logo && <img src={team.team.logo} alt="" className="h-6 w-6 object-contain" />}
                          <span className="font-semibold text-xs sm:text-sm text-foreground">{team.team.name}</span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.played}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.win}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.draw}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.lose}</td>
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
          ) : (
            <div className="p-8 text-center text-muted-foreground">No standings available.</div>
          )}
        </TabsContent>

        <TabsContent value="scorers" className="m-0">
          {loadingScorers ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : scorers && scorers.length > 0 ? (
            <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
              {scorers.slice(0, 10).map((scorer, idx) => (
                <div key={scorer.id} className={cn("flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl transition-colors", idx === 0 ? "bg-primary/10" : "bg-muted/30 hover:bg-muted/50")}>
                  <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg", idx === 0 ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{idx + 1}</div>
                  {scorer.photoUrl ? (
                    <img src={scorer.photoUrl} alt={scorer.name} className="h-10 w-10 rounded-full object-cover bg-muted" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">{scorer.name.charAt(0)}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm sm:text-base text-foreground truncate">{scorer.name}</h4>
                    <div className="flex items-center gap-1.5">
                      {scorer.teamLogo && <img src={scorer.teamLogo} alt="" className="h-4 w-4 object-contain" />}
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{scorer.team}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-6">
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-black text-primary">{scorer.goals}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">Goals</div>
                    </div>
                    <div className="text-center hidden sm:block">
                      <div className="text-lg font-bold text-foreground">{scorer.assists}</div>
                      <div className="text-xs text-muted-foreground">Assists</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">No top scorers data available.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Competitions;
