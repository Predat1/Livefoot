import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHeadEnhanced";
import {
  useFixtureDetail, useFixtureEvents, useFixtureLineups, useFixtureStatistics,
  useHeadToHead, useFixturePlayers, useFixtureOdds, useFixtureInjuries,
  useTeamForm, useTeamNextFixtures, useFixturePredictions, useAiExpert,
  useLiveOdds, useStandings,
} from "@/hooks/useApiFootball";
import { useFootballNews } from "@/hooks/useFootballNews";
import { 
  Trophy, TrendingUp, Zap, ArrowLeft, Calendar, Eye, Flame, Loader2, WifiOff, Star, Users, Sparkles, Share2, 
  Target, AlertTriangle, Repeat2, MapPin, User, HeartPulse, Clock, MessageSquare, Swords, Radar, Crosshair, 
  DollarSign, BarChart3, Info
} from "lucide-react";
import LiveFootAIPrediction from "@/components/LiveFootAIPrediction";
import OddsAnomalyDetector from "@/components/OddsAnomalyDetector";
import ValueBetDetector from "@/components/ValueBetDetector";
import MatchAIChat from "@/components/MatchAIChat";
import LiveScenarioSimulator from "@/components/LiveScenarioSimulator";
import BettingProfileWidget from "@/components/BettingProfileWidget";
import PredictiveAlerts from "@/components/PredictiveAlerts";
import { cn } from "@/lib/utils";
import { extractIdFromSlug, buildEntitySlug } from "@/utils/slugify";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShareWidget from "@/components/ShareWidget";
import ShareButton from "@/components/ShareButton";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { trackConversionEvent } from "@/lib/conversionTracking";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchDetailSkeleton } from "@/components/BrandedLoader";
import TacticalPitch from "@/components/TacticalPitch";
import CommunityPredictions from "@/components/CommunityPredictions";
import TelegramBanner from "@/components/TelegramBanner";
import ShotMap from "@/components/ShotMap";
import HeatMap from "@/components/HeatMap";
import PlayerRatingStars from "@/components/PlayerRatingStars";
import { motion, AnimatePresence } from "framer-motion";
import SectionErrorBoundary from "@/components/SectionErrorBoundary";
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
  if (!formData || formData.length === 0) return (
    <p className="text-xs text-muted-foreground text-center py-4">Données de forme indisponibles</p>
  );
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
  const { matchId: rawMatchId } = useParams();
  const matchId = extractIdFromSlug(rawMatchId || "");
  const { user } = useAuth();

  // ─── Tous les hooks en premier, sans exception ────────────────
  const { data: fixtureData, isLoading, isError, error: fetchError } = useFixtureDetail(matchId);
  const { data: eventsData } = useFixtureEvents(matchId);
  const { data: lineupsData } = useFixtureLineups(matchId);
  const { data: statsData } = useFixtureStatistics(matchId);
  const { data: playersData } = useFixturePlayers(matchId);
  const fix = fixtureData as any;
  const statusRaw = fix?.fixture?.status?.short || "";
  const isMatchLive = ["1H", "2H", "HT", "ET", "P", "BT", "LIVE", "INT"].includes(statusRaw);

  const { data: oddsData } = useFixtureOdds(matchId);
  const { data: injuriesData } = useFixtureInjuries(matchId);
  const { data: apiPredictions } = useFixturePredictions(matchId);
  const { data: liveOddsData } = useLiveOdds(isMatchLive ? matchId : "");
  const homeTeamId = fix?.teams?.home?.id ? String(fix.teams.home.id) : "";
  const awayTeamId = fix?.teams?.away?.id ? String(fix.teams.away.id) : "";

  const { data: h2hData } = useHeadToHead(homeTeamId, awayTeamId);
  const { data: standingsData } = useTeamForm(homeTeamId);
  const leagueId = fix?.league?.id ? String(fix.league.id) : "";
  const season = fix?.league?.season ? String(fix.league.season) : "2024";
  const { data: leagueStandings } = useStandings(leagueId, season);
  const { data: allNews = [] } = useFootballNews();

  // ✅ useAiExpert ici (avant les early returns)
  const { data: aiExpertPredictionRaw } = useAiExpert({
    fixtureId: matchId,
    homeTeam: fix?.teams?.home?.name || "",
    awayTeam: fix?.teams?.away?.name || "",
    leagueName: fix?.league?.name || "",
  });
  const aiExpertPrediction = aiExpertPredictionRaw as any;

  // ✅ useMemo ICI — avant tout early return — avec guard interne
  const momentumTimeline = useMemo(() => {
    // Guard : si pas de données, retourner tableau vide
    if (!fixtureData || !fix?.teams?.home?.id) return [];

    const events = (eventsData || []) as any[];
    const statusRaw = fix?.fixture?.status?.short || "";
    const isLiveLocal = ["1H","2H","HT","ET","P","BT","LIVE","INT"].includes(statusRaw);
    const isFinishedLocal = ["FT","AET","PEN","AWD","WO"].includes(statusRaw);
    const minuteLocal = fix?.fixture?.status?.elapsed;

    const timeline = [];
    const maxMin = isLiveLocal ? (minuteLocal || 45) : (isFinishedLocal ? 90 : 0);
    let currentValue = 0;

    for (let i = 0; i <= maxMin; i += 2) {
      const eventsInWindow = events.filter((e: any) =>
        e?.time?.elapsed >= i && e?.time?.elapsed < i + 2
      );
      eventsInWindow.forEach((e: any) => {
        const isHome = e.team?.id === fix?.teams?.home?.id;
        const multiplier = isHome ? 1 : -1;
        if (e.type === "Goal") currentValue += 40 * multiplier;
        if (e.type === "Card" && e.detail === "Red Card") currentValue -= 50 * multiplier;
        if (e.type === "Card" && e.detail === "Yellow Card") currentValue -= 5 * multiplier;
        if (e.type === "subst") currentValue += 2 * multiplier;
      });
      currentValue *= 0.85;
      currentValue = Math.max(-90, Math.min(90, currentValue));
      timeline.push({ minute: i, value: currentValue });
    }
    return timeline;
  }, [fixtureData, eventsData, fix?.teams?.home?.id]);


  // ─── Early returns APRÈS tous les hooks ───────────────────────
  if (!matchId) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">ID de match invalide</h1>
          <p className="text-muted-foreground mb-6">L'identifiant du match est manquant ou incorrect.</p>
          <Link to="/" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
            <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
          </Link>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <MatchDetailSkeleton />
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <div className="max-w-md mx-auto p-8 rounded-3xl bg-destructive/5 border border-destructive/20">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Erreur de chargement</h1>
            <p className="text-sm text-muted-foreground mb-6">
              {fetchError instanceof Error ? fetchError.message : "Impossible de récupérer les détails du match."}
            </p>
            <Link to="/" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
              <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!fixtureData) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Match introuvable</h1>
          <Link to="/" className="text-primary hover:underline">Retour à l'accueil</Link>
        </div>
      </Layout>
    );
  }

  // ─── Dérivation des données (sécurisée avec optionnal chaining) ─
  const status = fix?.fixture?.status?.short ? mapFixtureStatus(fix.fixture.status.short) : "scheduled";
  const isLive = status === "live";
  const isFinished = status === "finished";
  const hasStats = isLive || isFinished;

  const homeTeam = { 
    name: fix?.teams?.home?.name || "Équipe domicile", 
    logo: fix?.teams?.home?.logo || "", 
    score: fix?.goals?.home ?? 0 
  };
  const awayTeam = { 
    name: fix?.teams?.away?.name || "Équipe extérieur", 
    logo: fix?.teams?.away?.logo || "", 
    score: fix?.goals?.away ?? 0 
  };
  const league = fix?.league || {};
  const venue = fix?.fixture?.venue || {};
  const referee = fix?.fixture?.referee || "Arbitre non communiqué";
  const minute = fix?.fixture?.status?.elapsed;
  const time = fix?.fixture?.date 
    ? new Date(fix.fixture.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) 
    : "--:--";

  const events = (eventsData || []) as any[];
  const teamStats = (statsData || []) as any[];
  const lineups = (lineupsData || []) as any[];
  const injuries = (injuriesData || []) as any[];
  const players = (playersData || []) as any[];
  const preMatchOdds = (oddsData || []) as any[];
  const liveOdds = (liveOddsData || []) as any[];
  const odds = isLive && liveOdds.length > 0 ? liveOdds : preMatchOdds;


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
    home: (lineups[0]?.startXI || []).map((item: any) => ({
      name: item.player?.name || "",
      number: item.player?.number || 0,
      pos: item.player?.pos || "MID",
    })),
    away: (lineups[1]?.startXI || []).map((item: any) => ({
      name: item.player?.name || "",
      number: item.player?.number || 0,
      pos: item.player?.pos || "MID",
    })),
  } : null;

  // ─── Tabs ────────────────────────────────────────────────────
  const renderTabs = () => {
    const tabItems = [
      { value: "events", label: "Résumé" },
      ...(hasStats ? [{ value: "live", label: isLive ? "🔴 Live" : "Live" }] : []),
      { value: "lineups", label: "Compos" },
      { value: "stats", label: "Stats" },
      { value: "h2h", label: "H2H" },
      { value: "form", label: "Forme" },
      { value: "predictions", label: "Pronos IA" },
      ...(hasStats ? [{ value: "ratings", label: "Notes" }] : []),
      { value: "momentum", label: "Momentum" },
      ...(players.length >= 2 ? [{ value: "heatmap", label: "Heatmap" }] : []),
      { value: "calendar", label: "Calendrier" },
      { value: "community", label: "Communauté" },
      ...(odds.length > 0 ? [{ value: "odds", label: isMatchLive && liveOdds.length > 0 ? "Cotes 🔴" : "Cotes" }] : []),
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
                  className="relative rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap px-3 sm:px-4 py-2 sm:py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md z-10 transition-all duration-200 hover:bg-muted/50"
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
        <TabsContent value="stats" className="mt-0 space-y-6 focus-visible:outline-none">
          {/* Bar stats */}
          <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-4 py-2.5 border-b border-border">
              <h3 className="font-bold text-sm text-foreground">Match Statistics</h3>
            </div>
            <div className="p-4 sm:p-6 space-y-5">
              {teamStats.length >= 2 ? (teamStats[0]?.statistics || []).map((stat: any, idx: number) => {
                const home = parseInt(String(stat.value).replace("%", "")) || 0;
                const awayStat = teamStats[1]?.statistics?.[idx];
                const away = parseInt(String(awayStat?.value).replace("%", "")) || 0;
                const total = home + away;
                const homePercent = total > 0 ? (home / total) * 100 : 50;
                const suffix = String(stat.value).includes("%") ? "%" : "";
                
                // Determine who is leading in this stat
                const homeLeading = home > away;
                const awayLeading = away > home;

                return (
                  <div key={stat.type} className="group p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between text-xs sm:text-sm mb-3">
                      <span className={cn("font-black text-lg transition-all", homeLeading ? "text-primary scale-110" : "text-muted-foreground")}>
                        {home}{suffix}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted/50 px-3 py-1 rounded-full">
                        {stat.type}
                      </span>
                      <span className={cn("font-black text-lg transition-all", awayLeading ? "text-destructive scale-110" : "text-muted-foreground")}>
                        {away}{suffix}
                      </span>
                    </div>
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-muted border border-border/20">
                      <div 
                        className={cn("transition-all duration-700 ease-out", homeLeading ? "bg-primary shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "bg-primary/40")} 
                        style={{ width: `${homePercent}%` }} 
                      />
                      <div 
                        className={cn("transition-all duration-700 ease-out", awayLeading ? "bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "bg-destructive/40")} 
                        style={{ width: `${100 - homePercent}%` }} 
                      />
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
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                            <span className="w-6 text-center text-xs font-black text-primary bg-primary/10 rounded">{item.player?.number || "-"}</span>
                            <span className="text-xs font-medium text-foreground flex-1 truncate">{item.player?.name}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">{item.player?.pos}</span>
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
                      {teamLineup.coach?.name && (
                        <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                          {teamLineup.coach?.photo && <img src={teamLineup.coach.photo} alt="" className="h-6 w-6 rounded-full object-cover" />}
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Coach</span>
                          <span className="text-xs font-bold text-foreground">{teamLineup.coach.name}</span>
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


        <TabsContent value="predictions" className="mt-0 space-y-6">
          <SectionErrorBoundary sectionName="Odds Anomaly Detector">
            <OddsAnomalyDetector
              oddsData={oddsData || []}
              liveOddsData={liveOddsData || []}
              apiPredictions={apiPredictions}
              homeTeamName={homeTeam.name}
              awayTeamName={awayTeam.name}
              leagueName={league?.name}
            />
          </SectionErrorBoundary>

          <SectionErrorBoundary sectionName="AI Predictions">
            <LiveFootAIPrediction
              homeTeamId={homeTeamId}
              awayTeamId={awayTeamId}
              homeTeamName={homeTeam.name}
              awayTeamName={awayTeam.name}
              homeLogo={homeTeam.logo}
              awayLogo={awayTeam.logo}
              standings={standingsData || []}
              apiPredictions={apiPredictions}
              aiExpertPrediction={aiExpertPrediction as any}
              injuries={{
                home: injuries.filter((i: any) => String(i.team?.id) === homeTeamId).length,
                away: injuries.filter((i: any) => String(i.team?.id) === awayTeamId).length
              }}
            />
          </SectionErrorBoundary>

          {/* Value Bet Detector */}
          <SectionErrorBoundary sectionName="Value Bet">
            <ValueBetDetector
              odds={oddsData || []}
              prediction={aiExpertPrediction as any}
              homeTeamName={homeTeam.name}
              awayTeamName={awayTeam.name}
            />
          </SectionErrorBoundary>

          {/* IA Conversationnelle */}
          <SectionErrorBoundary sectionName="AI Chat">
            <MatchAIChat
              fixtureId={matchId}
              homeTeamName={homeTeam.name}
              awayTeamName={awayTeam.name}
              leagueName={league?.name}
              prediction={aiExpertPrediction as any}
            />
          </SectionErrorBoundary>

          {/* Simulateur de scénarios live */}
          <SectionErrorBoundary sectionName="Scenario Simulator">
            <LiveScenarioSimulator
              homeTeamName={homeTeam.name}
              awayTeamName={awayTeam.name}
              currentMinute={fix?.fixture?.status?.elapsed || 45}
              currentHomeScore={fix?.goals?.home ?? 0}
              currentAwayScore={fix?.goals?.away ?? 0}
              baseProbabilities={
                (aiExpertPrediction as any)?.probabilities ||
                { home: 45, draw: 28, away: 27 }
              }
              xgHome={(aiExpertPrediction as any)?.xgHome || 1.3}
              xgAway={(aiExpertPrediction as any)?.xgAway || 1.0}
            />
          </SectionErrorBoundary>

          {/* Profil parieur */}
          <SectionErrorBoundary sectionName="Betting Profile">
            <BettingProfileWidget />
          </SectionErrorBoundary>

          {/* Alertes prédictives */}
          <SectionErrorBoundary sectionName="Predictive Alerts">
            <PredictiveAlerts
              fixtureId={matchId}
              homeTeamName={homeTeam.name}
              awayTeamName={awayTeam.name}
            />
          </SectionErrorBoundary>

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
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between px-2">
                        <div className="text-center">
                          <p className="text-2xl sm:text-4xl font-black text-primary leading-none">{homeWins}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">{homeTeam.name}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl sm:text-4xl font-black text-muted-foreground leading-none">{draws}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Nuls</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl sm:text-4xl font-black text-primary leading-none">{awayWins}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">{awayTeam.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex h-3 w-full rounded-full overflow-hidden bg-muted/50 border border-white/5">
                        <div className="bg-primary h-full transition-all" style={{ width: `${(homeWins / matches.length) * 100}%` }} title={`${homeTeam.name} Wins`} />
                        <div className="bg-muted-foreground/30 h-full transition-all" style={{ width: `${(draws / matches.length) * 100}%` }} title="Draws" />
                        <div className="bg-primary/60 h-full transition-all" style={{ width: `${(awayWins / matches.length) * 100}%` }} title={`${awayTeam.name} Wins`} />
                      </div>
                      
                      <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                        <span>Domination {homeTeam.name}</span>
                        <span>{( (homeWins / matches.length) * 100 ).toFixed(0)}% de victoires</span>
                      </div>
                    </div>
                    
                    <div className="h-px bg-border/50 w-full" />
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
              <Users className="h-4 w-4 text-primary" />
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
              <div className="mt-4">
                <TelegramBanner variant="card" dismissible={true} />
              </div>
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
                {isMatchLive && liveOdds.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-live/10 px-2.5 py-0.5 rounded-full border border-live/20 ml-auto">
                    <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse" />
                    <span className="text-[10px] font-black text-live uppercase">Live</span>
                  </div>
                )}
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-6">
                  {odds.length > 0 ? (odds as any[]).slice(0, 5).map((bookmaker: any, bIdx: number) => {
                    const bets = bookmaker.bookmakers?.[0];
                    if (!bets) return null;
                    
                    // Helper to get bookmaker logo
                    const getBookmakerLogo = (name: string) => {
                      const n = name.toLowerCase();
                      if (n.includes("1xbet")) return "https://v3.api-sports.io/football/bookmakers/logos/1.png";
                      if (n.includes("bet365")) return "https://v3.api-sports.io/football/bookmakers/logos/8.png";
                      if (n.includes("betfair")) return "https://v3.api-sports.io/football/bookmakers/logos/3.png";
                      if (n.includes("bwin")) return "https://v3.api-sports.io/football/bookmakers/logos/13.png";
                      if (n.includes("william hill")) return "https://v3.api-sports.io/football/bookmakers/logos/10.png";
                      if (n.includes("unibet")) return "https://v3.api-sports.io/football/bookmakers/logos/11.png";
                      if (n.includes("marathonbet")) return "https://v3.api-sports.io/football/bookmakers/logos/2.png";
                      if (n.includes("pinnacle")) return "https://v3.api-sports.io/football/bookmakers/logos/4.png";
                      return null;
                    };

                    const logo = getBookmakerLogo(bets.name);

                    return (
                      <div key={bIdx} className="p-4 rounded-2xl bg-muted/20 border border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                          {logo ? (
                            <img src={logo} alt={bets.name} className="h-6 w-auto object-contain" />
                          ) : (
                            <div className="h-6 px-2 bg-primary/10 text-primary text-[10px] font-black rounded flex items-center">{bets.name}</div>
                          )}
                          <div className="h-px flex-1 bg-border/50" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {(bets.bets || []).slice(0, 4).map((bet: any, betIdx: number) => (
                            <div key={betIdx} className="space-y-2">
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{bet.name}</p>
                              <div className="flex gap-2">
                                {(bet.values || []).map((val: any, vIdx: number) => (
                                  <div key={vIdx} className="flex-1 rounded-xl bg-card border border-border/50 p-2 text-center group hover:border-primary/50 transition-colors cursor-pointer">
                                    <p className="text-[9px] text-muted-foreground mb-0.5 truncate">{val.value}</p>
                                    <p className="text-xs font-black text-primary group-hover:scale-110 transition-transform">{val.odd}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-center text-muted-foreground py-8 text-sm">Cotes non disponibles</p>
                  )}
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
        title={`${homeTeam.name} vs ${awayTeam.name} en Direct Live | ${league?.name || "LiveFoot.fun"}`}
        description={`${homeTeam.name} vs ${awayTeam.name} EN DIRECT - Pronostics IA gratuits, score live, compositions, stats H2H et analyse complète. Match ${league?.name || ""} en temps réel sur LiveFoot.fun !`}
        keywords={`${homeTeam.name} vs ${awayTeam.name} direct, ${homeTeam.name} ${awayTeam.name} live, prono ${homeTeam.name} ${awayTeam.name}, score ${homeTeam.name} ${awayTeam.name}, match en direct ${homeTeam.name}, ${league?.name || ""} en direct, football live scores`}
        ogImage={homeTeam.logo || awayTeam.logo}
        canonical={`https://livefoot.fun/match/${matchId}`}
        matchData={{
          homeTeam: homeTeam.name,
          awayTeam: awayTeam.name,
          league: league?.name || "Football",
          date: fix?.fixture?.date || new Date().toISOString(),
          status: isLive ? "live" : isFinished ? "finished" : "scheduled"
        }}
        faq={[
          {
            question: `Quand a lieu le match ${homeTeam.name} vs ${awayTeam.name} ?`,
            answer: `Le match ${homeTeam.name} contre ${awayTeam.name} ${fix?.fixture?.date ? `a lieu le ${new Date(fix.fixture.date).toLocaleDateString("fr-FR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : "est programmé prochainement"}. Suivez-le en direct sur LiveFoot.fun.`
          },
          {
            question: `Où regarder ${homeTeam.name} vs ${awayTeam.name} en direct ?`,
            answer: `Suivez le match ${homeTeam.name} vs ${awayTeam.name} en direct gratuitement sur LiveFoot.fun. Scores live, statistiques en temps réel, pronostics IA et compositions des équipes.`
          },
          {
            question: `Quel est le pronostic pour ${homeTeam.name} vs ${awayTeam.name} ?`,
            answer: `Consultez notre analyse IA complète avec pronostics gratuits basés sur la forme des équipes, les confrontations H2H, les blessures et les cotes bookmakers. Notre IA a 88% de réussite !`
          },
          {
            question: `Quelle est l'historique H2H entre ${homeTeam.name} et ${awayTeam.name} ?`,
            answer: `Retrouvez toutes les statistiques des confrontations directes (H2H) sur cette page. Historique complet des matchs précédents avec résultats et performances.`
          }
        ]}
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
              {league?.flag && <img src={league.flag} alt="" className="h-4 w-5 sm:h-5 sm:w-6 object-cover rounded-sm shadow-sm" />}
              {league?.logo && <img src={league.logo} alt="" className="h-5 w-5 sm:h-6 sm:w-6 object-contain drop-shadow-md" />}
              <span className="font-black text-xs sm:text-sm text-foreground uppercase tracking-wider">{league?.name || "Match"}</span>
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

          <div className="relative px-2 py-4 sm:p-10">
            <div className="flex flex-row items-center justify-center gap-3 sm:gap-8">
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 text-center min-w-0 max-w-[35%]"
              >
                <Link to={fix?.teams?.home?.id ? `/teams/${buildEntitySlug(fix.teams.home.id, homeTeam.name)}` : "#"} className="group flex flex-col items-center hover:opacity-80 transition-opacity">
                  <div className="relative mb-1 sm:mb-4 flex items-center justify-center h-16 w-16 sm:h-28 sm:w-28">
                    <div className="absolute inset-0 bg-white/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {homeTeam.logo ? (
                      <img src={homeTeam.logo} alt={homeTeam.name} className="relative h-12 w-12 sm:h-24 sm:w-24 object-contain drop-shadow-xl" />
                    ) : (
                      <div className="h-12 w-12 sm:h-24 sm:w-24 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-black text-xl sm:text-3xl">
                        {homeTeam.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h2 className="text-sm sm:text-xl font-black text-foreground truncate w-full leading-tight">{homeTeam.name}</h2>
                </Link>
                {homeTeamId && (
                  <div className="mt-2 hidden sm:flex justify-center">
                    <TeamFormInline teamId={homeTeamId} teamName={homeTeam.name} />
                  </div>
                )}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center flex-shrink-0 px-1 sm:px-0 z-10"
              >
                {hasStats ? (
                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                    <div className="flex flex-col items-center justify-center gap-2 px-3 py-2 sm:px-10 sm:py-6 bg-background/80 backdrop-blur-md rounded-xl sm:rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                      <div className="flex items-center gap-2 sm:gap-6 z-10">
                        <span className={cn("text-3xl sm:text-7xl font-black drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]", isLive ? "text-live" : "text-foreground")}>{homeTeam.score}</span>
                        <span className="text-sm sm:text-3xl font-bold text-muted-foreground/50">-</span>
                        <span className={cn("text-3xl sm:text-7xl font-black drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]", isLive ? "text-live" : "text-foreground")}>{awayTeam.score}</span>
                      </div>
                      
                      {/* Momentum Graph inside Scoreboard */}
                      {momentumTimeline.length > 0 && (
                        <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-30 pointer-events-none">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={momentumTimeline} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorHome" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={1}/>
                                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorAway" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={1}/>
                                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey={(d) => d.value > 0 ? d.value : 0} stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorHome)" strokeWidth={0} />
                              <Area type="monotone" dataKey={(d) => d.value < 0 ? Math.abs(d.value) : 0} stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorAway)" strokeWidth={0} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                    {isLive && <span className="text-[10px] font-black text-live animate-pulse mt-1">{minute}'</span>}
                    {/* Scorers under score */}
                    {(isLive || isFinished) && events.filter((e: any) => e.type === "Goal" && e.detail !== "Missed Penalty").length > 0 && (
                      <div className="mt-2 flex flex-col gap-0.5 text-center max-w-[200px]">
                        {events.filter((e: any) => e.type === "Goal" && e.detail !== "Missed Penalty").map((e: any, i: number) => {
                          const isHome = e.team?.id === fix?.teams?.home?.id;
                          return (
                            <div key={i} className={cn("flex items-center gap-1 text-[10px] text-muted-foreground", isHome ? "justify-end" : "justify-start self-start")}>
                              <span>⚽</span>
                              <span className="font-medium truncate max-w-[80px]">{e.player?.name?.split(" ").pop()}</span>
                              <span className="text-primary font-black">{e.time?.elapsed}'</span>
                              {e.detail === "Penalty" && <span className="text-[8px] text-amber-500">(pen)</span>}
                              {e.detail === "Own Goal" && <span className="text-[8px] text-destructive">(csc)</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl sm:rounded-3xl bg-primary/10 border border-primary/20 px-4 py-3 sm:px-8 sm:py-6 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.2)]">
                    <Clock className="h-4 w-4 sm:h-8 sm:w-8 text-primary mb-1 animate-pulse" />
                    <span className="text-lg sm:text-5xl font-black text-primary drop-shadow-md">{time}</span>
                  </div>
                )}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 text-center min-w-0 max-w-[35%]"
              >
                <Link to={fix?.teams?.away?.id ? `/teams/${buildEntitySlug(fix.teams.away.id, awayTeam.name)}` : "#"} className="group flex flex-col items-center hover:opacity-80 transition-opacity">
                  <div className="relative mb-1 sm:mb-4 flex items-center justify-center h-16 w-16 sm:h-28 sm:w-28">
                    <div className="absolute inset-0 bg-white/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {awayTeam.logo ? (
                      <img src={awayTeam.logo} alt={awayTeam.name} className="relative h-12 w-12 sm:h-24 sm:w-24 object-contain drop-shadow-xl" />
                    ) : (
                      <div className="h-12 w-12 sm:h-24 sm:w-24 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-black text-xl sm:text-3xl">
                        {awayTeam.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h2 className="text-sm sm:text-xl font-black text-foreground truncate w-full leading-tight">{awayTeam.name}</h2>
                </Link>
                {awayTeamId && (
                  <div className="mt-2 hidden sm:flex justify-center">
                    <TeamFormInline teamId={awayTeamId} teamName={awayTeam.name} />
                  </div>
                )}
              </motion.div>
            </div>

            <div className="mt-6 sm:mt-8 flex flex-col items-center w-full max-w-lg mx-auto">
              {/* Win Probability Bar */}
              {(() => {
                // Compute probabilities from available data
                let probHome = 0, probDraw = 0, probAway = 0;
                let hasProbs = false;

                // Source 0: Direct AI V3 probabilities (most precise)
                if (aiExpertPrediction?.homeWinProb && aiExpertPrediction?.awayWinProb) {
                  probHome = aiExpertPrediction.homeWinProb;
                  probDraw = aiExpertPrediction.drawProb || (100 - aiExpertPrediction.homeWinProb - aiExpertPrediction.awayWinProb);
                  probAway = aiExpertPrediction.awayWinProb;
                  hasProbs = probHome + probDraw + probAway > 0;
                }

                // Source 1: API Predictions
                if (!hasProbs && (apiPredictions as any)?.predictions?.percent) {
                  probHome = parseInt((apiPredictions as any).predictions.percent.home) || 0;
                  probDraw = parseInt((apiPredictions as any).predictions.percent.draw) || 0;
                  probAway = parseInt((apiPredictions as any).predictions.percent.away) || 0;
                  hasProbs = probHome + probDraw + probAway > 0;
                }
                
                // Source 2: AI Expert confidence + predicted score
                if (!hasProbs && aiExpertPrediction?.confidence && aiExpertPrediction?.predictedScore) {
                  const conf = Math.round((aiExpertPrediction.confidence || 0) * 100);
                  const [h, a] = (aiExpertPrediction.predictedScore || "0-0").split("-").map(Number);
                  if (h > a) {
                    probHome = conf;
                    probDraw = Math.round((100 - conf) * 0.45);
                    probAway = 100 - probHome - probDraw;
                  } else if (a > h) {
                    probAway = conf;
                    probDraw = Math.round((100 - conf) * 0.45);
                    probHome = 100 - probAway - probDraw;
                  } else {
                    probDraw = conf;
                    probHome = Math.round((100 - conf) * 0.55);
                    probAway = 100 - probDraw - probHome;
                  }
                  hasProbs = true;
                }

                if (!hasProbs) return null;

                // Normalize
                const total = probHome + probDraw + probAway;
                if (total > 0 && total !== 100) {
                  probHome = Math.round((probHome / total) * 100);
                  probDraw = Math.round((probDraw / total) * 100);
                  probAway = 100 - probHome - probDraw;
                }

                return (
                  <div className="w-full mb-6">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 px-1">
                      <span className="text-primary">{probHome}%</span>
                      <span>Probabilité de Victoire</span>
                      <span className="text-accent">{probAway}%</span>
                    </div>
                    <div className="flex h-2 w-full rounded-full overflow-hidden bg-background/50 border border-white/5 backdrop-blur-sm">
                      <div className="bg-primary h-full transition-all duration-700" style={{ width: `${probHome}%` }} />
                      <div className="bg-muted-foreground/40 h-full transition-all duration-700" style={{ width: `${probDraw}%` }} />
                      <div className="bg-accent h-full transition-all duration-700" style={{ width: `${probAway}%` }} />
                    </div>
                    <div className="flex justify-center mt-1">
                      <span className="text-[9px] text-muted-foreground/50">Nul: {probDraw}%</span>
                    </div>
                  </div>
                );
              })()}
              
              <div className="flex items-center justify-center gap-4 sm:gap-8 text-[11px] sm:text-sm font-medium text-muted-foreground flex-wrap">
                {venue?.name && <div className="flex items-center gap-1.5 bg-background/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 shadow-sm"><MapPin className="h-3.5 w-3.5 text-primary" /><span>{venue.name}</span></div>}
                {referee && <div className="flex items-center gap-1.5 bg-background/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 shadow-sm"><User className="h-3.5 w-3.5 text-primary" /><span>{referee}</span></div>}
              </div>
            </div>
          </div>
        </div>

        {/* All tabs */}
        {renderTabs()}

        {/* ─── Standings Widget ─────────────────────────────────────── */}
        {leagueStandings && leagueStandings.length > 0 && (() => {
          const standings = leagueStandings as any[];
          const homeRank = standings.find((t: any) => String(t.team?.id) === homeTeamId);
          const awayRank = standings.find((t: any) => String(t.team?.id) === awayTeamId);
          const homePos = homeRank?.rank || 0;
          const awayPos = awayRank?.rank || 0;
          const minPos = Math.max(1, Math.min(homePos, awayPos) - 2);
          const maxPos = Math.min(standings.length, Math.max(homePos, awayPos) + 2);
          const slice = standings.filter((t: any) => t.rank >= minPos && t.rank <= maxPos);
          if (slice.length === 0) return null;
          return (
            <div className="mt-8 rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
                {league?.logo && <img src={league.logo} alt="" className="h-4 w-4 object-contain" />}
                <Trophy className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Classement — {league?.name}</h3>
                <span className="ml-auto text-[10px] text-muted-foreground">Saison {season}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground">
                      <th className="px-3 py-2 text-left font-semibold w-8">#</th>
                      <th className="px-3 py-2 text-left font-semibold">Équipe</th>
                      <th className="px-2 py-2 text-center font-semibold">MJ</th>
                      <th className="px-2 py-2 text-center font-semibold">V</th>
                      <th className="px-2 py-2 text-center font-semibold">N</th>
                      <th className="px-2 py-2 text-center font-semibold">D</th>
                      <th className="px-2 py-2 text-center font-semibold">Buts</th>
                      <th className="px-2 py-2 text-center font-semibold text-primary">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {slice.map((t: any) => {
                      const isHome = String(t.team?.id) === homeTeamId;
                      const isAway = String(t.team?.id) === awayTeamId;
                      return (
                        <tr key={t.team?.id} className={cn(
                          "transition-colors",
                          isHome && "bg-primary/5 border-l-2 border-l-primary",
                          isAway && "bg-destructive/5 border-l-2 border-l-destructive",
                        )}>
                          <td className="px-3 py-2 font-black text-muted-foreground">{t.rank}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {t.team?.logo && <img src={t.team.logo} alt="" className="h-4 w-4 object-contain" />}
                              <span className={cn("font-semibold truncate max-w-[100px]", (isHome || isAway) && "text-foreground font-black")}>{t.team?.name}</span>
                              {isHome && <span className="text-[8px] text-primary font-black bg-primary/10 px-1 rounded">DOM</span>}
                              {isAway && <span className="text-[8px] text-destructive font-black bg-destructive/10 px-1 rounded">EXT</span>}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center text-muted-foreground">{t.all?.played}</td>
                          <td className="px-2 py-2 text-center text-emerald-500 font-semibold">{t.all?.win}</td>
                          <td className="px-2 py-2 text-center text-amber-500 font-semibold">{t.all?.draw}</td>
                          <td className="px-2 py-2 text-center text-destructive font-semibold">{t.all?.lose}</td>
                          <td className="px-2 py-2 text-center text-muted-foreground">{t.all?.goals?.for}:{t.all?.goals?.against}</td>
                          <td className="px-2 py-2 text-center font-black text-primary">{t.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* ─── Related News ─────────────────────────────────────────── */}
        {(() => {
          const relatedNews = allNews.filter((n: any) => {
            const title = (n.title || "").toLowerCase();
            const home = homeTeam.name.toLowerCase().split(" ")[0];
            const away = awayTeam.name.toLowerCase().split(" ")[0];
            return title.includes(home) || title.includes(away);
          }).slice(0, 4);
          if (relatedNews.length === 0) return null;
          return (
            <div className="mt-6 rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
                <Flame className="h-4 w-4 text-destructive" />
                <h3 className="font-bold text-sm text-foreground">Actualités liées</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
                {relatedNews.map((n: any, i: number) => (
                  <Link key={i} to={`/news/${n.id}`} className="flex gap-3 p-2 rounded-xl hover:bg-muted/30 transition-colors group">
                    {n.image && <img src={n.image} alt="" className="h-14 w-20 object-cover rounded-lg flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">{n.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{n.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

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
              <Link
                to="/pricing"
                onClick={() =>
                  trackConversionEvent({
                    goalName: "VIP CTA Click",
                    userId: user?.id,
                    metadata: {
                      source: "match_detail",
                      placement: "bottom_vip_cta",
                      fixture_id: matchId,
                      home_team: homeTeam.name,
                      away_team: awayTeam.name,
                    },
                  })
                }
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-black text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-105 text-center"
              >
                DÉBLOQUER LES VALUE BETS
              </Link>
              <span className="text-xs font-bold text-muted-foreground">Analyses avancées & Communauté VIP</span>
            </div>
          </div>
        </div>

        {/* Share Widget */}
        <div className="px-4 sm:px-6 py-6 border-t border-white/5 bg-white/[0.02]">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Share2 className="h-3 w-3 text-primary" /> Partager ce match
          </p>
          <ShareWidget
            title={`LiveFoot: ${homeTeam.name} vs ${awayTeam.name}`}
            text={`Regarde le match ${homeTeam.name} vs ${awayTeam.name} en direct sur LiveFoot. Pronos IA, stats et scores live !`}
            url={`/match/${matchId}`}
          />
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
                <div className="flex items-center gap-2">
                  {fix.homeTeam?.logo ? <img src={fix.homeTeam.logo} alt="" className="h-5 w-5 object-contain flex-shrink-0" /> : <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold">{fix.homeTeam?.name?.charAt(0)}</span>}
                  <span className="text-xs font-medium text-foreground truncate">{fix.homeTeam?.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {fix.awayTeam?.logo ? <img src={fix.awayTeam.logo} alt="" className="h-5 w-5 object-contain flex-shrink-0" /> : <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold">{fix.awayTeam?.name?.charAt(0)}</span>}
                  <span className="text-xs font-medium text-foreground truncate">{fix.awayTeam?.name}</span>
                </div>
              </div>
              <span className="text-[9px] text-muted-foreground truncate max-w-16">
                {typeof fix.league === "object" ? fix.league?.name : fix.league}
              </span>
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
