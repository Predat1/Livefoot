import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { mockLeagues } from "@/data/mockData";
import { Zap, RefreshCw, Clock, Target, AlertTriangle } from "lucide-react";
import TeamLogo from "@/components/TeamLogo";
import LeagueLogo from "@/components/LeagueLogo";
import CountryFlag from "@/components/CountryFlag";
import { cn } from "@/lib/utils";

const REFRESH_INTERVAL = 30; // seconds

const Live = () => {
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const liveMatches = mockLeagues
    .map((league) => ({
      ...league,
      matches: league.matches.filter((m) => m.status === "live"),
    }))
    .filter((league) => league.matches.length > 0);

  const totalLive = liveMatches.reduce((acc, l) => acc + l.matches.length, 0);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshKey((k) => k + 1);
    setLastRefreshed(new Date());
    setCountdown(REFRESH_INTERVAL);
    setIsRefreshing(false);
  }, []);

  // Auto-refresh countdown
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
        title="Live Scores - Matches en cours"
        description="Tous les matchs de football en direct. Scores en temps réel, buts, cartons et statistiques."
      />

      <div className="container py-4 sm:py-8" key={refreshKey}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-live animate-pulse" />
              <h1 className="text-2xl font-black text-foreground">LIVE</h1>
            </div>
            <span className="rounded-full bg-live/15 px-3 py-1 text-sm font-bold text-live">
              {totalLive} match{totalLive !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Countdown ring */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Refresh dans <span className="font-bold text-foreground">{countdown}s</span></span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Progress bar for auto-refresh */}
        <div className="mb-6 h-0.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-live transition-all duration-1000 ease-linear"
            style={{ width: `${(countdown / REFRESH_INTERVAL) * 100}%` }}
          />
        </div>

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
                {/* League header */}
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
                          {/* Minute badge */}
                          <div className="flex flex-col items-center w-12 flex-shrink-0">
                            <span className="h-2 w-2 rounded-full bg-live live-pulse mb-1" />
                            <span className="text-xs font-black text-live">{(match as any).minute}'</span>
                          </div>

                          {/* Home */}
                          <div className="flex items-center gap-2 flex-1 justify-end">
                            <span className="text-sm font-bold text-foreground text-right leading-tight">{match.homeTeam.name}</span>
                            <TeamLogo teamName={match.homeTeam.name} size="sm" />
                          </div>

                          {/* Score */}
                          <div className="flex items-center gap-2 flex-shrink-0 px-2">
                            <span className="text-xl font-black text-live">{match.homeTeam.score}</span>
                            <span className="text-sm text-muted-foreground">-</span>
                            <span className="text-xl font-black text-live">{match.awayTeam.score}</span>
                          </div>

                          {/* Away */}
                          <div className="flex items-center gap-2 flex-1">
                            <TeamLogo teamName={match.awayTeam.name} size="sm" />
                            <span className="text-sm font-bold text-foreground leading-tight">{match.awayTeam.name}</span>
                          </div>
                        </div>

                        {/* Recent events */}
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

                        {/* Match stats mini bar */}
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

        {/* Last refreshed */}
        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Dernière mise à jour : {lastRefreshed.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      </div>
    </Layout>
  );
};

export default Live;
