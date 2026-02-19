import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { mockLeagues } from "@/data/mockData";
import { Zap, RefreshCw, Clock, Volume2, VolumeX, History, Globe } from "lucide-react";
import TeamLogo from "@/components/TeamLogo";
import LeagueLogo from "@/components/LeagueLogo";
import CountryFlag from "@/components/CountryFlag";
import { cn } from "@/lib/utils";

const REFRESH_INTERVAL = 30;

// Country coordinates for the world map (approximate SVG positions on an 800x400 map)
const COUNTRY_COORDS: Record<string, { x: number; y: number }> = {
  England:   { x: 372, y: 118 },
  Spain:     { x: 355, y: 148 },
  Italy:     { x: 410, y: 150 },
  Germany:   { x: 400, y: 125 },
  France:    { x: 375, y: 138 },
  Europe:    { x: 400, y: 135 },
  Portugal:  { x: 340, y: 150 },
  Netherlands: { x: 385, y: 118 },
};

// Simple beep using Web Audio API
function playGoalSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (freq: number, start: number, dur: number, gain = 0.3) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gainNode.gain.setValueAtTime(gain, ctx.currentTime + start);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    };
    // Goal jingle: C-E-G-C
    playTone(523, 0,    0.15);
    playTone(659, 0.18, 0.15);
    playTone(784, 0.36, 0.15);
    playTone(1047,0.54, 0.35, 0.4);
  } catch {}
}

type GoalEvent = {
  id: string;
  time: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  scorer: string;
  minute: number;
};

const Live = () => {
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"live" | "map" | "history">("live");
  const [goalHistory, setGoalHistory] = useState<GoalEvent[]>([]);
  const prevGoalsRef = useRef<Record<string, number>>({});

  const liveMatches = mockLeagues
    .map((league) => ({
      ...league,
      matches: league.matches.filter((m) => m.status === "live"),
    }))
    .filter((league) => league.matches.length > 0);

  const totalLive = liveMatches.reduce((acc, l) => acc + l.matches.length, 0);

  // Group live matches by country for the map
  const matchesByCountry = liveMatches.reduce<Record<string, { count: number; leagues: string[] }>>((acc, league) => {
    const c = league.country;
    if (!acc[c]) acc[c] = { count: 0, leagues: [] };
    acc[c].count += league.matches.length;
    acc[c].leagues.push(league.name);
    return acc;
  }, {});

  // Detect new goals on refresh
  const detectGoals = useCallback(() => {
    liveMatches.forEach((league) => {
      league.matches.forEach((match) => {
        const key = match.id;
        const currentTotal = (match.homeTeam.score ?? 0) + (match.awayTeam.score ?? 0);
        const prev = prevGoalsRef.current[key] ?? currentTotal;
        if (currentTotal > prev && soundEnabled) {
          playGoalSound();
          // Find the latest goal event
          const events = (match as any).events || [];
          const lastGoal = [...events].reverse().find((e: any) => e.type === "goal");
          if (lastGoal) {
            const newGoal: GoalEvent = {
              id: `${key}-${Date.now()}`,
              time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
              league: league.name,
              homeTeam: match.homeTeam.name,
              awayTeam: match.awayTeam.name,
              homeScore: match.homeTeam.score ?? 0,
              awayScore: match.awayTeam.score ?? 0,
              scorer: lastGoal.player,
              minute: lastGoal.minute,
            };
            setGoalHistory((prev) => [newGoal, ...prev].slice(0, 30));
          }
        }
        prevGoalsRef.current[key] = currentTotal;
      });
    });
  }, [liveMatches, soundEnabled]);

  // Seed initial goal history from mock data
  useEffect(() => {
    const initial: GoalEvent[] = [];
    liveMatches.forEach((league) => {
      league.matches.forEach((match) => {
        const events = ((match as any).events || []).filter((e: any) => e.type === "goal");
        events.forEach((e: any) => {
          initial.push({
            id: `${match.id}-${e.minute}`,
            time: `${e.minute}'`,
            league: league.name,
            homeTeam: match.homeTeam.name,
            awayTeam: match.awayTeam.name,
            homeScore: match.homeTeam.score ?? 0,
            awayScore: match.awayTeam.score ?? 0,
            scorer: e.player,
            minute: e.minute,
          });
        });
        prevGoalsRef.current[match.id] = (match.homeTeam.score ?? 0) + (match.awayTeam.score ?? 0);
      });
    });
    setGoalHistory(initial.sort((a, b) => b.minute - a.minute).slice(0, 30));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    detectGoals();
    setRefreshKey((k) => k + 1);
    setLastRefreshed(new Date());
    setCountdown(REFRESH_INTERVAL);
    setIsRefreshing(false);
  }, [detectGoals]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleRefresh();
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [handleRefresh]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "goal": return "⚽";
      case "yellow": return "🟨";
      case "red": return "🟥";
      case "substitution": return "🔄";
      default: return "•";
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Live Scores - Matchs en cours"
        description="Tous les matchs de football en direct. Scores en temps réel, buts, cartons et statistiques."
      />

      <div className="container py-4 sm:py-8" key={refreshKey}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-live animate-pulse" />
              <h1 className="text-2xl font-black text-foreground">LIVE</h1>
            </div>
            <span className="rounded-full bg-live/15 px-3 py-1 text-sm font-bold text-live">
              {totalLive} match{totalLive !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Désactiver les sons" : "Activer les sons"}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                soundEnabled
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{soundEnabled ? "Son ON" : "Son OFF"}</span>
            </button>
            {/* Countdown */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh dans </span>
              <span className="font-bold text-foreground">{countdown}s</span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-5 h-0.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-live transition-all duration-1000 ease-linear"
            style={{ width: `${(countdown / REFRESH_INTERVAL) * 100}%` }}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-muted/50 rounded-xl p-1">
          {([
            { id: "live", label: "Matchs en direct", icon: Zap },
            { id: "map", label: "Carte du monde", icon: Globe },
            { id: "history", label: `Historique (${goalHistory.length})`, icon: History },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs sm:text-sm font-semibold transition-all",
                activeTab === id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{id === "live" ? "Live" : id === "map" ? "Carte" : "Historique"}</span>
            </button>
          ))}
        </div>

        {/* === TAB: LIVE MATCHES === */}
        {activeTab === "live" && (
          <>
            {totalLive === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
                  <Zap className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Aucun match en direct</h2>
                <p className="text-muted-foreground text-center max-w-sm text-sm">
                  Il n'y a aucun match en cours pour le moment. Reviens bientôt !
                </p>
                <Link to="/" className="mt-2 rounded-xl bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors">
                  Voir tous les matchs
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {liveMatches.map((league) => (
                  <div key={league.id} className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                    <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
                      <CountryFlag country={league.country} size="sm" />
                      <LeagueLogo leagueId={league.id} size="sm" className="!h-5 !w-5" />
                      <span className="font-bold text-sm text-foreground">{league.name}</span>
                      <span className="ml-auto text-xs font-semibold text-live flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse" />
                        {league.matches.length} en direct
                      </span>
                    </div>

                    <div className="divide-y divide-border/50">
                      {league.matches.map((match) => {
                        const events = (match as any).events || [];
                        const recentEvents = [...events].reverse().slice(0, 3);

                        return (
                          <Link
                            key={match.id}
                            to={`/match/${match.id}`}
                            className="block px-4 py-4 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col items-center w-12 flex-shrink-0">
                                <span className="h-2 w-2 rounded-full bg-live live-pulse mb-1" />
                                <span className="text-xs font-black text-live">{(match as any).minute}'</span>
                              </div>
                              <div className="flex items-center gap-2 flex-1 justify-end">
                                <span className="text-sm font-bold text-foreground text-right leading-tight">{match.homeTeam.name}</span>
                                <TeamLogo teamName={match.homeTeam.name} size="sm" />
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 px-2">
                                <span className="text-xl font-black text-live">{match.homeTeam.score}</span>
                                <span className="text-sm text-muted-foreground">-</span>
                                <span className="text-xl font-black text-live">{match.awayTeam.score}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-1">
                                <TeamLogo teamName={match.awayTeam.name} size="sm" />
                                <span className="text-sm font-bold text-foreground leading-tight">{match.awayTeam.name}</span>
                              </div>
                            </div>

                            {recentEvents.length > 0 && (
                              <div className="mt-2.5 ml-12 flex flex-wrap gap-2">
                                {recentEvents.map((event: any, i: number) => (
                                  <span key={i} className="flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                                    <span>{getEventIcon(event.type)}</span>
                                    <span className="font-medium">{event.minute}'</span>
                                    <span className="truncate max-w-[80px]">{event.player.split(" ").slice(-1)[0]}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {(match as any).stats && (
                              <div className="mt-2.5 ml-12 flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground font-medium">{(match as any).stats.possession[0]}%</span>
                                <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${(match as any).stats.possession[0]}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium">{(match as any).stats.possession[1]}%</span>
                                <span className="text-[10px] text-muted-foreground">poss.</span>
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* === TAB: WORLD MAP === */}
        {activeTab === "map" && (
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-bold text-foreground text-sm">Matchs en cours par pays</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Les points verts indiquent les pays avec des matchs en direct</p>
            </div>
            <div className="relative w-full overflow-hidden bg-muted/20 p-4">
              {/* SVG World Map (simplified continents) */}
              <svg viewBox="0 0 800 420" className="w-full h-auto">
                {/* Ocean background */}
                <rect width="800" height="420" fill="hsl(var(--muted)/0.3)" rx="12" />

                {/* === CONTINENTS (simplified paths) === */}
                {/* North America */}
                <path d="M 50 80 L 200 70 L 220 120 L 190 160 L 160 180 L 120 200 L 90 190 L 60 170 L 40 140 Z" fill="hsl(var(--muted))" opacity="0.7" />
                {/* South America */}
                <path d="M 130 220 L 200 210 L 220 240 L 210 300 L 180 340 L 150 360 L 130 340 L 120 300 L 110 260 Z" fill="hsl(var(--muted))" opacity="0.7" />
                {/* Europe */}
                <path d="M 340 100 L 440 95 L 450 130 L 430 155 L 400 165 L 360 155 L 335 135 Z" fill="hsl(var(--muted))" opacity="0.7" />
                {/* Africa */}
                <path d="M 360 175 L 450 170 L 470 210 L 460 280 L 430 330 L 390 340 L 360 310 L 345 260 L 350 210 Z" fill="hsl(var(--muted))" opacity="0.7" />
                {/* Asia */}
                <path d="M 450 70 L 720 60 L 730 160 L 680 180 L 600 170 L 530 190 L 470 175 L 450 140 Z" fill="hsl(var(--muted))" opacity="0.7" />
                {/* Oceania */}
                <path d="M 620 260 L 720 255 L 730 300 L 700 320 L 650 315 L 620 300 Z" fill="hsl(var(--muted))" opacity="0.7" />

                {/* Live match dots */}
                {Object.entries(matchesByCountry).map(([country, data]) => {
                  const coords = COUNTRY_COORDS[country];
                  if (!coords) return null;
                  return (
                    <g key={country}>
                      {/* Pulse ring */}
                      <circle
                        cx={coords.x} cy={coords.y} r={18}
                        fill="hsl(var(--live-indicator)/0.15)"
                        className="animate-ping"
                        style={{ animationDuration: "2s" }}
                      />
                      {/* Dot */}
                      <circle cx={coords.x} cy={coords.y} r={10} fill="hsl(var(--live-indicator))" />
                      {/* Count badge */}
                      <circle cx={coords.x + 8} cy={coords.y - 8} r={7} fill="hsl(var(--primary))" />
                      <text
                        x={coords.x + 8} y={coords.y - 4}
                        textAnchor="middle"
                        fontSize="8"
                        fontWeight="bold"
                        fill="white"
                      >{data.count}</text>
                      {/* Country label */}
                      <text
                        x={coords.x} y={coords.y + 24}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="600"
                        fill="hsl(var(--foreground))"
                        opacity="0.8"
                      >{country}</text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Country list */}
            <div className="p-4 space-y-2">
              {Object.entries(matchesByCountry).map(([country, data]) => (
                <div key={country} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="h-2.5 w-2.5 rounded-full bg-live animate-pulse flex-shrink-0" />
                  <CountryFlag country={country} size="sm" />
                  <span className="font-semibold text-sm text-foreground flex-1">{country}</span>
                  <div className="flex items-center gap-2">
                    {data.leagues.map((l) => (
                      <span key={l} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{l}</span>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-live ml-auto">{data.count} match{data.count > 1 ? "s" : ""}</span>
                </div>
              ))}
              {Object.keys(matchesByCountry).length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">Aucun match en cours actuellement</p>
              )}
            </div>
          </div>
        )}

        {/* === TAB: GOAL HISTORY === */}
        {activeTab === "history" && (
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-bold text-foreground text-sm">Historique des buts</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Buts marqués lors des matchs en direct</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  {goalHistory.filter((g) => !isNaN(Number(g.time.replace("'", "")))).length} buts
                </span>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors",
                    soundEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                  Son
                </button>
              </div>
            </div>

            {soundEnabled && (
              <div className="px-4 py-2.5 bg-primary/5 border-b border-border/50 flex items-center gap-2">
                <Volume2 className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs text-primary font-medium">
                  Alerte sonore activée — Un son retentit à chaque nouveau but détecté lors du rafraîchissement
                </p>
              </div>
            )}

            <div className="divide-y divide-border/50">
              {goalHistory.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="text-4xl mb-3">⚽</div>
                  <p className="text-muted-foreground text-sm">Aucun but enregistré pour le moment</p>
                </div>
              ) : (
                goalHistory.map((goal) => (
                  <div key={goal.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors">
                    <div className="flex flex-col items-center w-10 flex-shrink-0">
                      <span className="text-lg">⚽</span>
                      <span className="text-[10px] font-bold text-live">{goal.minute}'</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-foreground truncate">{goal.scorer}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full flex-shrink-0">{goal.league}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {goal.homeTeam} <span className="font-bold text-foreground">{goal.homeScore}–{goal.awayScore}</span> {goal.awayTeam}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">{goal.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Last refreshed */}
        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Dernière mise à jour : {lastRefreshed.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      </div>
    </Layout>
  );
};

export default Live;
