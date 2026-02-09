import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { mockTeams } from "@/data/teamsData";
import { mockPlayers } from "@/data/playersData";
import { ArrowLeft, MapPin, Users, Trophy, Calendar, Star, Target, Shirt, TrendingUp, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TeamLogo from "@/components/TeamLogo";
import PlayerAvatar from "@/components/PlayerAvatar";
import CountryFlag from "@/components/CountryFlag";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";

const TeamDetail = () => {
  const { teamId } = useParams();
  const team = mockTeams.find((t) => t.id === teamId);
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!team) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Team not found</h1>
          <Link to="/teams" className="text-primary hover:underline">Back to teams</Link>
        </div>
      </Layout>
    );
  }

  const teamPlayers = mockPlayers.filter((p) => p.team === team.name);

  const seasonStats = {
    goalsFor: Math.floor(Math.random() * 30) + 25,
    goalsAgainst: Math.floor(Math.random() * 20) + 10,
    cleanSheets: Math.floor(Math.random() * 10) + 5,
    avgPossession: Math.floor(Math.random() * 15) + 50,
    wins: Math.floor(Math.random() * 10) + 8,
    draws: Math.floor(Math.random() * 6) + 2,
    losses: Math.floor(Math.random() * 5) + 1,
  };

  const recentResults = [
    { opponent: "Team A", result: "W", score: "2-0", date: "Jan 20" },
    { opponent: "Team B", result: "D", score: "1-1", date: "Jan 15" },
    { opponent: "Team C", result: "W", score: "3-1", date: "Jan 10" },
    { opponent: "Team D", result: "L", score: "0-2", date: "Jan 5" },
    { opponent: "Team E", result: "W", score: "4-0", date: "Dec 30" },
  ];

  return (
    <Layout>
      <div className="container py-4 sm:py-8">
        <Link to="/teams" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to teams
        </Link>

        {/* Team Header */}
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden mb-6">
          <div className="gradient-primary p-6 sm:p-8 text-primary-foreground">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <TeamLogo teamName={team.name} size="xl" className="!bg-white/20 !shadow-lg" />
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-2xl sm:text-3xl font-black">{team.name}</h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <CountryFlag country={team.country} size="sm" />
                  <p className="text-primary-foreground/80">{team.league} • {team.country}</p>
                </div>
              </div>
              <button
                onClick={() => toggleFavorite("teams", team.id)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <Star className={cn("h-5 w-5", isFavorite("teams", team.id) ? "fill-yellow-400 text-yellow-400" : "text-white")} />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
            <div className="p-4 text-center">
              <Calendar className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-black text-foreground">{team.founded}</p>
              <p className="text-xs text-muted-foreground">Founded</p>
            </div>
            <div className="p-4 text-center">
              <MapPin className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">{team.stadium}</p>
              <p className="text-xs text-muted-foreground">Stadium</p>
            </div>
            <div className="p-4 text-center">
              <Users className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-black text-foreground">{team.capacity.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Capacity</p>
            </div>
            <div className="p-4 text-center">
              <Trophy className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">{team.manager}</p>
              <p className="text-xs text-muted-foreground">Manager</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-card border border-border/50 rounded-xl p-1 mb-4">
            <TabsTrigger value="overview" className="rounded-lg text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="squad" className="rounded-lg text-xs sm:text-sm">Squad</TabsTrigger>
            <TabsTrigger value="results" className="rounded-lg text-xs sm:text-sm">Results</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-lg text-xs sm:text-sm">Stats</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-0 space-y-4">
            {/* Trophies */}
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">Honours</h3>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-muted/30">
                  <Trophy className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-black text-foreground">{team.titles.league}</p>
                  <p className="text-xs text-muted-foreground">League Titles</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/30">
                  <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-3xl font-black text-foreground">{team.titles.cups}</p>
                  <p className="text-xs text-muted-foreground">Domestic Cups</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/30">
                  <Trophy className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-3xl font-black text-foreground">{team.titles.european}</p>
                  <p className="text-xs text-muted-foreground">European</p>
                </div>
              </div>
            </div>

            {/* Next & Last Match */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-card border border-border/50 p-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3">Last Match</h4>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{team.lastMatch.opponent}</span>
                  <span className={cn(
                    "px-2 py-1 rounded-md text-xs font-bold",
                    team.lastMatch.result === "W" ? "bg-primary/10 text-primary" :
                    team.lastMatch.result === "L" ? "bg-destructive/10 text-destructive" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {team.lastMatch.result} {team.lastMatch.score}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl bg-card border border-border/50 p-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3">Next Match</h4>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{team.nextMatch.opponent}</span>
                  <span className="text-xs text-muted-foreground">{team.nextMatch.date} • {team.nextMatch.time}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Squad */}
          <TabsContent value="squad" className="mt-0">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                <Shirt className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">Squad ({teamPlayers.length} players)</h3>
              </div>
              {teamPlayers.length > 0 ? (
                <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {teamPlayers.map((player) => (
                    <Link
                      key={player.id}
                      to={`/players/${player.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <PlayerAvatar name={player.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-foreground truncate">{player.name}</h4>
                        <p className="text-xs text-muted-foreground">{player.position} • #{player.jersey}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-primary">
                          <Target className="h-3.5 w-3.5" />
                          <span className="font-bold text-sm">{player.goals}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Goals</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">No players data available.</div>
              )}
            </div>
          </TabsContent>

          {/* Results */}
          <TabsContent value="results" className="mt-0">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">Recent Results</h3>
              </div>
              <div className="p-4 space-y-2">
                {recentResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                        r.result === "W" ? "bg-primary/10 text-primary" :
                        r.result === "L" ? "bg-destructive/10 text-destructive" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {r.result}
                      </span>
                      <div>
                        <p className="font-medium text-sm text-foreground">{r.opponent}</p>
                        <p className="text-xs text-muted-foreground">{r.date}</p>
                      </div>
                    </div>
                    <span className="font-bold text-foreground">{r.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Stats */}
          <TabsContent value="stats" className="mt-0">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">Season Statistics</h3>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-muted/30">
                  <p className="text-3xl font-black text-primary">{seasonStats.goalsFor}</p>
                  <p className="text-xs text-muted-foreground">Goals For</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/30">
                  <p className="text-3xl font-black text-foreground">{seasonStats.goalsAgainst}</p>
                  <p className="text-xs text-muted-foreground">Goals Against</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/30">
                  <p className="text-3xl font-black text-foreground">{seasonStats.cleanSheets}</p>
                  <p className="text-xs text-muted-foreground">Clean Sheets</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/30">
                  <p className="text-3xl font-black text-primary">{seasonStats.avgPossession}%</p>
                  <p className="text-xs text-muted-foreground">Avg Possession</p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <div className="p-4 rounded-xl bg-muted/30">
                  <h4 className="font-bold text-sm text-foreground mb-3">Record</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 text-center">
                      <p className="text-xl font-black text-primary">{seasonStats.wins}</p>
                      <p className="text-xs text-muted-foreground">Wins</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-xl font-black text-foreground">{seasonStats.draws}</p>
                      <p className="text-xs text-muted-foreground">Draws</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-xl font-black text-destructive">{seasonStats.losses}</p>
                      <p className="text-xs text-muted-foreground">Losses</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default TeamDetail;
