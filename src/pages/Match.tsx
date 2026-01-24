import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { mockLeagues } from "@/data/mockData";
import { ArrowLeft, Clock, MapPin, Users, TrendingUp, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const Match = () => {
  const { matchId } = useParams();
  
  // Find match from all leagues
  const match = mockLeagues
    .flatMap(league => league.matches.map(m => ({ ...m, league })))
    .find(m => m.id === matchId);

  if (!match) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Match not found</h1>
          <Link to="/" className="text-primary hover:underline">Back to home</Link>
        </div>
      </Layout>
    );
  }

  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  // Mock stats for the match
  const matchStats = {
    possession: [55, 45],
    shots: [12, 8],
    shotsOnTarget: [5, 3],
    corners: [6, 4],
    fouls: [10, 14],
  };

  // Mock events
  const events = isLive || isFinished ? [
    { minute: 15, type: "goal", team: "home", player: "Player A" },
    { minute: 32, type: "yellow", team: "away", player: "Player B" },
    { minute: 45, type: "goal", team: "away", player: "Player C" },
    { minute: 67, type: "goal", team: "home", player: "Player D" },
  ] : [];

  return (
    <Layout>
      <div className="container py-8">
        {/* Back button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to matches
        </Link>

        {/* Match Header */}
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden mb-6">
          {/* League info */}
          <div className="bg-league-header px-6 py-3 border-b border-border flex items-center justify-between">
            <span className="font-bold text-foreground">{match.league.name}</span>
            {isLive && (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-live live-pulse" />
                <span className="text-sm font-bold text-live">LIVE</span>
              </div>
            )}
          </div>

          {/* Score section */}
          <div className="p-8">
            <div className="flex items-center justify-center gap-8">
              {/* Home team */}
              <div className="flex-1 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/80 text-4xl mx-auto mb-3 shadow-lg">
                  ⚽
                </div>
                <h2 className="text-xl font-bold text-foreground">{match.homeTeam.name}</h2>
              </div>

              {/* Score */}
              <div className="text-center">
                {isLive || isFinished ? (
                  <>
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "text-5xl font-black",
                        isLive ? "text-live" : "text-foreground"
                      )}>
                        {match.homeTeam.score}
                      </span>
                      <span className="text-3xl text-muted-foreground">-</span>
                      <span className={cn(
                        "text-5xl font-black",
                        isLive ? "text-live" : "text-foreground"
                      )}>
                        {match.awayTeam.score}
                      </span>
                    </div>
                    {isLive && match.minute && (
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-live live-pulse" />
                        <span className="text-lg font-bold text-live">{match.minute}'</span>
                      </div>
                    )}
                    {isFinished && (
                      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Full Time
                      </span>
                    )}
                  </>
                ) : (
                  <div className="rounded-2xl bg-primary/10 px-6 py-4">
                    <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
                    <span className="text-3xl font-black text-primary">{match.time}</span>
                  </div>
                )}
              </div>

              {/* Away team */}
              <div className="flex-1 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/80 text-4xl mx-auto mb-3 shadow-lg">
                  ⚽
                </div>
                <h2 className="text-xl font-bold text-foreground">{match.awayTeam.name}</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Match Details Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Events */}
          {events.length > 0 && (
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-5 py-3 border-b border-border">
                <h3 className="font-bold text-foreground">Match Events</h3>
              </div>
              <div className="p-4 space-y-3">
                {events.map((event, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-xl transition-colors",
                      event.team === "home" ? "bg-muted/30" : "bg-muted/30 flex-row-reverse"
                    )}
                  >
                    <span className="w-12 text-center font-bold text-muted-foreground">
                      {event.minute}'
                    </span>
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      event.type === "goal" ? "bg-primary text-primary-foreground" : "bg-yellow-500 text-white"
                    )}>
                      {event.type === "goal" ? <Target className="h-4 w-4" /> : "🟨"}
                    </div>
                    <span className="font-medium text-foreground">{event.player}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          {(isLive || isFinished) && (
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-5 py-3 border-b border-border">
                <h3 className="font-bold text-foreground">Match Statistics</h3>
              </div>
              <div className="p-4 space-y-4">
                {Object.entries(matchStats).map(([stat, [home, away]]) => (
                  <div key={stat}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-bold text-foreground">{home}</span>
                      <span className="text-muted-foreground capitalize">
                        {stat.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span className="font-bold text-foreground">{away}</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                      <div 
                        className="bg-primary transition-all duration-500"
                        style={{ width: `${(home / (home + away)) * 100}%` }}
                      />
                      <div 
                        className="bg-muted-foreground/30 transition-all duration-500"
                        style={{ width: `${(away / (home + away)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Match Info */}
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden lg:col-span-2">
            <div className="bg-league-header px-5 py-3 border-b border-border">
              <h3 className="font-bold text-foreground">Match Information</h3>
            </div>
            <div className="p-4 grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Stadium</p>
                  <p className="font-medium text-foreground">National Stadium</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                  <p className="font-medium text-foreground">45,000</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Referee</p>
                  <p className="font-medium text-foreground">M. Oliver</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Match;
