import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import {
  useTrendingLeagues, useAllLeagues, useStandings, useTopScorers,
  TIER1_IDS, TIER2_IDS, TRENDING_LEAGUE_SET,
  type StandingTeam, type AllLeagueItem,
} from "@/hooks/useApiFootball";
import { Trophy, ChevronRight, ChevronDown, Star, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useFavorites } from "@/hooks/useFavorites";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Target } from "lucide-react";

const Competitions = () => {
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { isFavorite, toggleFavorite, favorites } = useFavorites();

  const { data: trendingLeagues, isLoading: loadingTrending } = useTrendingLeagues();
  const { data: allLeagues, isLoading: loadingAll } = useAllLeagues();

  const isLoading = loadingTrending || loadingAll;

  // Popular = Tier1 + Tier2 + user favorites
  const popularLeagues = useMemo(() => {
    if (!allLeagues) return [];
    const favSet = new Set(favorites.competitions);
    const popularSet = new Set([...TIER1_IDS, ...TIER2_IDS]);
    
    return allLeagues
      .filter(l => popularSet.has(l.id) || favSet.has(l.id))
      .sort((a, b) => {
        // Tier1 first, then Tier2, then user favs
        const tier = (id: string) => TIER1_IDS.has(id) ? 3 : TIER2_IDS.has(id) ? 2 : 1;
        return tier(b.id) - tier(a.id);
      });
  }, [allLeagues, favorites.competitions]);

  // All leagues grouped by country (excluding popular ones already shown)
  const leaguesByCountry = useMemo(() => {
    if (!allLeagues) return {};
    const popularIds = new Set(popularLeagues.map(l => l.id));
    const filtered = allLeagues.filter(l => {
      if (popularIds.has(l.id)) return false;
      if (search) {
        const q = search.toLowerCase();
        return l.name.toLowerCase().includes(q) || l.country.toLowerCase().includes(q);
      }
      return true;
    });

    const grouped: Record<string, AllLeagueItem[]> = {};
    for (const l of filtered) {
      const country = l.country || "International";
      if (!grouped[country]) grouped[country] = [];
      grouped[country].push(l);
    }
    // Sort countries alphabetically, sort leagues within each country
    const sorted: Record<string, AllLeagueItem[]> = {};
    for (const country of Object.keys(grouped).sort()) {
      sorted[country] = grouped[country].sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [allLeagues, popularLeagues, search]);

  const countries = Object.keys(leaguesByCountry);

  // Find selected league info from trending (has season info)
  const selectedTrending = trendingLeagues?.find((l) => l.id === selectedCompetition);
  const selectedAll = allLeagues?.find((l) => l.id === selectedCompetition);
  const selectedLeague = selectedTrending || selectedAll;

  return (
    <Layout>
      <SEOHead
        title="Compétitions Football - Ligues & Coupes"
        description="Toutes les compétitions de football : Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Europa League et plus de 800 tournois."
        keywords="compétitions football, champions league, ligue 1, premier league, liga, serie a, coupe du monde"
      />
      <div className="container py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
            <h1 className="text-xl sm:text-3xl font-black text-foreground">Competitions</h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground ml-3 sm:ml-4">All leagues and tournaments from around the world</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leagues or countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="space-y-8">
            {/* Popular Section */}
            {!search && popularLeagues.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <h2 className="text-lg font-bold text-foreground">Populaires</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {popularLeagues.map((comp) => (
                    <LeagueRow
                      key={comp.id}
                      league={comp}
                      isSelected={selectedCompetition === comp.id}
                      isFav={isFavorite("competitions", comp.id)}
                      onSelect={() => setSelectedCompetition(selectedCompetition === comp.id ? null : comp.id)}
                      onToggleFav={() => toggleFavorite("competitions", comp.id, comp.name)}
                    />
                  ))}
                </div>

                {selectedCompetition && selectedLeague && popularLeagues.some(l => l.id === selectedCompetition) && (
                  <CompetitionDetail leagueId={selectedLeague.id} season={selectedLeague.season} />
                )}
              </section>
            )}

            {/* All Leagues by Country */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">
                  {search ? `Results for "${search}"` : "All Competitions"}
                </h2>
                <span className="text-sm text-muted-foreground">({countries.length} countries)</span>
              </div>

              {countries.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">No competitions found.</div>
              ) : (
                <Accordion type="multiple" className="space-y-1">
                  {countries.map((country) => (
                    <AccordionItem key={country} value={country} className="border rounded-xl bg-card overflow-hidden">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-3">
                          {leaguesByCountry[country][0]?.countryFlag && (
                            <img src={leaguesByCountry[country][0].countryFlag} alt="" className="h-4 w-6 object-cover rounded-sm" />
                          )}
                          <span className="font-semibold text-sm text-foreground">{country}</span>
                          <span className="text-xs text-muted-foreground">({leaguesByCountry[country].length})</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-2 pb-2">
                        <div className="space-y-1">
                          {leaguesByCountry[country].map((comp) => (
                            <LeagueRow
                              key={comp.id}
                              league={comp}
                              isSelected={selectedCompetition === comp.id}
                              isFav={isFavorite("competitions", comp.id)}
                              onSelect={() => setSelectedCompetition(selectedCompetition === comp.id ? null : comp.id)}
                              onToggleFav={() => toggleFavorite("competitions", comp.id, comp.name)}
                              compact
                            />
                          ))}
                        </div>

                        {selectedCompetition && selectedLeague && leaguesByCountry[country].some(l => l.id === selectedCompetition) && (
                          <CompetitionDetail leagueId={selectedLeague.id} season={selectedLeague.season} />
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
};

// League row component
function LeagueRow({
  league,
  isSelected,
  isFav,
  onSelect,
  onToggleFav,
  compact = false,
}: {
  league: AllLeagueItem;
  isSelected: boolean;
  isFav: boolean;
  onSelect: () => void;
  onToggleFav: () => void;
  compact?: boolean;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group cursor-pointer rounded-xl bg-card border border-border/50 transition-all duration-200 hover:bg-muted/30",
        compact ? "p-2.5" : "p-3 sm:p-4",
        isSelected && "ring-2 ring-primary"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {league.logo ? (
            <img src={league.logo} alt={league.name} className={cn("object-contain", compact ? "h-7 w-7" : "h-9 w-9 sm:h-10 sm:w-10")} />
          ) : (
            <div className={cn("rounded-lg bg-muted flex items-center justify-center", compact ? "h-7 w-7" : "h-9 w-9")}>
              <Trophy className="h-4 w-4 text-primary" />
            </div>
          )}
          <div>
            <h3 className={cn("font-bold text-foreground group-hover:text-primary transition-colors", compact ? "text-sm" : "text-sm sm:text-base")}>
              {league.name}
            </h3>
            {!compact && league.country && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {league.countryFlag && <img src={league.countryFlag} alt="" className="h-3 w-4 object-cover rounded-sm" />}
                <span>{league.country}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
            className="p-1"
          >
            <Star className={cn("h-4 w-4", isFav ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40 hover:text-primary")} />
          </button>
          {isSelected ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>
    </div>
  );
}

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
