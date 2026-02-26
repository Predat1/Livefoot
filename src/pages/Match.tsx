import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { useFixtureDetail, useFixtureEvents, useFixtureLineups, useFixtureStatistics } from "@/hooks/useApiFootball";
import { ArrowLeft, Clock, MapPin, Users, Target, User, AlertTriangle, Repeat2, MessageSquare, LayoutGrid, TrendingUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShareButton from "@/components/ShareButton";
import { Skeleton } from "@/components/ui/skeleton";

function mapFixtureStatus(s: string): "scheduled" | "live" | "finished" {
  const live = ["1H", "2H", "HT", "ET", "P", "BT", "LIVE", "INT"];
  const finished = ["FT", "AET", "PEN", "AWD", "WO"];
  if (live.includes(s)) return "live";
  if (finished.includes(s)) return "finished";
  return "scheduled";
}

const Match = () => {
  const { matchId } = useParams();

  const { data: fixtureData, isLoading } = useFixtureDetail(matchId || "");
  const { data: eventsData } = useFixtureEvents(matchId || "");
  const { data: lineupsData } = useFixtureLineups(matchId || "");
  const { data: statsData } = useFixtureStatistics(matchId || "");

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

  const fix = fixtureData as any;
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

  // Events
  const events = (eventsData || []) as any[];

  // Statistics
  const teamStats = (statsData || []) as any[];
  const getStat = (teamIdx: number, statName: string) => {
    const team = teamStats[teamIdx];
    if (!team?.statistics) return 0;
    const stat = team.statistics.find((s: any) => s.type === statName);
    return stat?.value ?? 0;
  };

  // Lineups
  const lineups = (lineupsData || []) as any[];

  const getEventIcon = (type: string) => {
    switch (type) {
      case "Goal": return <Target className="h-4 w-4 text-primary" />;
      case "Card": return <div className="w-3 h-4 bg-yellow-500 rounded-sm" />;
      case "subst": return <Repeat2 className="h-4 w-4 text-muted-foreground" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
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
            <ArrowLeft className="h-4 w-4" /> Back to matches
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

        {/* Tabs */}
        {hasStats ? (
          <Tabs defaultValue="events" className="w-full">
            <TabsList className="w-full grid grid-cols-4 bg-card border border-border/50 rounded-xl p-1 mb-4">
              <TabsTrigger value="events" className="rounded-lg text-[10px] sm:text-sm">Events</TabsTrigger>
              <TabsTrigger value="stats" className="rounded-lg text-[10px] sm:text-sm">Stats</TabsTrigger>
              <TabsTrigger value="lineups" className="rounded-lg text-[10px] sm:text-sm">Lineups</TabsTrigger>
              <TabsTrigger value="commentary" className="rounded-lg text-[10px] sm:text-sm">Live</TabsTrigger>
            </TabsList>

            {/* Events */}
            <TabsContent value="events" className="mt-0">
              <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-4 sm:px-5 py-2 sm:py-3 border-b border-border">
                  <h3 className="font-bold text-sm sm:text-base text-foreground">Match Events</h3>
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
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">{getEventIcon(event.type)}</div>
                                <div className="flex-1">
                                  <span className="font-medium text-xs text-foreground">{event.player?.name}</span>
                                  {event.assist?.name && <span className="text-[10px] text-muted-foreground ml-2">(assist: {event.assist.name})</span>}
                                  {event.detail && <span className="text-[10px] text-muted-foreground ml-2">({event.detail})</span>}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex-1 text-right">
                                  <span className="font-medium text-xs text-foreground">{event.player?.name}</span>
                                  {event.assist?.name && <span className="text-[10px] text-muted-foreground mr-2">(assist: {event.assist.name})</span>}
                                </div>
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">{getEventIcon(event.type)}</div>
                                <span className="w-10 text-center font-bold text-xs text-muted-foreground">{event.time.elapsed}'</span>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No events yet</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Stats */}
            <TabsContent value="stats" className="mt-0">
              <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-4 sm:px-5 py-2 sm:py-3 border-b border-border">
                  <h3 className="font-bold text-sm sm:text-base text-foreground">Match Statistics</h3>
                </div>
                <div className="p-4 sm:p-6 space-y-4">
                  {teamStats.length >= 2 && (teamStats[0]?.statistics || []).map((stat: any, idx: number) => {
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
                  })}
                  {teamStats.length < 2 && <p className="text-center text-muted-foreground py-8">No statistics available</p>}
                </div>
              </div>
            </TabsContent>

            {/* Lineups */}
            <TabsContent value="lineups" className="mt-0">
              <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-4 sm:px-5 py-2 sm:py-3 border-b border-border">
                  <h3 className="font-bold text-sm sm:text-base text-foreground">Lineups</h3>
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
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Subs</span>
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
                    <p className="text-center text-muted-foreground py-8">Lineups not available yet</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Commentary (events-based) */}
            <TabsContent value="commentary" className="mt-0">
              <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-4 sm:px-5 py-2 sm:py-3 border-b border-border flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-sm sm:text-base text-foreground">Live Commentary</h3>
                  {isLive && (
                    <span className="ml-auto flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-live live-pulse" />
                      <span className="text-xs font-bold text-live">LIVE</span>
                    </span>
                  )}
                </div>
                <div className="p-4 sm:p-6">
                  {events.length > 0 ? (
                    <div className="space-y-3">
                      {[...events].reverse().map((event: any, i: number) => {
                        const teamName = event.team?.name || "";
                        let text = `${event.player?.name || ""} (${teamName})`;
                        if (event.type === "Goal") text = `⚽ GOAL! ${event.player?.name} scores for ${teamName}!${event.assist?.name ? ` Assist: ${event.assist.name}` : ""}`;
                        else if (event.type === "Card" && event.detail === "Yellow Card") text = `🟨 Yellow card: ${event.player?.name} (${teamName})`;
                        else if (event.type === "Card" && event.detail === "Red Card") text = `🟥 Red card: ${event.player?.name} (${teamName})`;
                        else if (event.type === "subst") text = `🔄 Sub: ${event.assist?.name} replaces ${event.player?.name} (${teamName})`;
                        return (
                          <div key={i} className="flex gap-3 p-3 rounded-xl bg-muted/30">
                            <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                              {event.time?.elapsed}'
                            </span>
                            <p className="text-xs sm:text-sm text-foreground leading-relaxed pt-2">{text}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No commentary available yet.</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          /* Scheduled match */
          <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-4 sm:px-5 py-2 sm:py-3 border-b border-border">
              <h3 className="font-bold text-sm sm:text-base text-foreground">Match Information</h3>
            </div>
            <div className="p-4 sm:p-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-muted/30">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Stadium</p>
                  <p className="font-medium text-sm text-foreground">{venue?.name || "TBD"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-muted/30">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Kickoff</p>
                  <p className="font-medium text-sm text-foreground">{time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-muted/30">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Referee</p>
                  <p className="font-medium text-sm text-foreground">{referee || "TBD"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Match;
