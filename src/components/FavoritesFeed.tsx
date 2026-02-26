import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart, Star, ArrowRight, Loader2 } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { LeagueData } from "@/hooks/useApiFootball";
import MatchCard from "./MatchCard";

interface FavoritesFeedProps {
  leagues: LeagueData[];
  isLoading: boolean;
}

const FavoritesFeed = ({ leagues, isLoading }: FavoritesFeedProps) => {
  const { user } = useAuth();
  const { favorites } = useFavorites();

  const favoriteTeamNames = useMemo(() => {
    return new Set(favorites.teams.map((t) => t.toLowerCase()));
  }, [favorites.teams]);

  const favoriteMatches = useMemo(() => {
    if (favoriteTeamNames.size === 0) return [];

    const matches: { match: any; leagueName: string; leagueLogo?: string }[] = [];
    for (const league of leagues) {
      for (const match of league.matches) {
        const homeKey = match.homeTeam.name.toLowerCase();
        const awayKey = match.awayTeam.name.toLowerCase();
        if (favoriteTeamNames.has(homeKey) || favoriteTeamNames.has(awayKey)) {
          matches.push({ match, leagueName: league.name, leagueLogo: league.logo });
        }
      }
    }
    return matches;
  }, [leagues, favoriteTeamNames]);

  // Also match by team ID stored in favorites
  const favoriteTeamIds = useMemo(() => new Set(favorites.teams), [favorites.teams]);

  const favoriteMatchesById = useMemo(() => {
    if (favoriteTeamIds.size === 0) return [];
    // Already captured by name above, this is a fallback
    return [];
  }, [favoriteTeamIds]);

  // Don't show if no favorites or loading
  if (favoriteTeamNames.size === 0) {
    if (!user) return null;
    // Show a prompt to add favorites
    return (
      <section className="mb-6 sm:mb-8">
        <div className="rounded-xl sm:rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 sm:p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-foreground mb-1">
            Personnalisez votre fil
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3">
            Ajoutez vos équipes favorites pour voir leurs matchs en priorité
          </p>
          <Link
            to="/favorites"
            className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-xs sm:text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
          >
            <Star className="h-3.5 w-3.5" />
            Gérer mes favoris
          </Link>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
          <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-destructive fill-destructive" />
          <h2 className="text-base sm:text-lg font-bold text-foreground">Mes Équipes</h2>
        </div>
        <div className="flex items-center justify-center py-8 text-muted-foreground text-xs gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement...
        </div>
      </section>
    );
  }

  if (favoriteMatches.length === 0) {
    return (
      <section className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
          <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-destructive fill-destructive" />
          <h2 className="text-base sm:text-lg font-bold text-foreground">Mes Équipes</h2>
        </div>
        <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 p-6 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Aucun match de vos équipes favorites aujourd'hui
          </p>
          <Link
            to="/favorites"
            className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
          >
            Gérer mes favoris <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6 sm:mb-8">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
          <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-destructive fill-destructive" />
          <h2 className="text-base sm:text-lg font-bold text-foreground">Mes Équipes</h2>
          <span className="text-[10px] sm:text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
            {favoriteMatches.length}
          </span>
        </div>
        <Link
          to="/favorites"
          className="flex items-center gap-1 text-xs sm:text-sm font-medium text-primary hover:underline"
        >
          Favoris <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden shadow-sm">
        {favoriteMatches.map(({ match, leagueName, leagueLogo }, i) => (
          <div key={match.id}>
            {(i === 0 || favoriteMatches[i - 1].leagueName !== leagueName) && (
              <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-muted/30 border-b border-border/30">
                {leagueLogo && (
                  <img src={leagueLogo} alt={leagueName} className="h-4 w-4 object-contain" />
                )}
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {leagueName}
                </span>
              </div>
            )}
            <MatchCard match={match} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default FavoritesFeed;
