import { useState } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { mockCompetitions, standingsData, topScorers } from "@/data/competitionsData";
import { mockPlayers } from "@/data/playersData";
import { Trophy, Users, Target, ChevronRight, ChevronDown, ArrowUp, ArrowDown, Minus, Calendar, Star, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeagueLogo from "@/components/LeagueLogo";
import CountryFlag from "@/components/CountryFlag";
import TeamLogo from "@/components/TeamLogo";
import PlayerAvatar from "@/components/PlayerAvatar";
import { useFavorites } from "@/hooks/useFavorites";

const Competitions = () => {
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleCompetitionClick = (id: string) => {
    setSelectedCompetition(selectedCompetition === id ? null : id);
  };

  const getStandings = (id: string) => standingsData[id] || [];
  const getTopScorers = (id: string) => topScorers[id] || [];

  const getPlayerPhoto = (name: string) => mockPlayers.find((p) => p.name === name)?.photoUrl;

  const getTrendIcon = (trend: "up" | "down" | "same") => {
    switch (trend) {
      case "up": return <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />;
      case "down": return <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />;
      default: return <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />;
    }
  };

  const getFormBadge = (result: string) => {
    const colors: Record<string, string> = { W: "bg-primary text-primary-foreground", D: "bg-muted text-muted-foreground", L: "bg-destructive text-destructive-foreground" };
    return <span className={cn("w-4 h-4 sm:w-5 sm:h-5 rounded text-[10px] sm:text-xs font-bold flex items-center justify-center", colors[result])}>{result}</span>;
  };

  return (
    <Layout>
      <SEOHead title="Football Competitions" description="Explore leagues, cups and tournaments from around the world - standings, top scorers and more." />
      <div className="container py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
            <h1 className="text-xl sm:text-3xl font-black text-foreground">Competitions</h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground ml-3 sm:ml-4">Explore leagues, cups, and tournaments from around the world</p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {mockCompetitions.map((competition, index) => (
            <div key={competition.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              <div
                onClick={() => handleCompetitionClick(competition.id)}
                className={cn("group cursor-pointer rounded-xl sm:rounded-2xl bg-card border border-border/50 p-4 sm:p-5 transition-all duration-300 hover-lift", selectedCompetition === competition.id && "ring-2 ring-primary")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <LeagueLogo leagueId={competition.id} leagueName={competition.name} size="lg" />
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors">{competition.name}</h3>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <CountryFlag country={competition.country} size="sm" />
                        <span>{competition.country}</span>
                        <span>•</span>
                        <span>{competition.season}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-6">
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite("competitions", competition.id); }} className="p-1">
                      <Star className={cn("h-4 w-4", isFavorite("competitions", competition.id) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40 hover:text-primary")} />
                    </button>
                    <div className="hidden sm:flex items-center gap-4 sm:gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground"><Users className="h-3 w-3 sm:h-4 sm:w-4" /><span className="text-xs sm:text-sm font-medium">{competition.teams}</span></div>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">Teams</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-3 w-3 sm:h-4 sm:w-4" /><span className="text-xs sm:text-sm font-medium">{competition.currentMatchday}/{competition.totalMatchdays}</span></div>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">Matchday</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-primary"><Target className="h-3 w-3 sm:h-4 sm:w-4" /><span className="text-xs sm:text-sm font-bold">{competition.topScorerGoals}</span></div>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">{competition.topScorer}</span>
                      </div>
                    </div>
                    {selectedCompetition === competition.id ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </div>
                <div className="sm:hidden mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-2">
                  <div className="text-center"><span className="text-sm font-bold text-foreground">{competition.teams}</span><p className="text-[10px] text-muted-foreground">Teams</p></div>
                  <div className="text-center"><span className="text-sm font-bold text-foreground">{competition.currentMatchday}/{competition.totalMatchdays}</span><p className="text-[10px] text-muted-foreground">Matchday</p></div>
                  <div className="text-center"><span className="text-sm font-bold text-primary">{competition.topScorerGoals}</span><p className="text-[10px] text-muted-foreground">{competition.topScorer}</p></div>
                </div>
              </div>

              {selectedCompetition === competition.id && (
                <div className="mt-2 rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden animate-fade-in">
                  <Tabs defaultValue="standings" className="w-full">
                    <div className="bg-league-header px-3 sm:px-5 py-2 sm:py-3 border-b border-border">
                      <TabsList className="bg-transparent h-auto p-0 gap-1 sm:gap-2">
                        <TabsTrigger value="standings" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md sm:rounded-lg"><Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Standings</TabsTrigger>
                        <TabsTrigger value="scorers" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md sm:rounded-lg"><Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Top Scorers</TabsTrigger>
                        <TabsTrigger value="fixtures" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md sm:rounded-lg"><Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Fixtures</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="standings" className="m-0">
                      {getStandings(competition.id).length > 0 ? (
                        <div className="overflow-x-auto">
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
                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium w-8"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {getStandings(competition.id).map((team, idx) => (
                                <tr key={team.team} className={cn("border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30", idx < 4 && "bg-primary/5")}>
                                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                                    <span className={cn("w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold", idx < 4 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{team.position}</span>
                                  </td>
                                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                                    <div className="flex items-center gap-2">
                                      <TeamLogo teamName={team.team} size="xs" className="!h-6 !w-6" />
                                      <span className="font-semibold text-xs sm:text-sm text-foreground">{team.team}</span>
                                    </div>
                                  </td>
                                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.played}</td>
                                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.won}</td>
                                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.drawn}</td>
                                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.lost}</td>
                                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                                    <span className={cn("text-xs sm:text-sm font-medium", team.gd > 0 ? "text-primary" : team.gd < 0 ? "text-destructive" : "text-muted-foreground")}>{team.gd > 0 ? "+" : ""}{team.gd}</span>
                                  </td>
                                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-xs sm:text-sm text-foreground">{team.points}</td>
                                  <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                                    <div className="flex items-center justify-center gap-0.5 sm:gap-1">{team.form.map((result, i) => <span key={i}>{getFormBadge(result)}</span>)}</div>
                                  </td>
                                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">{getTrendIcon(team.trend)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-muted-foreground"><p>No standings available.</p></div>
                      )}
                    </TabsContent>

                    <TabsContent value="scorers" className="m-0">
                      {getTopScorers(competition.id).length > 0 ? (
                        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                          {getTopScorers(competition.id).map((scorer, idx) => (
                            <div key={scorer.player} className={cn("flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl transition-colors", idx === 0 ? "bg-primary/10" : "bg-muted/30 hover:bg-muted/50")}>
                              <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg", idx === 0 ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{scorer.position}</div>
                              <PlayerAvatar name={scorer.player} photoUrl={getPlayerPhoto(scorer.player)} size="sm" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm sm:text-base text-foreground truncate">{scorer.player}</h4>
                                <div className="flex items-center gap-1.5">
                                  <TeamLogo teamName={scorer.team} size="xs" className="!h-4 !w-4 !rounded" />
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
                        <div className="p-8 text-center text-muted-foreground"><p>No top scorers data available.</p></div>
                      )}
                      </TabsContent>

                      {/* Fixtures Tab */}
                      <TabsContent value="fixtures" className="m-0">
                        <div className="p-3 sm:p-4 space-y-2">
                          {[
                            { home: "TBD", away: "TBD", date: "Feb 8", time: "15:00", matchday: competition.currentMatchday + 1 },
                            { home: "TBD", away: "TBD", date: "Feb 8", time: "17:30", matchday: competition.currentMatchday + 1 },
                            { home: "TBD", away: "TBD", date: "Feb 9", time: "15:00", matchday: competition.currentMatchday + 1 },
                            { home: "TBD", away: "TBD", date: "Feb 9", time: "20:45", matchday: competition.currentMatchday + 1 },
                            { home: "TBD", away: "TBD", date: "Feb 15", time: "15:00", matchday: competition.currentMatchday + 2 },
                          ].map((f, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                              <span className="text-[10px] text-muted-foreground w-20">MD {f.matchday}</span>
                              <div className="flex-1 flex items-center justify-center gap-3">
                                <span className="text-xs font-semibold text-foreground truncate text-right flex-1">{f.home}</span>
                                <span className="text-[10px] font-bold text-muted-foreground px-2 py-1 bg-muted rounded-md">vs</span>
                                <span className="text-xs font-semibold text-foreground truncate flex-1">{f.away}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground w-20 text-right">{f.date} {f.time}</span>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Competitions;
