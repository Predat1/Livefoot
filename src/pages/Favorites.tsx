import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { useFavorites } from "@/hooks/useFavorites";
import { mockTeams } from "@/data/teamsData";
import { mockPlayers } from "@/data/playersData";
import { mockCompetitions } from "@/data/competitionsData";
import { Star, Trophy, Users, User, X } from "lucide-react";
import TeamLogo from "@/components/TeamLogo";
import PlayerAvatar from "@/components/PlayerAvatar";
import LeagueLogo from "@/components/LeagueLogo";
import { Link } from "react-router-dom";

const Favorites = () => {
  const { favorites, toggleFavorite } = useFavorites();

  const favoriteTeams = mockTeams.filter((t) => favorites.teams.includes(t.id));
  const favoritePlayers = mockPlayers.filter((p) => favorites.players.includes(p.id));
  const favoriteCompetitions = mockCompetitions.filter((c) => favorites.competitions.includes(c.id));

  const isEmpty = favoriteTeams.length === 0 && favoritePlayers.length === 0 && favoriteCompetitions.length === 0;

  return (
    <Layout>
      <SEOHead title="My Favorites" description="Your saved teams, players and competitions." />
      <div className="container py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
            <h1 className="text-xl sm:text-3xl font-black text-foreground">Favorites</h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground ml-3 sm:ml-4">Your saved teams, players, and competitions</p>
        </div>

        {isEmpty ? (
          <div className="text-center py-16">
            <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-foreground mb-2">No favorites yet</h2>
            <p className="text-sm text-muted-foreground mb-6">Start adding teams, players, and competitions to your favorites by clicking the star icon.</p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/teams" className="text-sm font-medium text-primary hover:underline">Browse Teams</Link>
              <Link to="/players" className="text-sm font-medium text-primary hover:underline">Browse Players</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Favorite Teams */}
            {favoriteTeams.length > 0 && (
              <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground">Teams ({favoriteTeams.length})</h3>
                </div>
                <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {favoriteTeams.map((team) => (
                    <div key={team.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Link to={`/teams/${team.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <TeamLogo teamName={team.name} size="sm" />
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">{team.name}</h4>
                          <p className="text-xs text-muted-foreground">{team.league}</p>
                        </div>
                      </Link>
                      <button onClick={() => toggleFavorite("teams", team.id)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Favorite Players */}
            {favoritePlayers.length > 0 && (
              <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground">Players ({favoritePlayers.length})</h3>
                </div>
                <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {favoritePlayers.map((player) => (
                    <div key={player.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Link to={`/players/${player.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <PlayerAvatar name={player.name} photoUrl={player.photoUrl} size="sm" />
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">{player.name}</h4>
                          <p className="text-xs text-muted-foreground">{player.team} • {player.position}</p>
                        </div>
                      </Link>
                      <button onClick={() => toggleFavorite("players", player.id)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Favorite Competitions */}
            {favoriteCompetitions.length > 0 && (
              <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground">Competitions ({favoriteCompetitions.length})</h3>
                </div>
                <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {favoriteCompetitions.map((comp) => (
                    <div key={comp.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Link to="/competitions" className="flex items-center gap-3 flex-1 min-w-0">
                        <LeagueLogo leagueId={comp.id} size="sm" />
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">{comp.name}</h4>
                          <p className="text-xs text-muted-foreground">{comp.country}</p>
                        </div>
                      </Link>
                      <button onClick={() => toggleFavorite("competitions", comp.id)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Favorites;
