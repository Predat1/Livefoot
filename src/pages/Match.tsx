import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { mockLeagues } from "@/data/mockData";
import { ArrowLeft, Clock, MapPin, Users, TrendingUp, Target, User, AlertTriangle, CornerDownRight, Repeat2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

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
  const hasStats = isLive || isFinished;

  const events = match.events || [];
  const stats = match.stats || {
    possession: [50, 50],
    shots: [0, 0],
    shotsOnTarget: [0, 0],
    corners: [0, 0],
    fouls: [0, 0],
    passes: [0, 0],
    passAccuracy: [0, 0],
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "goal":
        return <Target className="h-4 w-4" />;
      case "yellow":
        return <div className="w-3 h-4 bg-yellow-500 rounded-sm" />;
      case "red":
        return <div className="w-3 h-4 bg-red-500 rounded-sm" />;
      case "substitution":
        return <Repeat2 className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="container py-4 sm:py-8">
        {/* Back button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to matches
        </Link>

        {/* Match Header */}
        <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden mb-4 sm:mb-6">
          {/* League info */}
          <div className="bg-league-header px-4 sm:px-6 py-2 sm:py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{match.league.flag}</span>
              <span className="font-bold text-sm sm:text-base text-foreground">{match.league.name}</span>
            </div>
            {isLive && (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-live live-pulse" />
                <span className="text-xs sm:text-sm font-bold text-live">LIVE {match.minute}'</span>
              </div>
            )}
            {isFinished && (
              <span className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase">Full Time</span>
            )}
          </div>

          {/* Score section */}
          <div className="p-4 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              {/* Home team */}
              <div className="flex-1 text-center">
                <div className="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-xl sm:rounded-2xl bg-muted/80 text-2xl sm:text-4xl mx-auto mb-2 sm:mb-3 shadow-lg">
                  {match.homeTeam.logo || "⚽"}
                </div>
                <h2 className="text-sm sm:text-xl font-bold text-foreground">{match.homeTeam.name}</h2>
              </div>

              {/* Score */}
              <div className="text-center flex-shrink-0">
                {hasStats ? (
                  <div className="flex items-center gap-2 sm:gap-4">
                    <span className={cn(
                      "text-3xl sm:text-5xl font-black",
                      isLive ? "text-live" : "text-foreground"
                    )}>
                      {match.homeTeam.score}
                    </span>
                    <span className="text-xl sm:text-3xl text-muted-foreground">-</span>
                    <span className={cn(
                      "text-3xl sm:text-5xl font-black",
                      isLive ? "text-live" : "text-foreground"
                    )}>
                      {match.awayTeam.score}
                    </span>
                  </div>
                ) : (
                  <div className="rounded-xl sm:rounded-2xl bg-primary/10 px-4 sm:px-6 py-3 sm:py-4">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-1 sm:mb-2" />
                    <span className="text-xl sm:text-3xl font-black text-primary">{match.time}</span>
                  </div>
                )}
              </div>

              {/* Away team */}
              <div className="flex-1 text-center">
                <div className="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-xl sm:rounded-2xl bg-muted/80 text-2xl sm:text-4xl mx-auto mb-2 sm:mb-3 shadow-lg">
                  {match.awayTeam.logo || "⚽"}
                </div>
                <h2 className="text-sm sm:text-xl font-bold text-foreground">{match.awayTeam.name}</h2>
              </div>
            </div>

            {/* Match Info Bar */}
            <div className="mt-4 sm:mt-6 flex items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1 sm:gap-2">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{match.stadium}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{match.attendance?.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{match.referee}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Match Details Tabs */}
        {hasStats ? (
          <Tabs defaultValue="events" className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-card border border-border/50 rounded-xl p-1 mb-4">
              <TabsTrigger value="events" className="rounded-lg text-xs sm:text-sm">Events</TabsTrigger>
              <TabsTrigger value="stats" className="rounded-lg text-xs sm:text-sm">Statistics</TabsTrigger>
              <TabsTrigger value="lineups" className="rounded-lg text-xs sm:text-sm">Lineups</TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="mt-0">
              <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-4 sm:px-5 py-2 sm:py-3 border-b border-border">
                  <h3 className="font-bold text-sm sm:text-base text-foreground">Match Events</h3>
                </div>
                <div className="p-3 sm:p-4">
                  {events.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {events.map((event, index) => (
                        <div 
                          key={index}
                          className={cn(
                            "flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors",
                            event.team === "home" ? "bg-muted/30" : "bg-muted/30"
                          )}
                        >
                          {event.team === "home" ? (
                            <>
                              <span className="w-10 sm:w-12 text-center font-bold text-xs sm:text-sm text-muted-foreground">
                                {event.minute}'
                              </span>
                              <div className={cn(
                                "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full",
                                event.type === "goal" ? "bg-primary text-primary-foreground" : "bg-muted"
                              )}>
                                {getEventIcon(event.type)}
                              </div>
                              <div className="flex-1">
                                <span className="font-medium text-xs sm:text-sm text-foreground">{event.player}</span>
                                {event.assist && (
                                  <span className="text-[10px] sm:text-xs text-muted-foreground ml-2">
                                    (assist: {event.assist})
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex-1 text-right">
                                <span className="font-medium text-xs sm:text-sm text-foreground">{event.player}</span>
                                {event.assist && (
                                  <span className="text-[10px] sm:text-xs text-muted-foreground mr-2">
                                    (assist: {event.assist})
                                  </span>
                                )}
                              </div>
                              <div className={cn(
                                "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full",
                                event.type === "goal" ? "bg-primary text-primary-foreground" : "bg-muted"
                              )}>
                                {getEventIcon(event.type)}
                              </div>
                              <span className="w-10 sm:w-12 text-center font-bold text-xs sm:text-sm text-muted-foreground">
                                {event.minute}'
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No events yet</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="mt-0">
              <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-4 sm:px-5 py-2 sm:py-3 border-b border-border">
                  <h3 className="font-bold text-sm sm:text-base text-foreground">Match Statistics</h3>
                </div>
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {[
                    { label: "Possession", values: stats.possession, suffix: "%" },
                    { label: "Shots", values: stats.shots },
                    { label: "Shots on Target", values: stats.shotsOnTarget },
                    { label: "Corners", values: stats.corners },
                    { label: "Fouls", values: stats.fouls },
                    { label: "Passes", values: stats.passes },
                    { label: "Pass Accuracy", values: stats.passAccuracy, suffix: "%" },
                  ].map(({ label, values, suffix = "" }) => {
                    const [home, away] = values;
                    const total = home + away;
                    const homePercent = total > 0 ? (home / total) * 100 : 50;
                    
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                          <span className="font-bold text-foreground">{home}{suffix}</span>
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-bold text-foreground">{away}{suffix}</span>
                        </div>
                        <div className="flex h-2 sm:h-3 rounded-full overflow-hidden bg-muted">
                          <div 
                            className="bg-primary transition-all duration-500"
                            style={{ width: `${homePercent}%` }}
                          />
                          <div 
                            className="bg-muted-foreground/30 transition-all duration-500"
                            style={{ width: `${100 - homePercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lineups" className="mt-0">
              <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-4 sm:px-5 py-2 sm:py-3 border-b border-border">
                  <h3 className="font-bold text-sm sm:text-base text-foreground">Lineups</h3>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-2 gap-4 sm:gap-8">
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                        <span className="text-lg">{match.homeTeam.logo}</span>
                        {match.homeTeam.name}
                      </h4>
                      <div className="space-y-1.5 sm:space-y-2">
                        {["Goalkeeper", "Defender", "Defender", "Defender", "Defender", "Midfielder", "Midfielder", "Midfielder", "Forward", "Forward", "Forward"].map((position, i) => (
                          <div key={i} className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-muted/30">
                            <span className="w-5 sm:w-6 text-center text-[10px] sm:text-xs font-bold text-muted-foreground">{i + 1}</span>
                            <span className="text-xs sm:text-sm text-foreground">Player {i + 1}</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground ml-auto">{position.slice(0, 3)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                        <span className="text-lg">{match.awayTeam.logo}</span>
                        {match.awayTeam.name}
                      </h4>
                      <div className="space-y-1.5 sm:space-y-2">
                        {["Goalkeeper", "Defender", "Defender", "Defender", "Defender", "Midfielder", "Midfielder", "Midfielder", "Forward", "Forward", "Forward"].map((position, i) => (
                          <div key={i} className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-muted/30">
                            <span className="w-5 sm:w-6 text-center text-[10px] sm:text-xs font-bold text-muted-foreground">{i + 1}</span>
                            <span className="text-xs sm:text-sm text-foreground">Player {i + 1}</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground ml-auto">{position.slice(0, 3)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          /* Pre-match info */
          <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-4 sm:px-5 py-2 sm:py-3 border-b border-border">
              <h3 className="font-bold text-sm sm:text-base text-foreground">Match Information</h3>
            </div>
            <div className="p-4 sm:p-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-muted/30">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Stadium</p>
                  <p className="font-medium text-sm sm:text-base text-foreground">{match.stadium}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-muted/30">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Capacity</p>
                  <p className="font-medium text-sm sm:text-base text-foreground">{match.attendance?.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-muted/30">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Referee</p>
                  <p className="font-medium text-sm sm:text-base text-foreground">{match.referee}</p>
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
