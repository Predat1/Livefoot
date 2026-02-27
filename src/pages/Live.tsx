import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { useLiveFixtures } from "@/hooks/useApiFootball";
import { useGoalNotifications } from "@/hooks/useGoalNotifications";
import { Zap, RefreshCw, Clock, Volume2, VolumeX, History, Globe, Loader2, Bell, BellOff } from "lucide-react";
import TeamLogo from "@/components/TeamLogo";
import LeagueLogo from "@/components/LeagueLogo";
import CountryFlag from "@/components/CountryFlag";
import { cn } from "@/lib/utils";

const REFRESH_INTERVAL = 30;

const COUNTRY_COORDS: Record<string, { x: number; y: number }> = {
  England: { x: 372, y: 118 }, Spain: { x: 355, y: 148 }, Italy: { x: 410, y: 150 },
  Germany: { x: 400, y: 125 }, France: { x: 375, y: 138 }, Europe: { x: 400, y: 135 },
  Portugal: { x: 340, y: 150 }, Netherlands: { x: 385, y: 118 },
  Brazil: { x: 200, y: 280 }, Argentina: { x: 180, y: 320 }, USA: { x: 140, y: 130 },
  Mexico: { x: 110, y: 165 }, Turkey: { x: 450, y: 145 }, Belgium: { x: 382, y: 122 },
  Scotland: { x: 365, y: 108 }, Greece: { x: 425, y: 155 }, Japan: { x: 700, y: 140 },
  "Saudi-Arabia": { x: 490, y: 180 }, China: { x: 630, y: 140 }, Australia: { x: 680, y: 300 },
};

const Live = () => {
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"live" | "map" | "history">("live");

  const { data: liveLeagues, refetch } = useLiveFixtures();
  const { goalHistory, detectGoals, notificationsEnabled, enableNotifications, disableNotifications, isSupported, permissionDenied } = useGoalNotifications(liveLeagues, soundEnabled);

  const liveMatches = liveLeagues || [];
  const totalLive = liveMatches.reduce((acc, l) => acc + l.matches.length, 0);

  const matchesByCountry = liveMatches.reduce<Record<string, { count: number; leagues: string[] }>>((acc, league) => {
    const c = league.country;
    if (!acc[c]) acc[c] = { count: 0, leagues: [] };
    acc[c].count += league.matches.length;
    acc[c].leagues.push(league.name);
    return acc;
  }, {});

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    detectGoals();
    setLastRefreshed(new Date());
    setCountdown(REFRESH_INTERVAL);
    setIsRefreshing(false);
  }, [detectGoals, refetch]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { handleRefresh(); return REFRESH_INTERVAL; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [handleRefresh]);

  return (
    <Layout>
      <SEOHead
        title="Scores en Direct - Football Live"
        description="Tous les matchs de football en direct maintenant. Scores temps réel, événements minute par minute, notifications de buts instantanées."
        keywords="scores en direct, football live, résultats en direct, livescore foot, match en cours"
      />
      <div className="container py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-live animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-black text-foreground">LIVE</h1>
            </div>
            <span className="rounded-full bg-live/15 px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm font-bold text-live">
              {totalLive} match{totalLive !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Push Notifications toggle */}
            <button
              onClick={() => notificationsEnabled ? disableNotifications() : enableNotifications()}
              title={
                permissionDenied
                  ? "Notifications bloquées dans les paramètres du navigateur"
                  : notificationsEnabled
                  ? "Désactiver les notifications"
                  : "Activer les notifications de buts"
              }
              disabled={permissionDenied}
              className={cn(
                "flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-2.5 py-1.5 text-[10px] sm:text-xs font-semibold transition-colors",
                permissionDenied
                  ? "bg-muted text-muted-foreground/50 cursor-not-allowed"
                  : notificationsEnabled
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {notificationsEnabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{notificationsEnabled ? "Notifs ON" : "Notifs OFF"}</span>
            </button>
            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Désactiver les sons" : "Activer les sons"}
              className={cn(
                "flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-2.5 py-1.5 text-[10px] sm:text-xs font-semibold transition-colors",
                soundEnabled ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{soundEnabled ? "Son ON" : "Son OFF"}</span>
            </button>
            <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="font-bold text-foreground">{countdown}s</span>
            </div>
            <button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-1 sm:gap-1.5 rounded-lg bg-primary/10 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-60">
              <RefreshCw className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5", isRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-5 h-0.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-live transition-all duration-1000 ease-linear" style={{ width: `${(countdown / REFRESH_INTERVAL) * 100}%` }} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-muted/50 rounded-xl p-1">
          {([
            { id: "live", label: "Matchs en direct", icon: Zap },
            { id: "map", label: "Carte du monde", icon: Globe },
            { id: "history", label: `Buts (${goalHistory.length})`, icon: History },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs sm:text-sm font-semibold transition-all",
                activeTab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{id === "live" ? "Live" : id === "map" ? "Carte" : "Buts"}</span>
            </button>
          ))}
        </div>

        {/* LIVE TAB */}
        {activeTab === "live" && (
          <>
            {totalLive === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
                  <Zap className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Aucun match en direct</h2>
                <p className="text-muted-foreground text-center max-w-sm text-sm">Reviens bientôt !</p>
                <Link to="/" className="mt-2 rounded-xl bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors">Voir tous les matchs</Link>
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
                      {league.matches.map((match) => (
                        <Link key={match.id} to={`/match/${match.id}`} className="block px-3 sm:px-4 py-3 sm:py-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex flex-col items-center w-9 sm:w-12 flex-shrink-0">
                              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-live live-pulse mb-0.5 sm:mb-1" />
                              <span className="text-[10px] sm:text-xs font-black text-live">{match.minute}'</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-end min-w-0">
                              <span className="text-xs sm:text-sm font-bold text-foreground text-right leading-tight truncate">{match.homeTeam.name}</span>
                              <TeamLogo teamName={match.homeTeam.name} size="sm" />
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 px-1 sm:px-2">
                              <span className="text-base sm:text-xl font-black text-live">{match.homeTeam.score}</span>
                              <span className="text-xs sm:text-sm text-muted-foreground">-</span>
                              <span className="text-base sm:text-xl font-black text-live">{match.awayTeam.score}</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                              <TeamLogo teamName={match.awayTeam.name} size="sm" />
                              <span className="text-xs sm:text-sm font-bold text-foreground leading-tight truncate">{match.awayTeam.name}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* MAP TAB */}
        {activeTab === "map" && (
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-bold text-foreground text-sm">Matchs en cours par pays</h2>
            </div>
            <div className="relative w-full overflow-hidden bg-muted/20 p-4">
              <svg viewBox="0 0 800 420" className="w-full h-auto">
                <rect width="800" height="420" fill="hsl(var(--muted)/0.3)" rx="12" />
                <path d="M 50 80 L 200 70 L 220 120 L 190 160 L 160 180 L 120 200 L 90 190 L 60 170 L 40 140 Z" fill="hsl(var(--muted))" opacity="0.7" />
                <path d="M 130 220 L 200 210 L 220 240 L 210 300 L 180 340 L 150 360 L 130 340 L 120 300 L 110 260 Z" fill="hsl(var(--muted))" opacity="0.7" />
                <path d="M 340 100 L 440 95 L 450 130 L 430 155 L 400 165 L 360 155 L 335 135 Z" fill="hsl(var(--muted))" opacity="0.7" />
                <path d="M 360 175 L 450 170 L 470 210 L 460 280 L 430 330 L 390 340 L 360 310 L 345 260 L 350 210 Z" fill="hsl(var(--muted))" opacity="0.7" />
                <path d="M 450 70 L 720 60 L 730 160 L 680 180 L 600 170 L 530 190 L 470 175 L 450 140 Z" fill="hsl(var(--muted))" opacity="0.7" />
                <path d="M 620 260 L 720 255 L 730 300 L 700 320 L 650 315 L 620 300 Z" fill="hsl(var(--muted))" opacity="0.7" />
                {Object.entries(matchesByCountry).map(([country, data]) => {
                  const coords = COUNTRY_COORDS[country];
                  if (!coords) return null;
                  const size = Math.min(6 + data.count * 2, 18);
                  return (
                    <g key={country}>
                      <circle cx={coords.x} cy={coords.y} r={size + 4} fill="hsl(var(--primary))" opacity="0.15" className="animate-pulse" />
                      <circle cx={coords.x} cy={coords.y} r={size} fill="hsl(var(--primary))" opacity="0.8" />
                      <text x={coords.x} y={coords.y + size + 14} textAnchor="middle" className="fill-foreground text-[9px] font-bold">{country}</text>
                      <text x={coords.x} y={coords.y + 4} textAnchor="middle" className="fill-primary-foreground text-[10px] font-black">{data.count}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-foreground text-sm">Historique des buts</h2>
            </div>
            {goalHistory.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-sm">Aucun but détecté pour le moment</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
                {goalHistory.map((goal) => (
                  <Link key={goal.id} to={`/match/${goal.matchId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-lg flex-shrink-0">⚽</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {goal.homeTeam} <span className="text-primary">{goal.homeScore}</span> - <span className="text-primary">{goal.awayScore}</span> {goal.awayTeam}
                      </p>
                      <p className="text-xs text-muted-foreground">{goal.league} · {goal.minute}'</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{goal.time}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Live;
