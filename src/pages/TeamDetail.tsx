import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { useTeamDetail, useTeamSquad, useTeamFixtures, useTeamNextFixtures } from "@/hooks/useApiFootball";
import { ArrowLeft, MapPin, Users, Calendar, Star, Shirt, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShareButton from "@/components/ShareButton";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { Skeleton } from "@/components/ui/skeleton";

const TeamDetail = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  const { data: team, isLoading: loadingTeam } = useTeamDetail(teamId || "");
  const resolvedId = team?.id || (/^\d+$/.test(teamId || "") ? teamId! : "");
  const { data: squad, isLoading: loadingSquad } = useTeamSquad(resolvedId);
  const { data: recentResults, isLoading: loadingResults } = useTeamFixtures(resolvedId, "2024");
  const { data: nextFixtures } = useTeamNextFixtures(resolvedId);

  // Redirect slug URLs to canonical numeric ID
  const isSlug = !/^\d+$/.test(teamId || "");
  useEffect(() => {
    if (isSlug && team?.id) {
      navigate(`/teams/${team.id}`, { replace: true });
    }
  }, [isSlug, team?.id, navigate]);

  if (loadingTeam) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-48 w-full rounded-2xl mb-6" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

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

  return (
    <Layout>
      <SEOHead
        title={`${team.name} - Squad, Results & Stats`}
        description={`${team.name} - ${team.country}. Stadium: ${team.venue?.name || "N/A"}.`}
      />
      <div className="container py-4 sm:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link to="/teams" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to teams
          </Link>
          <ShareButton title={`${team.name} | LiveFoot`} text={`Découvrez ${team.name} | LiveFoot`} />
        </div>

        {/* Team Header */}
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden mb-6">
          <div className="gradient-primary p-6 sm:p-8 text-primary-foreground">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {team.logo ? (
                <img src={team.logo} alt={team.name} className="h-20 w-20 sm:h-24 sm:w-24 object-contain bg-white/20 rounded-2xl p-2" />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl font-black">{team.name.charAt(0)}</div>
              )}
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-2xl sm:text-3xl font-black">{team.name}</h1>
                <p className="text-primary-foreground/80">{team.country}</p>
              </div>
              <button
                onClick={() => toggleFavorite("teams", team.id, team.name)}
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
              <p className="text-2xl font-black text-foreground">{team.founded || "—"}</p>
              <p className="text-xs text-muted-foreground">Founded</p>
            </div>
            <div className="p-4 text-center">
              <MapPin className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground truncate">{team.venue?.name || "—"}</p>
              <p className="text-xs text-muted-foreground">Stadium</p>
            </div>
            <div className="p-4 text-center">
              <Users className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-black text-foreground">{team.venue?.capacity?.toLocaleString() || "—"}</p>
              <p className="text-xs text-muted-foreground">Capacity</p>
            </div>
            <div className="p-4 text-center">
              <Shirt className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-black text-foreground">{squad?.length || "—"}</p>
              <p className="text-xs text-muted-foreground">Players</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="squad" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-card border border-border/50 rounded-xl p-1 mb-4">
            <TabsTrigger value="squad" className="rounded-lg text-xs sm:text-sm">Squad</TabsTrigger>
            <TabsTrigger value="results" className="rounded-lg text-xs sm:text-sm">Results</TabsTrigger>
            <TabsTrigger value="fixtures" className="rounded-lg text-xs sm:text-sm">Upcoming</TabsTrigger>
          </TabsList>

          {/* Squad */}
          <TabsContent value="squad" className="mt-0">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                <Shirt className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">Squad ({squad?.length || 0} players)</h3>
              </div>
              {loadingSquad ? (
                <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : squad && squad.length > 0 ? (
                <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {squad.map((player: any) => (
                    <div key={player.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      {player.photo ? (
                        <img src={player.photo} alt={player.name} className="h-10 w-10 rounded-full object-cover bg-muted" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                          {player.name?.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-foreground truncate">{player.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {player.position} {player.number ? `• #${player.number}` : ""} {player.age ? `• ${player.age}y` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">No squad data available.</div>
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
              {loadingResults ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                  ))}
                </div>
              ) : recentResults && recentResults.length > 0 ? (
                <div className="p-4 space-y-2">
                  {recentResults.map((r: any) => {
                    const isHome = r.homeTeam.name === team.name;
                    const won = isHome ? (r.homeScore > r.awayScore) : (r.awayScore > r.homeScore);
                    const draw = r.homeScore === r.awayScore;
                    const result = won ? "W" : draw ? "D" : "L";
                    return (
                      <Link key={r.id} to={`/match/${r.id}`} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                            result === "W" ? "bg-primary/10 text-primary" :
                            result === "L" ? "bg-destructive/10 text-destructive" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {result}
                          </span>
                          <div className="flex items-center gap-2">
                            {r.homeTeam.logo && <img src={r.homeTeam.logo} alt="" className="h-5 w-5 object-contain" />}
                            <span className="text-xs font-medium text-foreground">{r.homeTeam.name}</span>
                            <span className="text-xs font-bold text-foreground">{r.homeScore} - {r.awayScore}</span>
                            <span className="text-xs font-medium text-foreground">{r.awayTeam.name}</span>
                            {r.awayTeam.logo && <img src={r.awayTeam.logo} alt="" className="h-5 w-5 object-contain" />}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{r.date}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">No results data available.</div>
              )}
            </div>
          </TabsContent>

          {/* Upcoming Fixtures */}
          <TabsContent value="fixtures" className="mt-0">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">Upcoming Fixtures</h3>
              </div>
              {nextFixtures && nextFixtures.length > 0 ? (
                <div className="p-4 space-y-2">
                  {nextFixtures.map((f: any) => (
                    <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-2">
                        {f.homeTeam.logo && <img src={f.homeTeam.logo} alt="" className="h-5 w-5 object-contain" />}
                        <span className="text-xs font-medium text-foreground">{f.homeTeam.name}</span>
                        <span className="text-xs text-muted-foreground">vs</span>
                        <span className="text-xs font-medium text-foreground">{f.awayTeam.name}</span>
                        {f.awayTeam.logo && <img src={f.awayTeam.logo} alt="" className="h-5 w-5 object-contain" />}
                      </div>
                      <span className="text-xs text-muted-foreground">{f.date} • {f.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">No upcoming fixtures.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default TeamDetail;
