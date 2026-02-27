import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { useTopScorers, useTopAssists, TRENDING_LEAGUE_IDS } from "@/hooks/useApiFootball";
import { Target, TrendingUp, Search, Loader2, Trophy, Shirt, Star, Filter, ArrowUpDown, Users, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import PlayerAvatar from "@/components/PlayerAvatar";
import CountryFlag from "@/components/CountryFlag";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCommunityTopRated } from "@/hooks/useCommunityRatings";

const LEAGUES = [
  { id: "39", name: "Premier League", country: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: "140", name: "La Liga", country: "Spain", flag: "🇪🇸" },
  { id: "135", name: "Serie A", country: "Italy", flag: "🇮🇹" },
  { id: "78", name: "Bundesliga", country: "Germany", flag: "🇩🇪" },
  { id: "61", name: "Ligue 1", country: "France", flag: "🇫🇷" },
  { id: "2", name: "Champions League", country: "Europe", flag: "🏆" },
  { id: "3", name: "Europa League", country: "Europe", flag: "🏆" },
  { id: "94", name: "Primeira Liga", country: "Portugal", flag: "🇵🇹" },
  { id: "88", name: "Eredivisie", country: "Netherlands", flag: "🇳🇱" },
  { id: "262", name: "Liga MX", country: "Mexico", flag: "🇲🇽" },
  { id: "71", name: "Brasileirão", country: "Brazil", flag: "🇧🇷" },
  { id: "253", name: "MLS", country: "USA", flag: "🇺🇸" },
  { id: "307", name: "Saudi Pro", country: "Saudi Arabia", flag: "🇸🇦" },
  { id: "203", name: "Süper Lig", country: "Turkey", flag: "🇹🇷" },
  { id: "128", name: "Liga Profesional", country: "Argentina", flag: "🇦🇷" },
  { id: "144", name: "Jupiler Pro", country: "Belgium", flag: "🇧🇪" },
  { id: "113", name: "Allsvenskan", country: "Sweden", flag: "🇸🇪" },
  { id: "98", name: "J1 League", country: "Japan", flag: "🇯🇵" },
  { id: "233", name: "Egyptian PL", country: "Egypt", flag: "🇪🇬" },
];

const SEASON = "2024";

const POSITIONS = ["All", "Attacker", "Midfielder", "Defender", "Goalkeeper"];

const Rankings = () => {
  const [selectedLeague, setSelectedLeague] = useState("39");
  const [activeTab, setActiveTab] = useState<"goals" | "assists" | "community">("goals");
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"goals" | "assists" | "rating" | "appearances">("goals");
  const [minApps, setMinApps] = useState(0);
  const [communityPeriod, setCommunityPeriod] = useState<"week" | "month" | "all">("week");

  const { data: scorers, isLoading: loadingScorers } = useTopScorers(selectedLeague, SEASON);
  const { data: assisters, isLoading: loadingAssists } = useTopAssists(selectedLeague, SEASON);
  const { data: communityRatings, isLoading: loadingCommunity } = useCommunityTopRated(communityPeriod);

  const currentLeague = LEAGUES.find(l => l.id === selectedLeague);
  const isLoading = activeTab === "goals" ? loadingScorers : activeTab === "assists" ? loadingAssists : loadingCommunity;
  const rawPlayers = activeTab === "community" ? [] : activeTab === "goals" ? (scorers || []) : (assisters || []);

  const filteredPlayers = useMemo(() => {
    return rawPlayers
      .filter(p => {
        if (positionFilter !== "All" && p.position !== positionFilter) return false;
        if (p.appearances < minApps) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q) || p.country.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "goals") return b.goals - a.goals;
        if (sortBy === "assists") return b.assists - a.assists;
        if (sortBy === "rating") return b.rating - a.rating;
        return b.appearances - a.appearances;
      });
  }, [rawPlayers, positionFilter, minApps, searchQuery, sortBy]);

  return (
    <Layout>
      <SEOHead
        title={`Classement ${activeTab === "goals" ? "Buteurs" : "Passeurs"} - ${currentLeague?.name || "Football"}`}
        description={`Classement en temps réel des meilleurs ${activeTab === "goals" ? "buteurs" : "passeurs"} de ${currentLeague?.name}. Stats détaillées.`}
      />
      <div className="container py-4 sm:py-8">
        {/* Title */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-8 w-1 rounded-full gradient-primary" />
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="text-xl sm:text-3xl font-black text-foreground">Classements</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground ml-4">Meilleurs buteurs & passeurs en temps réel</p>
        </div>

        {/* League Selector — hidden for community tab */}
        {activeTab !== "community" && (
          <div className="mb-5 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1.5 pb-1">
              {LEAGUES.map((league) => (
                <button
                  key={league.id}
                  onClick={() => { setSelectedLeague(league.id); setSearchQuery(""); setPositionFilter("All"); }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
                    selectedLeague === league.id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span>{league.flag}</span>
                  <span className="hidden sm:inline">{league.name}</span>
                  <span className="sm:hidden">{league.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Goals / Assists / Community Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); if (v !== "community") setSortBy(v === "goals" ? "goals" : "assists"); }} className="mb-5">
          <TabsList className="w-full grid grid-cols-3 bg-card border border-border/50 rounded-xl p-1">
            <TabsTrigger value="goals" className="rounded-lg gap-1.5 text-xs sm:text-sm font-bold">
              <Target className="h-4 w-4" /> Buteurs
            </TabsTrigger>
            <TabsTrigger value="assists" className="rounded-lg gap-1.5 text-xs sm:text-sm font-bold">
              <TrendingUp className="h-4 w-4" /> Passeurs
            </TabsTrigger>
            <TabsTrigger value="community" className="rounded-lg gap-1.5 text-xs sm:text-sm font-bold">
              <Users className="h-4 w-4" /> Communauté
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Community Period Selector */}
        {activeTab === "community" && (
          <div className="mb-5 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Période :</span>
            {([["week", "7 jours"], ["month", "30 jours"], ["all", "Tout"]] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setCommunityPeriod(k)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  communityPeriod === k ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Filters — hidden for community tab */}
        {activeTab !== "community" && (
          <div className="mb-5 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un joueur, équipe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl border-border/50 bg-card text-sm"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                {POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPositionFilter(pos)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap",
                      positionFilter === pos
                        ? "gradient-primary text-primary-foreground shadow-sm"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {pos === "All" ? "Tous" : pos === "Attacker" ? "Attaquant" : pos === "Midfielder" ? "Milieu" : pos === "Defender" ? "Défenseur" : "Gardien"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Trier:</span>
                {[
                  { id: "goals", label: "Buts" },
                  { id: "assists", label: "Passes" },
                  { id: "rating", label: "Note" },
                  { id: "appearances", label: "Matchs" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSortBy(s.id as any)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                      sortBy === s.id ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Shirt className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Min matchs:</span>
                {[0, 5, 10, 15].map((n) => (
                  <button
                    key={n}
                    onClick={() => setMinApps(n)}
                    className={cn(
                      "rounded-md px-2 py-1 text-xs font-medium transition-all",
                      minApps === n ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {n === 0 ? "Tous" : `${n}+`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-2">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-12 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Community Results */}
        {!isLoading && activeTab === "community" && (
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-4 py-3 border-b border-border flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-foreground text-sm">
                Meilleurs joueurs notés par la communauté
              </h2>
              <span className="ml-auto text-xs text-muted-foreground">
                {communityRatings?.length || 0} joueurs
              </span>
            </div>

            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-[3rem_1fr_auto_auto_auto] gap-2 px-4 py-2.5 bg-muted/20 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="text-center">#</span>
              <span>Joueur</span>
              <span className="w-20 text-center">Note moy.</span>
              <span className="w-16 text-center">Votes</span>
              <span className="w-16 text-center">Matchs</span>
            </div>

            {!communityRatings || communityRatings.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm space-y-2">
                <Users className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p>Aucune note communautaire pour cette période</p>
                <p className="text-xs">Notez des joueurs sur les pages de match pour alimenter ce classement !</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {communityRatings.map((player, index) => {
                  const rank = index + 1;
                  const isTop3 = rank <= 3;
                  const ratingColor = player.avg_rating >= 8 ? "text-primary" : player.avg_rating >= 7 ? "text-foreground" : "text-muted-foreground";

                  return (
                    <Link
                      key={player.player_id}
                      to={`/players/${player.player_id}`}
                      className={cn(
                        "flex items-center gap-2 sm:grid sm:grid-cols-[3rem_1fr_auto_auto_auto] sm:gap-2 px-3 sm:px-4 py-3 hover:bg-muted/30 transition-colors",
                        isTop3 && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-center w-8 sm:w-auto flex-shrink-0">
                        <span className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black",
                          rank === 1 ? "bg-primary text-primary-foreground" :
                          rank === 2 ? "bg-primary/20 text-primary" :
                          rank === 3 ? "bg-primary/10 text-primary" :
                          "text-muted-foreground"
                        )}>
                          {rank}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <PlayerAvatar name={player.player_name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{player.player_name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:contents">
                        <div className="sm:w-20 text-center">
                          <span className={cn("text-sm font-black inline-flex items-center gap-1", ratingColor)}>
                            <Star className="h-3 w-3 fill-current" />
                            {player.avg_rating}
                          </span>
                        </div>
                        <div className="sm:w-16 text-center">
                          <span className="text-xs text-muted-foreground">{player.total_ratings}</span>
                        </div>
                        <div className="hidden sm:block sm:w-16 text-center">
                          <span className="text-xs text-muted-foreground">{player.fixture_count}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Classement (buts/passes) */}
        {!isLoading && activeTab !== "community" && (
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-4 py-3 border-b border-border flex items-center gap-2">
              {currentLeague && <span className="text-lg">{currentLeague.flag}</span>}
              <h2 className="font-bold text-foreground text-sm">
                {currentLeague?.name} — {activeTab === "goals" ? "Meilleurs Buteurs" : "Meilleurs Passeurs"}
              </h2>
              <span className="ml-auto text-xs text-muted-foreground">{filteredPlayers.length} joueurs</span>
            </div>

            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-[3rem_1fr_auto_auto_auto_auto_auto] gap-2 px-4 py-2.5 bg-muted/20 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="text-center">#</span>
              <span>Joueur</span>
              <span className="w-14 text-center">Matchs</span>
              <span className="w-14 text-center">Buts</span>
              <span className="w-14 text-center">Passes</span>
              <span className="w-14 text-center">Note</span>
              <span className="w-16 text-center">Buts/90</span>
            </div>

            {filteredPlayers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">Aucun joueur trouvé</div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredPlayers.map((player, index) => {
                  const rank = index + 1;
                  const goalsP90 = player.minutesPlayed > 0 ? Math.round((player.goals / (player.minutesPlayed / 90)) * 100) / 100 : 0;
                  const isTop3 = rank <= 3;

                  return (
                    <Link
                      key={player.id}
                      to={`/players/${player.id}`}
                      className={cn(
                        "flex items-center gap-2 sm:grid sm:grid-cols-[3rem_1fr_auto_auto_auto_auto_auto] sm:gap-2 px-3 sm:px-4 py-3 hover:bg-muted/30 transition-colors",
                        isTop3 && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-center w-8 sm:w-auto flex-shrink-0">
                        <span className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black",
                          rank === 1 ? "bg-primary text-primary-foreground" :
                          rank === 2 ? "bg-primary/20 text-primary" :
                          rank === 3 ? "bg-primary/10 text-primary" :
                          "text-muted-foreground"
                        )}>
                          {rank}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <PlayerAvatar name={player.name} photoUrl={player.photoUrl} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{player.name}</p>
                          <div className="flex items-center gap-1.5">
                            {player.teamLogo && <img src={player.teamLogo} alt="" className="h-3.5 w-3.5 object-contain" />}
                            <span className="text-xs text-muted-foreground truncate">{player.team}</span>
                            <CountryFlag country={player.country} size="sm" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:contents">
                        <div className="sm:w-14 text-center">
                          <span className="text-xs text-muted-foreground sm:text-sm">{player.appearances}</span>
                        </div>
                        <div className="sm:w-14 text-center">
                          <span className={cn("text-sm font-black", activeTab === "goals" ? "text-primary" : "text-foreground")}>
                            {player.goals}
                          </span>
                        </div>
                        <div className="sm:w-14 text-center">
                          <span className={cn("text-sm font-bold", activeTab === "assists" ? "text-primary" : "text-foreground")}>
                            {player.assists}
                          </span>
                        </div>
                        <div className="hidden sm:block sm:w-14 text-center">
                          <span className={cn(
                            "inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-black",
                            player.rating >= 8 ? "bg-primary/15 text-primary" :
                            player.rating >= 7 ? "bg-muted text-foreground" :
                            "text-muted-foreground"
                          )}>
                            {player.rating > 0 ? player.rating.toFixed(1) : "-"}
                          </span>
                        </div>
                        <div className="hidden sm:block sm:w-16 text-center">
                          <span className="text-xs text-muted-foreground">{goalsP90}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Rankings;
