import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { useFavorites } from "@/hooks/useFavorites";
import { Star, Trophy, Users, User, X } from "lucide-react";
import { Link } from "react-router-dom";

const Favorites = () => {
  const { favorites, toggleFavorite } = useFavorites();

  // Favorites now store API IDs + names. We display the IDs as links.
  const isEmpty = favorites.teams.length === 0 && favorites.players.length === 0 && favorites.competitions.length === 0;

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
              <Link to="/competitions" className="text-sm font-medium text-primary hover:underline">Browse Competitions</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Favorite Teams */}
            {favorites.teams.length > 0 && (
              <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground">Teams ({favorites.teams.length})</h3>
                </div>
                <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {favorites.teams.map((teamId) => (
                    <div key={teamId} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Link to={`/teams/${teamId}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">Team #{teamId}</h4>
                          <p className="text-xs text-muted-foreground">View details →</p>
                        </div>
                      </Link>
                      <button onClick={() => toggleFavorite("teams", teamId)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Favorite Players */}
            {favorites.players.length > 0 && (
              <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground">Players ({favorites.players.length})</h3>
                </div>
                <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {favorites.players.map((playerId) => (
                    <div key={playerId} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Link to={`/players/${playerId}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">Player #{playerId}</h4>
                          <p className="text-xs text-muted-foreground">View details →</p>
                        </div>
                      </Link>
                      <button onClick={() => toggleFavorite("players", playerId)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Favorite Competitions */}
            {favorites.competitions.length > 0 && (
              <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground">Competitions ({favorites.competitions.length})</h3>
                </div>
                <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {favorites.competitions.map((compId) => (
                    <div key={compId} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Link to="/competitions" className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Trophy className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">Competition #{compId}</h4>
                          <p className="text-xs text-muted-foreground">View details →</p>
                        </div>
                      </Link>
                      <button onClick={() => toggleFavorite("competitions", compId)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
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
