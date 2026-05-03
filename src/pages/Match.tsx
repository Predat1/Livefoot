import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import {
  useFixtureDetail, useFixtureEvents, useFixtureLineups, useFixtureStatistics,
  useHeadToHead, useFixturePlayers, useFixtureOdds, useFixtureInjuries,
  useTeamForm, useTeamNextFixtures, useFixturePredictions,
} from "@/hooks/useApiFootball";
import {
  ArrowLeft, Clock, MapPin, Target, User, AlertTriangle, Repeat2,
  Loader2, BarChart3, Swords, Star, DollarSign, HeartPulse, Users as UsersIcon,
  TrendingUp, Shield, MessageSquare, Calendar, Crosshair, Radar, Flame, Brain, Trophy, Zap
} from "lucide-react";
import LiveFootAIPrediction from "@/components/LiveFootAIPrediction";
import { cn } from "@/lib/utils";
import { buildEntitySlug } from "@/utils/slugify";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShareButton from "@/components/ShareButton";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchDetailSkeleton } from "@/components/BrandedLoader";
import TacticalPitch from "@/components/TacticalPitch";
import CommunityPredictions from "@/components/CommunityPredictions";
import ShotMap from "@/components/ShotMap";
import HeatMap from "@/components/HeatMap";
import PlayerRatingStars from "@/components/PlayerRatingStars";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar,
  ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  AreaChart, Area, ReferenceLine
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

function EmptyMatchData({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
      <AlertTriangle className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm font-medium text-muted-foreground">
        {label} non disponibles
      </p>
      <p className="text-xs text-muted-foreground/60 max-w-[250px]">
        Ces données ne sont pas couvertes pour ce championnat ou ne sont pas encore publiées.
      </p>
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
  const { data: apiPredictions } = useFixturePredictions(matchId || "");

  const fix = fixtureData as any;
  const homeTeamId = fix?.teams?.home?.id ? String(fix.teams.home.id) : "";
  const awayTeamId = fix?.teams?.away?.id ? String(fix.teams.away.id) : "";

  const { data: h2hData } = useHeadToHead(homeTeamId, awayTeamId);
  const { data: standingsData } = useTeamForm(homeTeamId); // Placeholder or real standings hook
  
  const { data: aiExpertPrediction, isLoading: loadingAiExpert } = useAiExpert({
    fixtureId: matchId || "",
    homeTeam: fix?.teams?.home?.name || "Home",
    awayTeam: fix?.teams?.away?.name || "Away",
    leagueName: fix?.league?.name || "League",
  });


  if (isLoading) {
    return (
      <Layout>
        <MatchDetailSkeleton />
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

  // Generate synthetic momentum timeline for AreaChart
  const momentumTimeline = useMemo(() => {
    const timeline = [];
    const maxMin = isLive ? (minute || 45) : (isFinished ? 90 : 0);
    let currentValue = 0;
    
    for (let i = 0; i <= maxMin; i += 2) {
      // Find events in this window
      const eventsInWindow = events.filter(e => e.time.elapsed >= i && e.time.elapsed < i + 2);
      
      eventsInWindow.forEach(e => {
        const isHome = e.team.id === fix.teams.home.id;
        const multiplier = isHome ? 1 : -1;
        
        if (e.type === "Goal") currentValue += 40 * multiplier;
        if (e.type === "Card" && e.detail === "Red Card") currentValue -= 50 * multiplier;
        if (e.type === "Card" && e.detail === "Yellow Card") currentValue -= 5 * multiplier;
        if (e.type === "subst") currentValue += 2 * multiplier;
      });

      // Natural decay towards center
      currentValue *= 0.85;
      
      // Clamp
      currentValue = Math.max(-90, Math.min(90, currentValue));
      
      timeline.push({ minute: i, value: currentValue });
    }
    return timeline;
  }, [events, isLive, isFinished, minute, fix.teams.home.id]);

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
      { value: "predictions", label: "Pronos IA" },
      { value: "momentum", label: "Momentum" },
      ...(hasStats ? [{ value: "live", label: "Live" }] : []),
      { value: "events", label: "Events" },
      { value: "stats", label: "Stats" },
      ...(players.length >= 2 ? [{ value: "heatmap", label: "Heatmap" }] : []),
      { value: "lineups", label: "Compos" },
      ...(hasStats ? [{ value: "ratings", label: "Notes" }] : []),
      { value: "form", label: "Forme" },
      { value: "calendar", label: "Calendrier" },
      { value: "community", label: "Pronos" },
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
        <div className="sticky top-[52px] sm:top-[56px] z-40 bg-background/80 backdrop-blur-md pt-2 pb-2 -mx-2 px-2 sm:-mx-4 sm:px-4 mb-4 border-b border-border/50">
          <div className="overflow-x-auto scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-full bg-card/80 border border-border/50 rounded-xl p-1 relative">
              {tabItems.map((tab) => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value} 
                  className="relative rounded-lg text-[10px] sm:text-xs whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 data-[state=active]:bg-transparent data-[state=active]:text-primary-foreground z-10 transition-colors"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
              {/* Note: In a real implementation with Radix UI, we'd need a custom active indicator or let Radix handle it. 
                  For now, we enhance the CSS to make the active tab stand out more. */}
            </TabsList>
          </div>
        </div>

        {/* Live Commentary */}
        {hasStats && (
          <TabsContent value="live" className="mt-0 focus-visible:outline-none">
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

        {/* Events - Timeline View */}
        <TabsContent value="events" className="mt-0 focus-visible:outline-none">
          <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-4 py-2.5 border-b border-border">
              <h3 className="font-bold text-sm text-foreground">Chronologie du Match</h3>
            </div>
            <div className="p-4 sm:p-8 relative">
              {events.length > 0 ? (
                <div className="relative before:absolute before:inset-0 before:ml-1/2 before:-translate-x-1/2 md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border/10 before:via-border before:to-border/10 space-y-6">
                  {events.map((event: any, index: number) => {
                    const isHome = event.team.id === fix.teams.home.id;
                    return (
                      <motion.div 
                        key={index} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={cn(
                          "relative flex items-center justify-between md:justify-normal",
                          isHome ? "md:flex-row-reverse" : "flex-row"
                        )}
                      >
                        {/* Empty Space for the other side */}
                        <div className="hidden md:block w-5/12" />

                        {/* Event Icon/Marker */}
                        <div className="absolute left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-card border-2 border-border z-10 shadow-sm">
                          {getEventIcon(event.type, event.detail)}
                        </div>

                        {/* Event Content */}
                        <div className={cn(
                          "w-5/12 flex flex-col",
                          isHome ? "md:items-end text-left md:text-right" : "items-start text-left"
                        )}>
                          <div className={cn("flex items-center gap-2 mb-1", isHome ? "md:flex-row-reverse" : "flex-row")}>
                            <span className="font-black text-primary text-sm">{event.time.elapsed}'{event.time.extra ? `+${event.time.extra}` : ""}</span>
                            <span className="text-xs font-bold text-muted-foreground uppercase">{event.type}</span>
                          </div>
                          <div className={cn(
                            "p-3 rounded-xl border border-border/30 bg-muted/20 w-full max-w-sm",
                            isHome ? "rounded-tr-none md:rounded-tl-none md:rounded-tr-xl" : "rounded-tl-none"
                          )}>
                            <p className="font-bold text-sm text-foreground">{event.player?.name}</p>
                            {event.assist?.name && <p className="text-[10px] text-muted-foreground mt-0.5">Assist: {event.assist.name}</p>}
                            {event.detail && <p className="text-[10px] text-muted-foreground mt-0.5">{event.detail}</p>}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <EmptyMatchData label="Événements" />
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
                <EmptyMatchData label="Statistiques" />
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
        
        {/* Momentum - Match Pressure Graph */}
        <TabsContent value="momentum" className="mt-0">
          <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Graphique de Pression (Momentum)</h3>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold">
                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-primary" /> {homeTeam.name}</div>
                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-destructive" /> {awayTeam.name}</div>
              </div>
            </div>
            <div className="p-2 sm:p-6 bg-[#0c0d12]">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={momentumTimeline}>
                    <defs>
                      <linearGradient id="colorHome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAway" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="minute" 
                      tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      label={{ value: "Minutes", position: "insideBottom", offset: -5, fill: "rgba(255,255,255,0.2)", fontSize: 10 }}
                    />
                    <YAxis hide domain={[-100, 100]} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const val = payload[0].value as number;
                          const min = payload[0].payload.minute;
                          return (
                            <div className="rounded-lg bg-card/95 border border-border p-2 shadow-xl backdrop-blur-md">
                              <p className="text-[10px] font-bold text-muted-foreground mb-1">{min}'</p>
                              <p className={cn("text-xs font-black", val > 0 ? "text-primary" : "text-destructive")}>
                                {val > 0 ? `${homeTeam.name} domine` : `${awayTeam.name} domine`}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="url(#colorHome)" 
                      fill="url(#colorHome)" 
                      strokeWidth={2}
                      baseLine={0}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Domination Globale</p>
                  <p className="text-sm font-black text-white">{momentumData.length > 0 ? Math.round(momentumData.reduce((s, d) => s + (d.home || 0), 0) / momentumData.length) : 0}% - {momentumData.length > 0 ? Math.round(momentumData.reduce((s, d) => s + (d.away || 0), 0) / momentumData.length) : 0}%</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Intensité</p>
                  <p className="text-sm font-black text-white">Élevée 🔥</p>
                </div>
              </div>
            </div>
          </div>
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
                <EmptyMatchData label="Compositions" />
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
                                    <Link to={`/players/${buildEntitySlug(p.player?.id, p.player?.name || "")}`} className="text-xs font-medium text-foreground hover:text-primary transition-colors truncate block">
                                      {p.player?.name}
                                    </Link>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                                      {goals > 0 && <span>⚽ {goals}</span>}
                                      {assists > 0 && <span>🅰️ {assists}</span>}
                                      {shots > 0 && <span>🎯 {shots} tirs</span>}
                                      {passes > 0 && <span>📤 {passes} passes{passAcc ? ` (${passAcc}%)` : ""}</span>}
                                      {duelsTotal > 0 && <span>💪 {duelsWon}/{duelsTotal}</span>}
                                    </div>
                                    {isFinished && matchId && (
                                      <PlayerRatingStars
                                        fixtureId={matchId}
                                        playerId={String(p.player?.id || "")}
                                        playerName={p.player?.name || ""}
                                        teamId={String(teamData.team?.id || "")}
                                      />
                                    )}
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
                  <EmptyMatchData label="Notes des joueurs" />
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
          <LiveFootAIPrediction
            homeTeamId={homeTeamId}
            awayTeamId={awayTeamId}
            homeTeamName={homeTeam.name}
            awayTeamName={awayTeam.name}
            homeLogo={homeTeam.logo}
            awayLogo={awayTeam.logo}
            standings={standingsData || []}
            apiPredictions={apiPredictions}
            aiExpertPrediction={aiExpertPrediction}
            injuries={{
              home: injuries.filter((i: any) => String(i.team?.id) === homeTeamId).length,
              away: injuries.filter((i: any) => String(i.team?.id) === awayTeamId).length
            }}
          />
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
      <div className="px-2 sm:container py-4 sm:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
          <ShareButton title={`${homeTeam.name} vs ${awayTeam.name} | LiveFoot`} text={`${homeTeam.name} vs ${awayTeam.name}`} />
        </div>

        {/* Match Header (Hero Section) */}
        <div className="relative rounded-xl sm:rounded-3xl bg-card border border-border/50 overflow-hidden mb-6 sm:mb-8 shadow-2xl">
          {/* Dynamic Background Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative bg-league-header/80 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              {league.flag && <img src={league.flag} alt="" className="h-4 w-5 sm:h-5 sm:w-6 object-cover rounded-sm shadow-sm" />}
              {league.logo && <img src={league.logo} alt="" className="h-5 w-5 sm:h-6 sm:w-6 object-contain drop-shadow-md" />}
              <span className="font-black text-xs sm:text-sm text-foreground uppercase tracking-wider">{league.name}</span>
            </div>
            {isLive && (
              <div className="flex items-center gap-2 bg-live/10 px-3 py-1 rounded-full border border-live/20">
                <span className="h-2 w-2 rounded-full bg-live live-pulse" />
                <span className="text-xs font-black text-live">LIVE {minute}'</span>
              </div>
            )}
            {isFinished && <span className="text-xs font-black text-muted-foreground uppercase tracking-widest bg-muted/50 px-3 py-1 rounded-full">Terminé</span>}
            {!isLive && !isFinished && <span className="text-xs font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">À venir</span>}
          </div>

          <div className="relative p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4">
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 text-center w-full sm:w-auto order-2 sm:order-1"
              >
                <Link to={`/teams/${buildEntitySlug(fix.teams.home.id, homeTeam.name)}`} className="group flex flex-col items-center hover:opacity-80 transition-opacity">
                  <div className="relative mb-3 sm:mb-4">
                    <div className="absolute inset-0 bg-white/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {homeTeam.logo && <img src={homeTeam.logo} alt={homeTeam.name} className="relative h-20 w-20 sm:h-28 sm:w-28 object-contain drop-shadow-2xl" />}
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-foreground truncate max-w-[200px]">{homeTeam.name}</h2>
                </Link>
                {homeTeamId && (
                  <div className="mt-3 flex justify-center">
                    <TeamFormInline teamId={homeTeamId} teamName={homeTeam.name} />
                  </div>
                )}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center flex-shrink-0 order-1 sm:order-2 w-full sm:w-auto"
              >
                {hasStats ? (
                  <div className="flex items-center justify-center gap-3 sm:gap-6 px-6 sm:px-10 py-4 sm:py-6 bg-background/50 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/5 shadow-inner">
                    <span className={cn("text-5xl sm:text-7xl font-black drop-shadow-lg", isLive ? "text-live" : "text-foreground")}>{homeTeam.score}</span>
                    <span className="text-2xl sm:text-4xl font-bold text-muted-foreground/50 mb-2">-</span>
                    <span className={cn("text-5xl sm:text-7xl font-black drop-shadow-lg", isLive ? "text-live" : "text-foreground")}>{awayTeam.score}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl bg-primary/10 border border-primary/20 px-8 py-6 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.2)]">
                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 animate-pulse" />
                    <span className="text-3xl sm:text-5xl font-black text-primary drop-shadow-md">{time}</span>
                  </div>
                )}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 text-center w-full sm:w-auto order-3"
              >
                <Link to={`/teams/${buildEntitySlug(fix.teams.away.id, awayTeam.name)}`} className="group flex flex-col items-center hover:opacity-80 transition-opacity">
                  <div className="relative mb-3 sm:mb-4">
                    <div className="absolute inset-0 bg-white/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {awayTeam.logo && <img src={awayTeam.logo} alt={awayTeam.name} className="relative h-20 w-20 sm:h-28 sm:w-28 object-contain drop-shadow-2xl" />}
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-foreground truncate max-w-[200px]">{awayTeam.name}</h2>
                </Link>
                {awayTeamId && (
                  <div className="mt-3 flex justify-center">
                    <TeamFormInline teamId={awayTeamId} teamName={awayTeam.name} />
                  </div>
                )}
              </motion.div>
            </div>

            <div className="mt-6 sm:mt-10 flex items-center justify-center gap-4 sm:gap-8 text-[11px] sm:text-sm font-medium text-muted-foreground flex-wrap">
              {venue?.name && <div className="flex items-center gap-1.5 bg-muted/30 px-3 py-1.5 rounded-full"><MapPin className="h-3.5 w-3.5 text-primary" /><span>{venue.name}</span></div>}
              {referee && <div className="flex items-center gap-1.5 bg-muted/30 px-3 py-1.5 rounded-full"><User className="h-3.5 w-3.5 text-primary" /><span>{referee}</span></div>}
            </div>
          </div>
        </div>

        {/* All tabs */}
        {renderTabs()}

        {/* VIP Premium CTA */}
        <div className="mt-8 mb-12 p-8 rounded-[2rem] bg-gradient-to-br from-amber-500/10 via-card to-amber-500/5 border border-amber-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Trophy className="h-24 w-24 text-amber-500" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest mb-4">
              <Star className="h-3 w-3" /> Club VIP Premium
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">Passez au niveau supérieur</h3>
            <p className="text-sm text-muted-foreground max-w-xl mb-6">
              Alors que nos prédictions de base sont <strong>100% gratuites</strong>, le Club VIP vous donne accès aux "Value Bets" détectés par nos algorithmes avancés et aux alertes exclusives en temps réel.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link to="/auth" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-black text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-105 text-center">
                REJOINDRE LE CLUB VIP
              </Link>
              <span className="text-xs font-bold text-muted-foreground">Analyses avancées & Communauté VIP</span>
            </div>
          </div>
        </div>
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
            <Link key={i} to={`/match/${fix.id}`} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex-shrink-0 text-center w-12">
                <p className="text-[10px] text-muted-foreground">{fix.date}</p>
                <p className="text-[9px] text-muted-foreground">{fix.time}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {fix.homeTeam?.logo && <img src={fix.homeTeam.logo} alt="" className="h-4 w-4 object-contain flex-shrink-0" />}
                  <span className="text-xs text-foreground truncate">{fix.homeTeam?.name}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {fix.awayTeam?.logo && <img src={fix.awayTeam.logo} alt="" className="h-4 w-4 object-contain flex-shrink-0" />}
                  <span className="text-xs text-foreground truncate">{fix.awayTeam?.name}</span>
                </div>
              </div>
              <span className="text-[9px] text-muted-foreground truncate max-w-16">{fix.league}</span>
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
