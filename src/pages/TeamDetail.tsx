import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
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

  // Fixed season stats per team based on their standing
  const teamSeasonStats: Record<string, { goalsFor: number; goalsAgainst: number; cleanSheets: number; avgPossession: number; wins: number; draws: number; losses: number }> = {
    "Real Madrid": { goalsFor: 52, goalsAgainst: 18, cleanSheets: 12, avgPossession: 62, wins: 16, draws: 3, losses: 2 },
    "FC Barcelona": { goalsFor: 48, goalsAgainst: 22, cleanSheets: 10, avgPossession: 64, wins: 14, draws: 4, losses: 3 },
    "Manchester City": { goalsFor: 50, goalsAgainst: 20, cleanSheets: 11, avgPossession: 65, wins: 15, draws: 4, losses: 2 },
    "Liverpool": { goalsFor: 55, goalsAgainst: 24, cleanSheets: 9, avgPossession: 58, wins: 16, draws: 3, losses: 3 },
    "Arsenal": { goalsFor: 45, goalsAgainst: 19, cleanSheets: 11, avgPossession: 59, wins: 14, draws: 5, losses: 2 },
    "Bayern Munich": { goalsFor: 58, goalsAgainst: 22, cleanSheets: 10, avgPossession: 63, wins: 15, draws: 2, losses: 2 },
    "Paris Saint-Germain": { goalsFor: 46, goalsAgainst: 16, cleanSheets: 13, avgPossession: 61, wins: 15, draws: 3, losses: 1 },
    "Inter Milan": { goalsFor: 44, goalsAgainst: 15, cleanSheets: 14, avgPossession: 55, wins: 16, draws: 4, losses: 1 },
    "Juventus": { goalsFor: 35, goalsAgainst: 17, cleanSheets: 12, avgPossession: 54, wins: 12, draws: 6, losses: 3 },
    "Chelsea": { goalsFor: 38, goalsAgainst: 28, cleanSheets: 7, avgPossession: 57, wins: 11, draws: 5, losses: 5 },
    "Manchester United": { goalsFor: 32, goalsAgainst: 30, cleanSheets: 6, avgPossession: 52, wins: 10, draws: 4, losses: 7 },
    "Borussia Dortmund": { goalsFor: 43, goalsAgainst: 26, cleanSheets: 8, avgPossession: 56, wins: 13, draws: 3, losses: 5 },
    "AC Milan": { goalsFor: 37, goalsAgainst: 23, cleanSheets: 9, avgPossession: 53, wins: 12, draws: 4, losses: 5 },
    "Atlético Madrid": { goalsFor: 36, goalsAgainst: 20, cleanSheets: 10, avgPossession: 51, wins: 11, draws: 6, losses: 4 },
    "Napoli": { goalsFor: 40, goalsAgainst: 21, cleanSheets: 10, avgPossession: 56, wins: 13, draws: 4, losses: 4 },
  };

  const seasonStats = teamSeasonStats[team.name] || { goalsFor: 35, goalsAgainst: 25, cleanSheets: 8, avgPossession: 52, wins: 10, draws: 5, losses: 5 };

  // Realistic recent results per team using real opponent names from same league
  const teamRecentResults: Record<string, { opponent: string; result: string; score: string; date: string }[]> = {
    "Real Madrid": [
      { opponent: "FC Barcelona", result: "W", score: "3-2", date: "Jan 20" },
      { opponent: "Atlético Madrid", result: "D", score: "1-1", date: "Jan 15" },
      { opponent: "Sevilla", result: "W", score: "2-0", date: "Jan 10" },
      { opponent: "Real Sociedad", result: "W", score: "3-1", date: "Jan 5" },
      { opponent: "Valencia", result: "W", score: "4-1", date: "Dec 30" },
    ],
    "FC Barcelona": [
      { opponent: "Real Madrid", result: "L", score: "2-3", date: "Jan 20" },
      { opponent: "Villarreal", result: "W", score: "3-0", date: "Jan 15" },
      { opponent: "Athletic Bilbao", result: "W", score: "2-1", date: "Jan 10" },
      { opponent: "Celta Vigo", result: "D", score: "2-2", date: "Jan 5" },
      { opponent: "Getafe", result: "W", score: "4-0", date: "Dec 30" },
    ],
    "Manchester City": [
      { opponent: "Liverpool", result: "D", score: "3-3", date: "Jan 20" },
      { opponent: "Chelsea", result: "W", score: "2-0", date: "Jan 15" },
      { opponent: "Arsenal", result: "L", score: "0-1", date: "Jan 10" },
      { opponent: "Tottenham", result: "W", score: "3-1", date: "Jan 5" },
      { opponent: "Aston Villa", result: "W", score: "4-0", date: "Dec 30" },
    ],
    "Liverpool": [
      { opponent: "Manchester City", result: "D", score: "3-3", date: "Jan 20" },
      { opponent: "Arsenal", result: "W", score: "2-1", date: "Jan 15" },
      { opponent: "Newcastle", result: "W", score: "4-2", date: "Jan 10" },
      { opponent: "Everton", result: "W", score: "3-0", date: "Jan 5" },
      { opponent: "Burnley", result: "W", score: "2-0", date: "Dec 30" },
    ],
    "Arsenal": [
      { opponent: "Chelsea", result: "W", score: "2-1", date: "Jan 20" },
      { opponent: "Liverpool", result: "L", score: "1-2", date: "Jan 15" },
      { opponent: "Tottenham", result: "W", score: "3-1", date: "Jan 10" },
      { opponent: "West Ham", result: "W", score: "2-0", date: "Jan 5" },
      { opponent: "Brighton", result: "D", score: "1-1", date: "Dec 30" },
    ],
    "Bayern Munich": [
      { opponent: "Borussia Dortmund", result: "W", score: "4-1", date: "Jan 20" },
      { opponent: "RB Leipzig", result: "W", score: "2-0", date: "Jan 15" },
      { opponent: "Bayer Leverkusen", result: "D", score: "2-2", date: "Jan 10" },
      { opponent: "Freiburg", result: "W", score: "3-0", date: "Jan 5" },
      { opponent: "Stuttgart", result: "W", score: "5-1", date: "Dec 30" },
    ],
    "Paris Saint-Germain": [
      { opponent: "Lille", result: "W", score: "2-0", date: "Jan 20" },
      { opponent: "Marseille", result: "W", score: "3-1", date: "Jan 15" },
      { opponent: "Monaco", result: "D", score: "1-1", date: "Jan 10" },
      { opponent: "Lyon", result: "W", score: "4-1", date: "Jan 5" },
      { opponent: "Nice", result: "W", score: "2-0", date: "Dec 30" },
    ],
    "Inter Milan": [
      { opponent: "Juventus", result: "W", score: "2-0", date: "Jan 20" },
      { opponent: "AC Milan", result: "W", score: "1-0", date: "Jan 15" },
      { opponent: "Napoli", result: "D", score: "1-1", date: "Jan 10" },
      { opponent: "Roma", result: "W", score: "3-1", date: "Jan 5" },
      { opponent: "Lazio", result: "W", score: "2-0", date: "Dec 30" },
    ],
  };

  const defaultResults = [
    { opponent: team.lastMatch.opponent, result: team.lastMatch.result, score: team.lastMatch.score, date: "Jan 20" },
    { opponent: "Opponent B", result: "W", score: "2-0", date: "Jan 15" },
    { opponent: "Opponent C", result: "D", score: "1-1", date: "Jan 10" },
    { opponent: "Opponent D", result: "W", score: "3-1", date: "Jan 5" },
    { opponent: "Opponent E", result: "L", score: "0-1", date: "Dec 30" },
  ];

  const recentResults = teamRecentResults[team.name] || defaultResults;

  return (
    <Layout>
      <SEOHead
        title={`${team.name} - Squad, Results & Stats`}
        description={`${team.name} - ${team.league}, ${team.country}. Manager: ${team.manager}. Stadium: ${team.stadium}.`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SportsTeam",
          name: team.name,
          sport: "Football",
          location: { "@type": "Place", name: team.stadium },
          coach: { "@type": "Person", name: team.manager },
        }}
      />
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
          <TabsList className="w-full grid grid-cols-5 bg-card border border-border/50 rounded-xl p-1 mb-4">
            <TabsTrigger value="overview" className="rounded-lg text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="squad" className="rounded-lg text-xs sm:text-sm">Squad</TabsTrigger>
            <TabsTrigger value="fixtures" className="rounded-lg text-xs sm:text-sm">Fixtures</TabsTrigger>
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
                      <PlayerAvatar name={player.name} photoUrl={player.photoUrl} size="sm" />
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

          {/* Fixtures */}
          <TabsContent value="fixtures" className="mt-0">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">Upcoming Fixtures</h3>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { opponent: team.nextMatch.opponent, date: team.nextMatch.date, time: team.nextMatch.time, venue: "Home" },
                  { opponent: "TBD", date: "Feb 10", time: "15:00", venue: "Away" },
                  { opponent: "TBD", date: "Feb 17", time: "18:30", venue: "Home" },
                  { opponent: "TBD", date: "Feb 24", time: "20:45", venue: "Away" },
                  { opponent: "TBD", date: "Mar 3", time: "16:00", venue: "Home" },
                ].map((fixture, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold",
                        fixture.venue === "Home" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {fixture.venue}
                      </span>
                      <span className="font-medium text-sm text-foreground">{fixture.opponent}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{fixture.date} • {fixture.time}</span>
                  </div>
                ))}
              </div>
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
