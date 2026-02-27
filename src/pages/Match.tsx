import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import {
  useFixtureDetail, useFixtureEvents, useFixtureLineups, useFixtureStatistics,
  usePredictions, useHeadToHead, useFixturePlayers, useFixtureOdds, useFixtureInjuries,
  useTeamForm, useTeamNextFixtures,
} from "@/hooks/useApiFootball";
import {
  ArrowLeft, Clock, MapPin, Target, User, AlertTriangle, Repeat2,
  Loader2, BarChart3, Swords, Star, DollarSign, HeartPulse, Users as UsersIcon,
  TrendingUp, Shield, MessageSquare, Calendar, Crosshair, Radar, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShareButton from "@/components/ShareButton";
import { Skeleton } from "@/components/ui/skeleton";
import TacticalPitch from "@/components/TacticalPitch";
import CommunityPredictions from "@/components/CommunityPredictions";
import ShotMap from "@/components/ShotMap";
import HeatMap from "@/components/HeatMap";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar,
  ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";

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

// ─── Form Widget (inline) ─────────────────────────────────────
function TeamFormInline({ teamId, teamName }: { teamId: string; teamName: string }) {
  const { data: formData } = useTeamForm(teamId);
  if (!formData || formData.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground mr-1">{teamName.slice(0, 12)}</span>
      {formData.slice(0, 5).map((m, i) => (
        <span
          key={i}
          className={cn(
            "h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black",
            m.result === "W" && "bg-emerald-500/20 text-emerald-500",
            m.result === "D" && "bg-amber-500/20 text-amber-500",
            m.result === "L" && "bg-destructive/20 text-destructive"
          )}
        >
          {m.result}
        </span>
      ))}
    </div>
  );
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

  // ─── Tabs ────────────────────────────────────────────────────
  const renderTabs = () => {
    const tabItems = [
      ...(hasStats ? [{ value: "live", label: "Live" }] : []),
      { value: "events", label: "Events" },
      { value: "stats", label: "Stats" },
      ...(players.length >= 2 ? [{ value: "heatmap", label: "Heatmap" }] : []),
      { value: "lineups", label: "Compos" },
      ...(hasStats ? [{ value: "ratings", label: "Notes" }] : []),
      { value: "form", label: "Forme" },
      { value: "calendar", label: "Calendrier" },
      { value: "predictions", label: "Prédiction" },
      { value: "h2h", label: "H2H" },
      { value: "community", label: "Pronostics" },
      ...(odds.length > 0 ? [{ value: "odds", label: "Cotes" }] : []),
      { value: "injuries", label: "Blessures" },
    ];

    // Generate live commentary from events
    const generateCommentary = (event: any) => {
      const min = event.time?.elapsed || "?";
      const extra = event.time?.extra ? `+${event.time.extra}` : "";
      const timeStr = `${min}${extra}'`;
      const player = event.player?.name || "Joueur inconnu";
      const team = event.team?.name || "";
      const assist = event.assist?.name;
      const detail = event.detail || "";

      switch (event.type) {
        case "Goal":
          if (detail === "Own Goal") return `${timeStr} — ⚽ But contre son camp ! ${player} (${team}) marque dans ses propres filets.`;
          if (detail === "Penalty") return `${timeStr} — ⚽ PENALTY TRANSFORMÉ ! ${player} (${team}) ne tremble pas !${assist ? ` Faute obtenue par ${assist}.` : ""}`;
          if (detail === "Missed Penalty") return `${timeStr} — ❌ Penalty manqué par ${player} (${team}) !`;
          return `${timeStr} — ⚽ BUT ! ${player} marque pour ${team} !${assist ? ` Passe décisive de ${assist}.` : ""}`;
        case "Card":
          if (detail === "Red Card") return `${timeStr} — 🟥 Carton rouge ! ${player} (${team}) est expulsé !`;
          if (detail === "Second Yellow card") return `${timeStr} — 🟨🟥 Deuxième jaune ! ${player} (${team}) prend le chemin des vestiaires.`;
          return `${timeStr} — 🟨 Carton jaune pour ${player} (${team}).`;
        case "subst":
          return `${timeStr} — 🔄 Remplacement (${team}) : ${assist || "?"} sort, ${player} entre en jeu.`;
        case "Var":
          return `${timeStr} — 📺 Décision VAR : ${detail}. ${player ? `Joueur concerné : ${player}.` : ""}`;
        default:
          return `${timeStr} — ${event.type}: ${player} (${team}). ${detail}`;
      }
    };

    const getCommentaryIcon = (type: string, detail?: string) => {
      switch (type) {
        case "Goal": return detail === "Missed Penalty" ? "❌" : "⚽";
        case "Card": return detail === "Red Card" || detail === "Second Yellow card" ? "🟥" : "🟨";
        case "subst": return "🔄";
        case "Var": return "📺";
        default: return "📋";
      }
    };

    // Momentum radar data
    const momentumData = (() => {
      if (teamStats.length < 2) return [];
      const metrics = ["Ball Possession", "Total Shots", "Shots on Goal", "Corner Kicks", "Passes %", "Fouls"];
      const metricLabels: Record<string, string> = {
        "Ball Possession": "Possession",
        "Total Shots": "Tirs",
        "Shots on Goal": "Tirs cadrés",
        "Corner Kicks": "Corners",
        "Passes %": "Passes",
        "Fouls": "Fautes",
      };
      return metrics.map((m) => {
        const homeStat = (teamStats[0]?.statistics || []).find((s: any) => s.type === m);
        const awayStat = (teamStats[1]?.statistics || []).find((s: any) => s.type === m);
        const hv = parseInt(String(homeStat?.value).replace("%", "")) || 0;
        const av = parseInt(String(awayStat?.value).replace("%", "")) || 0;
        return { metric: metricLabels[m] || m, home: hv, away: av };
      });
    })();

    return (
      <Tabs defaultValue={isLive ? "live" : hasStats ? "events" : "predictions"} className="w-full">
        <div className="overflow-x-auto -mx-4 px-4 mb-4">
          <TabsList className="inline-flex w-auto min-w-full bg-card border border-border/50 rounded-xl p-1">
            {tabItems.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="rounded-lg text-[10px] sm:text-xs whitespace-nowrap px-2 sm:px-3">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Live Commentary */}
        {hasStats && (
          <TabsContent value="live" className="mt-0">
            <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Commentaires Live</h3>
                {isLive && <span className="ml-auto h-2 w-2 rounded-full bg-live live-pulse" />}
              </div>
              <div className="p-3 sm:p-4 max-h-[70vh] overflow-y-auto">
                {events.length > 0 ? (
                  <AnimatePresence>
                    <div className="space-y-0">
                      {[...events].reverse().map((event: any, index: number) => (
                        <motion.div
                          key={`${event.time?.elapsed}-${event.type}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
                          className="flex gap-3 py-3 border-b border-border/30 last:border-b-0"
                        >
                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <span className="text-xs font-black text-primary w-10 text-center">
                              {event.time?.elapsed}'{event.time?.extra ? `+${event.time.extra}` : ""}
                            </span>
                            <span className="text-base">{getCommentaryIcon(event.type, event.detail)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-foreground leading-relaxed">{generateCommentary(event)}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              {event.team?.logo && <img src={event.team.logo} alt="" className="h-3.5 w-3.5 object-contain" />}
                              <span className="text-[10px] text-muted-foreground">{event.team?.name}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-sm">Aucun événement pour le moment</p>
                )}
              </div>
            </div>
          </TabsContent>
        )}

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

        {/* Stats + Momentum + ShotMap */}
        <TabsContent value="stats" className="mt-0 space-y-4">
          {/* Bar stats */}
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

          {/* Momentum Radar */}
          {momentumData.length > 0 && (
            <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
                <Radar className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Radar de Domination</h3>
              </div>
              <div className="p-4 sm:p-6">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={momentumData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    <RechartsRadar name={homeTeam.name} dataKey="home" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    <RechartsRadar name={awayTeam.name} dataKey="away" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.2} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Momentum Bar Chart - Pression */}
          {momentumData.length > 0 && (
            <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Graphique de Pression</h3>
              </div>
              <div className="p-2 sm:p-6">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={momentumData} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <YAxis dataKey="metric" type="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} width={70} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Bar dataKey="home" name={homeTeam.name} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={12} />
                    <Bar dataKey="away" name={awayTeam.name} fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} barSize={12} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ShotMap */}
          {players.length >= 2 && (
            <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Carte des Tirs</h3>
              </div>
              <div className="p-2 sm:p-6">
                <ShotMap
                  playersData={players}
                  homeTeamId={homeTeamId}
                  awayTeamId={awayTeamId}
                  homeTeamName={homeTeam.name}
                  awayTeamName={awayTeam.name}
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* Heatmap */}
        {players.length >= 2 && (
          <TabsContent value="heatmap" className="mt-0">
            <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Carte de Chaleur</h3>
              </div>
              <div className="p-2 sm:p-6">
                <HeatMap
                  playersData={players}
                  homeTeamId={homeTeamId}
                  awayTeamId={awayTeamId}
                  homeTeamName={homeTeam.name}
                  awayTeamName={awayTeam.name}
                />
              </div>
            </div>
          </TabsContent>
        )}


        {/* Lineups + Tactical Pitch */}
        <TabsContent value="lineups" className="mt-0 space-y-4">
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
                              const shots = p.statistics?.[0]?.shots?.total || 0;
                              const passes = p.statistics?.[0]?.passes?.total || 0;
                              const passAcc = p.statistics?.[0]?.passes?.accuracy;
                              const duelsWon = p.statistics?.[0]?.duels?.won || 0;
                              const duelsTotal = p.statistics?.[0]?.duels?.total || 0;
                              return (
                                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                                  {p.player?.photo && (
                                    <img src={p.player.photo} alt="" className="h-7 w-7 rounded-full object-cover" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <Link to={`/players/${p.player?.id}`} className="text-xs font-medium text-foreground hover:text-primary transition-colors truncate block">
                                      {p.player?.name}
                                    </Link>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                                      {goals > 0 && <span>⚽ {goals}</span>}
                                      {assists > 0 && <span>🅰️ {assists}</span>}
                                      {shots > 0 && <span>🎯 {shots} tirs</span>}
                                      {passes > 0 && <span>📤 {passes} passes{passAcc ? ` (${passAcc}%)` : ""}</span>}
                                      {duelsTotal > 0 && <span>💪 {duelsWon}/{duelsTotal}</span>}
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

        {/* Team Form */}
        <TabsContent value="form" className="mt-0">
          <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Forme Récente</h3>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
              {[{ id: homeTeamId, name: homeTeam.name, logo: homeTeam.logo },
                { id: awayTeamId, name: awayTeam.name, logo: awayTeam.logo }].map((team) => (
                <TeamFormSection key={team.id} teamId={team.id} teamName={team.name} teamLogo={team.logo} />
              ))}
            </div>
          </div>
        </TabsContent>
        {/* Calendar - Next matches */}
        <TabsContent value="calendar" className="mt-0">
          <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Prochains Matchs</h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <NextMatchesColumn teamId={homeTeamId} teamName={homeTeam.name} teamLogo={homeTeam.logo} />
                <NextMatchesColumn teamId={awayTeamId} teamName={awayTeam.name} teamLogo={awayTeam.logo} />
              </div>
            </div>
          </div>
        </TabsContent>


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
                        <Link key={i} to={`/match/${m.fixture.id}`} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground w-12 sm:w-16 flex-shrink-0">
                            {new Date(m.fixture.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" })}
                          </span>
                          <div className="flex-1 flex items-center gap-1 sm:gap-2 justify-center min-w-0">
                            <img src={m.teams.home.logo} alt="" className="h-4 w-4 sm:h-5 sm:w-5 object-contain flex-shrink-0" />
                            <span className="text-[10px] sm:text-xs font-medium text-foreground truncate hidden sm:inline">{m.teams.home.name}</span>
                            <span className="font-black text-xs sm:text-sm text-foreground flex-shrink-0">{m.goals.home} - {m.goals.away}</span>
                            <span className="text-[10px] sm:text-xs font-medium text-foreground truncate hidden sm:inline">{m.teams.away.name}</span>
                            <img src={m.teams.away.logo} alt="" className="h-4 w-4 sm:h-5 sm:w-5 object-contain flex-shrink-0" />
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

        {/* Injuries - always visible */}
        <TabsContent value="injuries" className="mt-0">
          <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-destructive" />
              <h3 className="font-bold text-sm text-foreground">Blessures & Absences</h3>
            </div>
            <div className="p-3 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[{ teamId: homeTeamId, team: homeTeam }, { teamId: awayTeamId, team: awayTeam }].map(({ teamId: tId, team }) => (
                  <div key={tId}>
                    <h4 className="font-bold text-xs text-foreground mb-2 flex items-center gap-2">
                      {team.logo && <img src={team.logo} alt="" className="h-4 w-4 object-contain" />}
                      {team.name}
                    </h4>
                    <div className="space-y-1.5">
                      {injuries.filter((inj: any) => String(inj.team?.id) === tId).length > 0 ? (
                        injuries.filter((inj: any) => String(inj.team?.id) === tId).map((inj: any, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5"
                          >
                            {inj.player?.photo && <img src={inj.player.photo} alt="" className="h-6 w-6 rounded-full object-cover" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{inj.player?.name}</p>
                              <p className="text-[10px] text-destructive">{inj.player?.reason || "Injured"}</p>
                            </div>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0">{inj.player?.type}</span>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">Aucune blessure signalée</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
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

            {/* Recent form badges under score */}
            {homeTeamId && awayTeamId && (
              <div className="mt-3 flex items-center justify-between gap-4">
                <TeamFormInline teamId={homeTeamId} teamName={homeTeam.name} />
                <TeamFormInline teamId={awayTeamId} teamName={awayTeam.name} />
              </div>
            )}

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

// ─── Team Form Section (detailed) ─────────────────────────────
function TeamFormSection({ teamId, teamName, teamLogo }: { teamId: string; teamName: string; teamLogo?: string }) {
  const { data: formData } = useTeamForm(teamId);
  if (!formData || formData.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          {teamLogo && <img src={teamLogo} alt="" className="h-5 w-5 object-contain" />}
          <span className="text-sm font-bold text-foreground">{teamName}</span>
        </div>
        <p className="text-xs text-muted-foreground">Données non disponibles</p>
      </div>
    );
  }

  const wins = formData.filter(m => m.result === "W").length;
  const draws = formData.filter(m => m.result === "D").length;
  const losses = formData.filter(m => m.result === "L").length;
  const goalsFor = formData.reduce((s, m) => s + m.goalsFor, 0);
  const goalsAgainst = formData.reduce((s, m) => s + m.goalsAgainst, 0);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {teamLogo && <img src={teamLogo} alt="" className="h-5 w-5 object-contain" />}
        <span className="text-sm font-bold text-foreground">{teamName}</span>
        <div className="ml-auto flex items-center gap-1">
          {formData.map((m, i) => (
            <span
              key={i}
              className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black",
                m.result === "W" && "bg-emerald-500/20 text-emerald-500",
                m.result === "D" && "bg-amber-500/20 text-amber-500",
                m.result === "L" && "bg-destructive/20 text-destructive"
              )}
            >
              {m.result}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="rounded-lg bg-muted/30 p-2 text-center">
          <p className="text-lg font-black text-emerald-500">{wins}</p>
          <p className="text-[9px] text-muted-foreground">Victoires</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-2 text-center">
          <p className="text-lg font-black text-amber-500">{draws}</p>
          <p className="text-[9px] text-muted-foreground">Nuls</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-2 text-center">
          <p className="text-lg font-black text-destructive">{losses}</p>
          <p className="text-[9px] text-muted-foreground">Défaites</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-2 text-center">
          <p className="text-lg font-black text-foreground">{goalsFor}-{goalsAgainst}</p>
          <p className="text-[9px] text-muted-foreground">Buts</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {formData.map((m, i) => (
          <Link key={i} to={`/match/${m.id}`} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
            <span className={cn(
              "h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0",
              m.result === "W" && "bg-emerald-500/20 text-emerald-500",
              m.result === "D" && "bg-amber-500/20 text-amber-500",
              m.result === "L" && "bg-destructive/20 text-destructive"
            )}>
              {m.result}
            </span>
            <span className="text-[10px] text-muted-foreground w-12">{m.date}</span>
            <img src={m.opponentLogo} alt="" className="h-4 w-4 object-contain" />
            <span className="text-xs text-foreground flex-1 truncate">vs {m.opponent}</span>
            <span className="text-xs font-black text-foreground">{m.goalsFor}-{m.goalsAgainst}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Next Matches Column ──────────────────────────────────────
function NextMatchesColumn({ teamId, teamName, teamLogo }: { teamId: string; teamName: string; teamLogo?: string }) {
  const { data: nextFixtures, isLoading } = useTeamNextFixtures(teamId);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {teamLogo && <img src={teamLogo} alt="" className="h-5 w-5 object-contain" />}
        <span className="text-sm font-bold text-foreground">{teamName}</span>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : nextFixtures && nextFixtures.length > 0 ? (
        <div className="space-y-2">
          {(nextFixtures as any[]).slice(0, 3).map((fix: any, i: number) => (
            <Link key={i} to={`/match/${fix.fixture.id}`} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex-shrink-0 text-center">
                <p className="text-[10px] text-muted-foreground">
                  {new Date(fix.fixture.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </p>
                <p className="text-[9px] text-muted-foreground">
                  {new Date(fix.fixture.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <img src={fix.teams.home.logo} alt="" className="h-4 w-4 object-contain flex-shrink-0" />
                  <span className="text-xs text-foreground truncate">{fix.teams.home.name}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <img src={fix.teams.away.logo} alt="" className="h-4 w-4 object-contain flex-shrink-0" />
                  <span className="text-xs text-foreground truncate">{fix.teams.away.name}</span>
                </div>
              </div>
              {fix.league?.logo && <img src={fix.league.logo} alt="" className="h-4 w-4 object-contain flex-shrink-0" />}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground py-4 text-center">Aucun match à venir</p>
      )}
    </div>
  );
}

export default Match;
