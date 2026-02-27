import { useState } from "react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/Layout";
import { useTeamsByLeague } from "@/hooks/useApiFootball";
import { Search, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { buildEntitySlug } from "@/utils/slugify";
import { Skeleton } from "@/components/ui/skeleton";

const LEAGUES = [
  { id: "39", name: "Premier League", season: "2024" },
  { id: "140", name: "La Liga", season: "2024" },
  { id: "135", name: "Serie A", season: "2024" },
  { id: "78", name: "Bundesliga", season: "2024" },
  { id: "61", name: "Ligue 1", season: "2024" },
];

const Teams = () => {
  const [selectedLeague, setSelectedLeague] = useState(LEAGUES[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: teams, isLoading } = useTeamsByLeague(selectedLeague.id, selectedLeague.season);

  const filteredTeams = (teams || []).filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <SEOHead
        title="Équipes de Football - Clubs & Effectifs"
        description="Découvrez les clubs de football des 5 grands championnats : effectifs, statistiques et résultats de Premier League, La Liga, Serie A, Bundesliga, Ligue 1."
        keywords="équipes football, clubs foot, effectif psg, effectif real madrid, joueurs premier league"
      />
      <div className="px-2 sm:container py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
            <h1 className="text-xl sm:text-3xl font-black text-foreground">Teams</h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground ml-3 sm:ml-4">Explore top football clubs from around the world</p>
        </div>

        <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4">
          {/* League selector */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
              <span className="text-xs sm:text-sm text-muted-foreground mr-1 sm:mr-2">League:</span>
              {LEAGUES.map((league) => (
                <button
                  key={league.id}
                  onClick={() => setSelectedLeague(league)}
                  className={cn(
                    "rounded-full px-2.5 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap",
                    selectedLeague.id === league.id
                      ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {league.name}
                </button>
              ))}
            </div>
          </div>

          <div className="relative sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search teams..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-lg sm:rounded-xl border-border/50 bg-card text-sm" />
          </div>
        </div>

        {isLoading && (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="gradient-primary p-3 sm:p-4 flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg bg-white/20" />
                  <Skeleton className="h-5 w-32 bg-white/20" />
                </div>
                <div className="p-3 sm:p-4 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team, index) => (
              <Link
                key={team.id}
                to={`/teams/${buildEntitySlug(team.id, team.name)}`}
                className="group rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden transition-all duration-300 hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="gradient-primary p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {team.logo ? (
                      <img src={team.logo} alt={team.name} className="h-10 w-10 sm:h-12 sm:w-12 object-contain bg-white/20 rounded-lg p-1 group-hover:scale-110 transition-transform" />
                    ) : (
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-white/20 flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {team.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm sm:text-lg text-primary-foreground truncate">{team.name}</h3>
                      <p className="text-xs sm:text-sm text-primary-foreground/80 truncate">{team.country}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 sm:p-4">
                  <div className="space-y-2">
                    {team.venue && (
                      <>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">🏟️ {team.venue.name}</p>
                        <p className="text-xs text-muted-foreground">📍 {team.venue.city} • {team.venue.capacity?.toLocaleString()} places</p>
                      </>
                    )}
                    {team.founded && (
                      <p className="text-xs text-muted-foreground">📅 Founded {team.founded}</p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-end">
                    <span className="text-xs sm:text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                      View Details
                      <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && filteredTeams.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No teams found matching your search.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Teams;
