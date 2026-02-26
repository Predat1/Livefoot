import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import {
  useFixtureDetail, useFixtureEvents, useFixtureLineups, useFixtureStatistics,
  usePredictions, useHeadToHead, useFixturePlayers, useFixtureOdds, useFixtureInjuries,
} from "@/hooks/useApiFootball";
import {
  ArrowLeft, Clock, MapPin, Target, User, AlertTriangle, Repeat2, MessageSquare,
  Loader2, BarChart3, Swords, Star, DollarSign, HeartPulse, Users as UsersIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShareButton from "@/components/ShareButton";
import { Skeleton } from "@/components/ui/skeleton";
import TacticalPitch from "@/components/TacticalPitch";
import CommunityPredictions from "@/components/CommunityPredictions";

function mapFixtureStatus(s: string): "scheduled" | "live" | "finished" {
  const live = ["1H", "2H", "HT", "ET", "P", "BT", "LIVE", "INT"];
  const finished = ["FT", "AET", "PEN", "AWD", "WO"];
  if (live.includes(s)) return "live";
  if (finished.includes(s)) return "finished";
  return "scheduled";
}

function ratingColor(r: number) {
  if (r >= 8) return "text-emerald-500";
  if (r >= 7) return "text-primary";
  if (r >= 6) return "text-amber-500";
  return "text-destructive";
}

function ratingBg(r: number) {
  if (r >= 8) return "bg-emerald-500/10";
  if (r >= 7) return "bg-primary/10";
  if (r >= 6) return "bg-amber-500/10";
  return "bg-destructive/10";
}

const Match = () => {
  const { matchId } = useParams();

  const { data: fixtureData, isLoading } = useFixtureDetail(matchId || "");
  const { data: eventsData } = useFixtureEvents(matchId || "");
  const { data: lineupsData } = useFixtureLineups(matchId || "");
  const { data: statsData } = useFixtureStatistics(matchId || "");
  const { data: playersData } = useFixturePlayers(matchId || "");
  const { data: oddsData } = useFixtureOdds(matchId || "");
  const { data: injuriesData } = useFixtureInjuries(matchId || "");

  const fix = fixtureData as any;
  const homeTeamId = fix?.teams?.home?.id ? String(fix.teams.home.id) : "";
  const awayTeamId = fix?.teams?.away?.id ? String(fix.teams.away.id) : "";

  const { data: predictionsData } = usePredictions(matchId || "");
  const { data: h2hData } = useHeadToHead(homeTeamId, awayTeamId);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-48 rounded-2xl mb-6" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!fixtureData) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Match not found</h1>
          <Link to="/" className="text-primary hover:underline">Back to home</Link>
        </div>
      </Layout>
    );
  }

  const status = mapFixtureStatus(fix.fixture.status.short);
  const isLive = status === "live";
  const isFinished = status === "finished";
  const hasStats = isLive || isFinished;

  const homeTeam = { name: fix.teams.home.name, logo: fix.teams.home.logo, score: fix.goals?.home };
  const awayTeam = { name: fix.teams.away.name, logo: fix.teams.away.logo, score: fix.goals?.away };
  const league = fix.league;
  const venue = fix.fixture.venue;
  const referee = fix.fixture.referee;
  const minute = fix.fixture.status.elapsed;
  const time = new Date(fix.fixture.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const events = (eventsData || []) as any[];
  const teamStats = (statsData || []) as any[];
  const lineups = (lineupsData || []) as any[];
  const injuries = (injuriesData || []) as any[];
  const players = (playersData || []) as any[];
  const odds = (oddsData || []) as any[];

  const getEventIcon = (type: string, detail?: string) => {
    switch (type) {
      case "Goal": return <Target className="h-4 w-4 text-primary" />;
      case "Card":
        return detail === "Red Card"
          ? <div className="w-3 h-4 bg-destructive rounded-sm" />
          : <div className="w-3 h-4 bg-amber-500 rounded-sm" />;
      case "subst": return <Repeat2 className="h-4 w-4 text-muted-foreground" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Build tactical pitch data from lineups
  const tacticalData = lineups.length >= 2 ? {
    home: (lineups[0].startXI || []).map((item: any) => ({
      name: item.player?.name || "",
      number: item.player?.number || 0,
      pos: item.player?.pos || "MID",
    })),
    away: (lineups[1].startXI || []).map((item: any) => ({
      name: item.player?.name || "",
      number: item.player?.number || 0,
      pos: item.player?.pos || "MID",
    })),
  } : null;

  // ─── Tabs for live/finished matches ────────────────────────
  const renderTabs = () => {
    const tabItems = [
      { value: "events", label: "Events" },
      { value: "stats", label: "Stats" },
      { value: "lineups", label: "Compos" },
      ...(hasStats ? [{ value: "ratings", label: "Notes" }] : []),
      { value: "predictions", label: "Prédiction" },
      { value: "h2h", label: "H2H" },
      { value: "community", label: "Pronostics" },
      ...(odds.length > 0 ? [{ value: "odds", label: "Cotes" }] : []),
      ...(injuries.length > 0 ? [{ value: "injuries", label: "Blessures" }] : []),
    ];

    return (
      <Tabs defaultValue={hasStats ? "events" : "predictions"} className="w-full">
        <div className="overflow-x-auto -mx-4 px-4 mb-4">
          <TabsList className="inline-flex w-auto min-w-full bg-card border border-border/50 rounded-xl p-1">
            {tabItems.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="rounded-lg text-[10px] sm:text-xs whitespace-nowrap px-2 sm:px-3">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Events */}
        <TabsContent value="events" className="mt-0">
          <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-4 py-2.5 border-b border-border">
              <h3 className="font-bold text-sm text-foreground">Match Events</h3>
            </div>
            <div className="p-3 sm:p-4">
              {events.length > 0 ? (
                <div className="space-y-2">
                  {events.map((event: any, index: number) => {
                    const isHome = event.team.id === fix.teams.home.id;
                    return (
                      <div key={index} className="flex items-center gap-3 p-2 sm:p-3 rounded-lg bg-muted/30">
                        {isHome ? (
                          <>
                            <span className="w-10 text-center font-bold text-xs text-muted-foreground">{event.time.elapsed}'</span>
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">{getEventIcon(event.type, event.detail)}</div>
                            <div className="flex-1">
                              <span className="font-medium text-xs text-foreground">{event.player?.name}</span>
                              {event.assist?.name && <span className="text-[10px] text-muted-foreground ml-2">({event.assist.name})</span>}
                              {event.detail && <span className="text-[10px] text-muted-foreground ml-2">({event.detail})</span>}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 text-right">
                              <span className="font-medium text-xs text-foreground">{event.player?.name}</span>
                              {event.assist?.name && <span className="text-[10px] text-muted-foreground mr-2">({event.assist.name})</span>}
                            </div>
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">{getEventIcon(event.type, event.detail)}</div>
                            <span className="w-10 text-center font-bold text-xs text-muted-foreground">{event.time.elapsed}'</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm">No events yet</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Stats */}
        <TabsContent value="stats" className="mt-0">
          <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-4 py-2.5 border-b border-border">
              <h3 className="font-bold text-sm text-foreground">Match Statistics</h3>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {teamStats.length >= 2 ? (teamStats[0]?.statistics || []).map((stat: any, idx: number) => {
                const home = parseInt(String(stat.value).replace("%", "")) || 0;
                const awayStat = teamStats[1]?.statistics?.[idx];
                const away = parseInt(String(awayStat?.value).replace("%", "")) || 0;
                const total = home + away;
                const homePercent = total > 0 ? (home / total) * 100 : 50;
                const suffix = String(stat.value).includes("%") ? "%" : "";
                return (
                  <div key={stat.type}>
                    <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                      <span className="font-bold text-foreground">{home}{suffix}</span>
                      <span className="text-muted-foreground">{stat.type}</span>
                      <span className="font-bold text-foreground">{away}{suffix}</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                      <div className="bg-primary transition-all" style={{ width: `${homePercent}%` }} />
                      <div className="bg-muted-foreground/30 transition-all" style={{ width: `${100 - homePercent}%` }} />
                    </div>
                  </div>
                );
              }) : (
                <p className="text-center text-muted-foreground py-8 text-sm">No statistics available</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Lineups + Tactical Pitch */}
        <TabsContent value="lineups" className="mt-0 space-y-4">
          {/* Tactical Pitch */}
          {tacticalData && (
            <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-4 py-2.5 border-b border-border">
                <h3 className="font-bold text-sm text-foreground">Tactical View</h3>
              </div>
              <div className="p-4 sm:p-6">
                <TacticalPitch
                  homePlayers={tacticalData.home}
                  awayPlayers={tacticalData.away}
                  homeTeamName={homeTeam.name}
                  awayTeamName={awayTeam.name}
                />
              </div>
            </div>
          )}

          {/* Player list */}
          <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-4 py-2.5 border-b border-border">
              <h3 className="font-bold text-sm text-foreground">Lineups</h3>
            </div>
            <div className="p-4 sm:p-6">
              {lineups.length >= 2 ? (
                <div className="grid grid-cols-2 gap-4 sm:gap-8">
                  {lineups.map((teamLineup: any, tIdx: number) => (
                    <div key={tIdx}>
                      <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                        {teamLineup.team?.logo && <img src={teamLineup.team.logo} alt="" className="h-5 w-5 object-contain" />}
                        {teamLineup.team?.name} ({teamLineup.formation})
                      </h4>
                      <div className="space-y-1.5">
                        {(teamLineup.startXI || []).map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/30">
                            <span className="w-5 text-center text-[10px] font-bold text-muted-foreground">{item.player?.number}</span>
                            <span className="text-xs text-foreground flex-1">{item.player?.name}</span>
                          </div>
                        ))}
                      </div>
                      {(teamLineup.substitutes || []).length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Remplaçants</span>
                            <div className="h-px flex-1 bg-border" />
                          </div>
                          <div className="space-y-1 opacity-75">
                            {(teamLineup.substitutes || []).map((item: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/30">
                                <span className="w-5 text-center text-[10px] font-bold text-muted-foreground">{item.player?.number}</span>
                                <span className="text-xs text-foreground flex-1">{item.player?.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm">Lineups not available yet</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Player Ratings */}
        {hasStats && (
          <TabsContent value="ratings" className="mt-0">
            <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Player Ratings</h3>
              </div>
              <div className="p-4 sm:p-6">
                {players.length >= 2 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {players.map((teamData: any, tIdx: number) => (
                      <div key={tIdx}>
                        <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                          {teamData.team?.logo && <img src={teamData.team.logo} alt="" className="h-5 w-5 object-contain" />}
                          {teamData.team?.name}
                        </h4>
                        <div className="space-y-1.5">
                          {(teamData.players || [])
                            .sort((a: any, b: any) => {
                              const ra = parseFloat(a.statistics?.[0]?.games?.rating) || 0;
                              const rb = parseFloat(b.statistics?.[0]?.games?.rating) || 0;
                              return rb - ra;
                            })
                            .map((p: any, i: number) => {
                              const rating = parseFloat(p.statistics?.[0]?.games?.rating) || 0;
                              const goals = p.statistics?.[0]?.goals?.total || 0;
                              const assists = p.statistics?.[0]?.goals?.assists || 0;
                              return (
                                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                                  {p.player?.photo && (
                                    <img src={p.player.photo} alt="" className="h-7 w-7 rounded-full object-cover" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <Link to={`/players/${p.player?.id}`} className="text-xs font-medium text-foreground hover:text-primary transition-colors truncate block">
                                      {p.player?.name}
                                    </Link>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                      {goals > 0 && <span>⚽ {goals}</span>}
                                      {assists > 0 && <span>🅰️ {assists}</span>}
                                    </div>
                                  </div>
                                  {rating > 0 && (
                                    <span className={cn("px-2 py-1 rounded-lg text-xs font-black", ratingBg(rating), ratingColor(rating))}>
                                      {rating.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-sm">Player ratings not available</p>
                )}
              </div>
            </div>
          </TabsContent>
        )}

        {/* Predictions */}
        <TabsContent value="predictions" className="mt-0">
          <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Prédictions API</h3>
            </div>
            <div className="p-4 sm:p-6">
              {predictionsData ? (() => {
                const pred = predictionsData as any;
                const pct = pred.predictions?.percent;
                const advice = pred.predictions?.advice;
                const comparison = pred.comparison;
                return (
                  <div className="space-y-6">
                    {advice && (
                      <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <p className="text-xs text-muted-foreground mb-1">Conseil</p>
                        <p className="text-sm sm:text-base font-bold text-primary">{advice}</p>
                      </div>
                    )}
                    {pct && (
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-xl bg-muted/30 p-4">
                          <p className="text-2xl sm:text-3xl font-black text-foreground">{pct.home}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{homeTeam.name}</p>
                        </div>
                        <div className="rounded-xl bg-muted/30 p-4">
                          <p className="text-2xl sm:text-3xl font-black text-muted-foreground">{pct.draw}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Nul</p>
                        </div>
                        <div className="rounded-xl bg-muted/30 p-4">
                          <p className="text-2xl sm:text-3xl font-black text-foreground">{pct.away}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{awayTeam.name}</p>
                        </div>
                      </div>
                    )}
                    {comparison && (
                      <div className="space-y-3">
                        {Object.entries(comparison).map(([key, val]: [string, any]) => {
                          const hv = parseInt(String(val.home).replace("%", "")) || 0;
                          const av = parseInt(String(val.away).replace("%", "")) || 0;
                          const t = hv + av || 1;
                          return (
                            <div key={key}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-foreground">{val.home}</span>
                                <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                                <span className="font-bold text-foreground">{val.away}</span>
                              </div>
                              <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                                <div className="bg-primary transition-all" style={{ width: `${(hv / t) * 100}%` }} />
                                <div className="bg-muted-foreground/30 transition-all" style={{ width: `${(av / t) * 100}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })() : (
                <div className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Chargement des prédictions...</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* H2H */}
        <TabsContent value="h2h" className="mt-0">
          <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
              <Swords className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Historique des confrontations</h3>
            </div>
            <div className="p-4 sm:p-6">
              {h2hData && h2hData.length > 0 ? (() => {
                const matches = (h2hData as any[]).slice(0, 10);
                const homeWins = matches.filter((m: any) =>
                  (m.teams.home.winner === true && String(m.teams.home.id) === homeTeamId) ||
                  (m.teams.away.winner === true && String(m.teams.away.id) === homeTeamId)
                ).length;
                const awayWins = matches.filter((m: any) =>
                  (m.teams.home.winner === true && String(m.teams.home.id) === awayTeamId) ||
                  (m.teams.away.winner === true && String(m.teams.away.id) === awayTeamId)
                ).length;
                const draws = matches.length - homeWins - awayWins;
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-xl bg-primary/10 p-3">
                        <p className="text-2xl font-black text-primary">{homeWins}</p>
                        <p className="text-[10px] text-muted-foreground">{homeTeam.name}</p>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-3">
                        <p className="text-2xl font-black text-muted-foreground">{draws}</p>
                        <p className="text-[10px] text-muted-foreground">Nuls</p>
                      </div>
                      <div className="rounded-xl bg-primary/10 p-3">
                        <p className="text-2xl font-black text-primary">{awayWins}</p>
                        <p className="text-[10px] text-muted-foreground">{awayTeam.name}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {matches.map((m: any, i: number) => (
                        <Link key={i} to={`/match/${m.fixture.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                          <span className="text-[10px] text-muted-foreground w-16">
                            {new Date(m.fixture.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" })}
                          </span>
                          <div className="flex-1 flex items-center gap-2 justify-center">
                            <img src={m.teams.home.logo} alt="" className="h-5 w-5 object-contain" />
                            <span className="text-xs font-medium text-foreground">{m.teams.home.name}</span>
                            <span className="font-black text-sm text-foreground">{m.goals.home} - {m.goals.away}</span>
                            <span className="text-xs font-medium text-foreground">{m.teams.away.name}</span>
                            <img src={m.teams.away.logo} alt="" className="h-5 w-5 object-contain" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })() : (
                <p className="text-center text-muted-foreground py-8 text-sm">Aucun historique disponible</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Community Predictions */}
        <TabsContent value="community" className="mt-0">
          <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Pronostics Communauté</h3>
            </div>
            <div className="p-4 sm:p-6">
              <CommunityPredictions
                fixtureId={matchId || ""}
                homeTeamName={homeTeam.name}
                awayTeamName={awayTeam.name}
                homeLogo={homeTeam.logo}
                awayLogo={awayTeam.logo}
              />
            </div>
          </div>
        </TabsContent>

        {/* Odds */}
        {odds.length > 0 && (
          <TabsContent value="odds" className="mt-0">
            <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Cotes Bookmakers</h3>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  {odds.slice(0, 5).map((bookmaker: any, bIdx: number) => {
                    const bets = bookmaker.bookmakers?.[0];
                    if (!bets) return null;
                    return (
                      <div key={bIdx}>
                        <p className="text-xs font-bold text-foreground mb-2">{bets.name}</p>
                        {(bets.bets || []).slice(0, 3).map((bet: any, betIdx: number) => (
                          <div key={betIdx} className="mb-3">
                            <p className="text-[10px] text-muted-foreground mb-1.5">{bet.name}</p>
                            <div className="flex gap-2">
                              {(bet.values || []).map((val: any, vIdx: number) => (
                                <div key={vIdx} className="flex-1 rounded-lg bg-muted/30 p-2 text-center">
                                  <p className="text-[10px] text-muted-foreground">{val.value}</p>
                                  <p className="text-sm font-black text-foreground">{val.odd}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        {/* Injuries */}
        {injuries.length > 0 && (
          <TabsContent value="injuries" className="mt-0">
            <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-destructive" />
                <h3 className="font-bold text-sm text-foreground">Blessures & Absences</h3>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Home injuries */}
                  <div>
                    <h4 className="font-bold text-xs text-foreground mb-2 flex items-center gap-2">
                      {homeTeam.logo && <img src={homeTeam.logo} alt="" className="h-4 w-4 object-contain" />}
                      {homeTeam.name}
                    </h4>
                    <div className="space-y-1.5">
                      {injuries.filter((inj: any) => String(inj.team?.id) === homeTeamId).map((inj: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5">
                          {inj.player?.photo && <img src={inj.player.photo} alt="" className="h-6 w-6 rounded-full object-cover" />}
                          <div className="flex-1">
                            <p className="text-xs font-medium text-foreground">{inj.player?.name}</p>
                            <p className="text-[10px] text-destructive">{inj.player?.reason || "Injured"}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{inj.player?.type}</span>
                        </div>
                      ))}
                      {injuries.filter((inj: any) => String(inj.team?.id) === homeTeamId).length === 0 && (
                        <p className="text-xs text-muted-foreground">Aucune blessure signalée</p>
                      )}
                    </div>
                  </div>
                  {/* Away injuries */}
                  <div>
                    <h4 className="font-bold text-xs text-foreground mb-2 flex items-center gap-2">
                      {awayTeam.logo && <img src={awayTeam.logo} alt="" className="h-4 w-4 object-contain" />}
                      {awayTeam.name}
                    </h4>
                    <div className="space-y-1.5">
                      {injuries.filter((inj: any) => String(inj.team?.id) === awayTeamId).map((inj: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5">
                          {inj.player?.photo && <img src={inj.player.photo} alt="" className="h-6 w-6 rounded-full object-cover" />}
                          <div className="flex-1">
                            <p className="text-xs font-medium text-foreground">{inj.player?.name}</p>
                            <p className="text-[10px] text-destructive">{inj.player?.reason || "Injured"}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{inj.player?.type}</span>
                        </div>
                      ))}
                      {injuries.filter((inj: any) => String(inj.team?.id) === awayTeamId).length === 0 && (
                        <p className="text-xs text-muted-foreground">Aucune blessure signalée</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    );
  };

  return (
    <Layout>
      <SEOHead
        title={`${homeTeam.name} vs ${awayTeam.name} - ${isLive ? "Live" : isFinished ? "Result" : "Preview"}`}
        description={`${homeTeam.name} vs ${awayTeam.name} - ${league.name}`}
      />
      <div className="container py-4 sm:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
          <ShareButton title={`${homeTeam.name} vs ${awayTeam.name} | LiveFoot`} text={`${homeTeam.name} vs ${awayTeam.name}`} />
        </div>

        {/* Match Header */}
        <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden mb-4 sm:mb-6">
          <div className="bg-league-header px-4 sm:px-6 py-2 sm:py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              {league.flag && <img src={league.flag} alt="" className="h-4 w-5 object-cover rounded-sm" />}
              {league.logo && <img src={league.logo} alt="" className="h-5 w-5 object-contain" />}
              <span className="font-bold text-sm sm:text-base text-foreground">{league.name}</span>
            </div>
            {isLive && (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-live live-pulse" />
                <span className="text-xs sm:text-sm font-bold text-live">LIVE {minute}'</span>
              </div>
            )}
            {isFinished && <span className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase">Full Time</span>}
          </div>

          <div className="p-4 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <Link to={`/teams/${fix.teams.home.id}`} className="flex-1 text-center hover:opacity-80 transition-opacity">
                {homeTeam.logo && <img src={homeTeam.logo} alt={homeTeam.name} className="h-16 w-16 sm:h-20 sm:w-20 object-contain mx-auto mb-2" />}
                <h2 className="text-sm sm:text-xl font-bold text-foreground">{homeTeam.name}</h2>
              </Link>

              <div className="text-center flex-shrink-0">
                {hasStats ? (
                  <div className="flex items-center gap-2 sm:gap-4">
                    <span className={cn("text-3xl sm:text-5xl font-black", isLive ? "text-live" : "text-foreground")}>{homeTeam.score}</span>
                    <span className="text-xl sm:text-3xl text-muted-foreground">-</span>
                    <span className={cn("text-3xl sm:text-5xl font-black", isLive ? "text-live" : "text-foreground")}>{awayTeam.score}</span>
                  </div>
                ) : (
                  <div className="rounded-xl sm:rounded-2xl bg-primary/10 px-4 sm:px-6 py-3 sm:py-4">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-1 sm:mb-2" />
                    <span className="text-xl sm:text-3xl font-black text-primary">{time}</span>
                  </div>
                )}
              </div>

              <Link to={`/teams/${fix.teams.away.id}`} className="flex-1 text-center hover:opacity-80 transition-opacity">
                {awayTeam.logo && <img src={awayTeam.logo} alt={awayTeam.name} className="h-16 w-16 sm:h-20 sm:w-20 object-contain mx-auto mb-2" />}
                <h2 className="text-sm sm:text-xl font-bold text-foreground">{awayTeam.name}</h2>
              </Link>
            </div>

            <div className="mt-4 sm:mt-6 flex items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-muted-foreground flex-wrap">
              {venue?.name && <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /><span>{venue.name}</span></div>}
              {referee && <div className="flex items-center gap-1"><User className="h-3 w-3" /><span>{referee}</span></div>}
            </div>
          </div>
        </div>

        {/* All tabs */}
        {renderTabs()}
      </div>
    </Layout>
  );
};

export default Match;
