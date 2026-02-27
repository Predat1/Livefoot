import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/Layout";
import { positions } from "@/data/playersData";
import { useTopScorers } from "@/hooks/useApiFootball";
import { Search, Star, Target, TrendingUp, X, GitCompare, ChevronDown, ChevronUp, Trophy, Activity, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { buildEntitySlug } from "@/utils/slugify";
import { Badge } from "@/components/ui/badge";
import PlayerAvatar from "@/components/PlayerAvatar";
import CountryFlag from "@/components/CountryFlag";
import TeamLogo from "@/components/TeamLogo";
import { useFavorites } from "@/hooks/useFavorites";
import { Skeleton } from "@/components/ui/skeleton";

const STAT_ROWS = [
  { label: "⚽ Buts",          key: "goals"         as const, unit: "" },
  { label: "🅰️ Passes déc.",   key: "assists"       as const, unit: "" },
  { label: "🎮 Matchs",        key: "appearances"   as const, unit: "" },
  { label: "⭐ Note",          key: "rating"        as const, unit: "" },
  { label: "🎯 Tirs/match",    key: "shotsPerGame"  as const, unit: "" },
  { label: "🎯 Précision passe",key: "passAccuracy"  as const, unit: "%" },
  { label: "💪 Duels gagnés",  key: "duelsWon"      as const, unit: "" },
  { label: "🟨 Cartons J.",    key: "yellowCards"   as const, unit: "", lowerIsBetter: true },
  { label: "🔴 Cartons R.",    key: "redCards"      as const, unit: "", lowerIsBetter: true },
  { label: "🗓️ Âge",           key: "age"           as const, unit: "", lowerIsBetter: true },
];

const LEAGUES = [
  { id: "39", name: "Premier League", country: "England" },
  { id: "140", name: "La Liga", country: "Spain" },
  { id: "135", name: "Serie A", country: "Italy" },
  { id: "78", name: "Bundesliga", country: "Germany" },
  { id: "61", name: "Ligue 1", country: "France" },
];

const currentSeason = "2024";

const Players = () => {
  const [activePosition, setActivePosition] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"goals" | "rating" | "value" | "assists">("goals");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState("39");
  const { isFavorite, toggleFavorite } = useFavorites();

  const { data: apiPlayers, isLoading: isLoadingApi } = useTopScorers(selectedLeague, currentSeason);

  const allPlayers = apiPlayers || [];

  const filteredPlayers = useMemo(() => allPlayers
    .filter((p) => activePosition === "All" || p.position === activePosition)
    .filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.country.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "goals")   return b.goals - a.goals;
      if (sortBy === "rating")  return b.rating - a.rating;
      if (sortBy === "assists") return b.assists - a.assists;
      return parseInt(String(b.marketValue).replace(/[^0-9]/g, "") || "0") - parseInt(String(a.marketValue).replace(/[^0-9]/g, "") || "0");
    }), [allPlayers, activePosition, searchQuery, sortBy]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const comparePlayers = compareIds.map((id) => allPlayers.find((p) => p.id === id)).filter(Boolean) as typeof allPlayers;

  useEffect(() => {
    if (compareIds.length === 2) setCompareOpen(true);
  }, [compareIds]);

  // Winner summary per player (count how many stats each player wins)
  const winCounts = comparePlayers.length === 2
    ? STAT_ROWS.reduce<[number, number]>((acc, { key, lowerIsBetter }) => {
        const a = Number(comparePlayers[0][key]);
        const b = Number(comparePlayers[1][key]);
        if (a === b) return acc;
        const aWins = lowerIsBetter ? a < b : a > b;
        return aWins ? [acc[0] + 1, acc[1]] : [acc[0], acc[1] + 1];
      }, [0, 0])
    : [0, 0];

  return (
    <Layout>
      <SEOHead
        title="Joueurs de Football - Stats & Classements"
        description="Meilleurs buteurs, passeurs et joueurs les mieux notés des 5 grands championnats. Statistiques détaillées, comparaisons et notes communautaires."
        keywords="meilleur buteur, joueurs football, statistiques joueurs, buteur ligue 1, passeur premier league, notes joueurs"
      />
      <div className="px-2 sm:container py-4 sm:py-8">
        {/* Title */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
            <h1 className="text-xl sm:text-3xl font-black text-foreground">Players</h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground ml-3 sm:ml-4">Discover top footballers and their statistics</p>
        </div>

        {/* Filters */}
        <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
          {/* League selector */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-1">
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">League:</span>
            {LEAGUES.map((league) => (
              <button
                key={league.id}
                onClick={() => { setSelectedLeague(league.id); setCompareIds([]); setCompareOpen(false); }}
                className={cn(
                  "flex items-center gap-1 rounded-md sm:rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
                  selectedLeague === league.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {league.name}
              </button>
            ))}
          </div>

          {isLoadingApi && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading players...
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search players, teams, countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg sm:rounded-xl border-border/50 bg-card text-sm"
              />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
              <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Sort:</span>
              {[
                { id: "goals",   label: "Goals",   icon: Target },
                { id: "assists", label: "Assists",  icon: TrendingUp },
                { id: "rating",  label: "Rating",   icon: Star },
                { id: "value",   label: "Value",    icon: TrendingUp },
              ].map((sort) => (
                <button
                  key={sort.id}
                  onClick={() => setSortBy(sort.id as "goals" | "rating" | "value" | "assists")}
                  className={cn(
                    "flex items-center gap-1 rounded-md sm:rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
                    sortBy === sort.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <sort.icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{sort.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Position filters */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {positions.map((pos) => (
              <button
                key={pos}
                onClick={() => setActivePosition(pos)}
                className={cn(
                  "rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300",
                  activePosition === pos
                    ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {pos}
              </button>
            ))}
          </div>

          {/* Compare hint bar */}
          {compareIds.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <GitCompare className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <span className="text-sm font-medium text-foreground">
                  {compareIds.length === 1 ? "Sélectionne 1 joueur de plus pour comparer" : "2 joueurs sélectionnés"}
                </span>
                {comparePlayers.map((p) => (
                  <span key={p.id} className="flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                    {p.name.split(" ").slice(-1)[0]}
                    <button onClick={() => toggleCompare(p.id)} className="hover:text-destructive transition-colors">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {compareIds.length === 2 && (
                  <button
                    onClick={() => setCompareOpen(!compareOpen)}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    {compareOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {compareOpen ? "Masquer" : "Comparer"}
                  </button>
                )}
                <button
                  onClick={() => { setCompareIds([]); setCompareOpen(false); }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Effacer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== COMPARISON PANEL ===== */}
        {compareOpen && comparePlayers.length === 2 && (
          <div className="rounded-2xl bg-card border border-primary/20 overflow-hidden mb-6 shadow-lg shadow-primary/5">
            {/* Header */}
            <div className="bg-primary/10 px-5 py-3 border-b border-primary/20 flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-foreground">Comparaison de joueurs</h3>
              <button
                onClick={() => setCompareOpen(false)}
                className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {/* Player headers */}
              <div className="grid grid-cols-[1fr_2fr_2fr] gap-3 sm:gap-6 mb-4">
                <div />
                {comparePlayers.map((p, idx) => (
                  <Link key={p.id} to={`/players/${buildEntitySlug(p.id, p.name)}`} className="text-center group">
                    <div className="relative inline-block mb-2">
                      <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size="md" className="mx-auto" />
                      {/* Winner crown if more wins */}
                      {winCounts[idx] > winCounts[1 - idx] && (
                        <span className="absolute -top-2 -right-2 text-lg">👑</span>
                      )}
                    </div>
                    <p className="font-black text-sm text-foreground truncate group-hover:text-primary transition-colors">{p.name}</p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <TeamLogo teamName={p.team} size="xs" className="!h-3.5 !w-3.5" />
                      <p className="text-xs text-muted-foreground truncate">{p.team}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <CountryFlag country={p.country} size="sm" />
                      <span className="text-xs text-muted-foreground">{p.position}</span>
                    </div>
                    {/* Win count badge */}
                    <div className={cn(
                      "mt-2 mx-auto w-fit px-3 py-1 rounded-full text-xs font-bold",
                      winCounts[idx] > winCounts[1 - idx]
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {winCounts[idx]} / {STAT_ROWS.length} stats
                    </div>
                    <div className="mt-1 font-bold text-sm text-primary">{p.marketValue}</div>
                  </Link>
                ))}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  Statistiques
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Stats rows */}
              <div className="space-y-1">
                {STAT_ROWS.map(({ label, key, unit, lowerIsBetter }) => {
                  const a = Number(comparePlayers[0][key]);
                  const b = Number(comparePlayers[1][key]);
                  const aWins = lowerIsBetter ? a < b : a > b;
                  const bWins = lowerIsBetter ? b < a : b > a;
                  const maxVal = Math.max(a, b) || 1;

                  return (
                    <div key={key} className="grid grid-cols-[1fr_2fr_2fr] gap-3 sm:gap-6 py-2 border-t border-border/40 items-center">
                      {/* Stat label */}
                      <span className="text-[11px] sm:text-xs text-muted-foreground text-right pr-2">{label}</span>

                      {/* Player A */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-sm font-black",
                            aWins ? "text-primary" : "text-foreground"
                          )}>
                            {a}{unit}
                          </span>
                          {aWins && <Trophy className="h-3 w-3 text-primary opacity-70" />}
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", aWins ? "bg-primary" : "bg-muted-foreground/30")}
                            style={{ width: `${lowerIsBetter ? (1 - a / maxVal) * 100 : (a / maxVal) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Player B */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          {bWins && <Trophy className="h-3 w-3 text-primary opacity-70" />}
                          <span className={cn(
                            "text-sm font-black ml-auto",
                            bWins ? "text-primary" : "text-foreground"
                          )}>
                            {b}{unit}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", bWins ? "bg-primary" : "bg-muted-foreground/30")}
                            style={{ width: `${lowerIsBetter ? (1 - b / maxVal) * 100 : (b / maxVal) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===== PLAYER GRID ===== */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPlayers.map((player, index) => {
            const isSelected = compareIds.includes(player.id);
            const isDisabled = compareIds.length >= 2 && !isSelected;

            return (
              <div
                key={player.id}
                className={cn(
                  "group rounded-xl sm:rounded-2xl bg-card border overflow-hidden transition-all duration-300 hover-lift animate-fade-in relative",
                  isSelected ? "border-primary shadow-lg shadow-primary/20" : "border-border/50"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Compare button — always visible on mobile, hover on desktop */}
                <button
                  onClick={() => toggleCompare(player.id)}
                  disabled={isDisabled}
                  title={isSelected ? "Retirer de la comparaison" : "Ajouter à la comparaison"}
                  className={cn(
                    "absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold transition-all shadow-sm",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-foreground/40 text-background sm:opacity-0 sm:group-hover:opacity-100",
                    isDisabled && "opacity-30 cursor-not-allowed"
                  )}
                >
                  <GitCompare className="h-2.5 w-2.5" />
                  <span className="hidden sm:inline">{isSelected ? "Sélectionné" : "Comparer"}</span>
                </button>

                <Link to={`/players/${buildEntitySlug(player.id, player.name)}`}>
                  <div className="relative gradient-primary p-3 sm:p-4 text-primary-foreground">
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center gap-1">
                      <CountryFlag country={player.country} size="sm" />
                    </div>
                    <div className="flex items-center justify-between">
                      <PlayerAvatar name={player.name} photoUrl={player.photoUrl} size="md" className="!shadow-none !bg-white/20" />
                      <div className="text-right">
                        <div className="text-lg sm:text-2xl font-black">{player.rating}</div>
                        <div className="text-[10px] sm:text-xs opacity-80">Rating</div>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-3">
                      <h3 className="font-bold text-sm sm:text-lg truncate">{player.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <TeamLogo teamName={player.team} size="xs" className="!bg-white/20 !rounded !h-4 !w-4" />
                        <p className="text-xs sm:text-sm opacity-90 truncate">{player.team}</p>
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 flex items-center gap-1">
                      <button
                        onClick={(e) => { e.preventDefault(); toggleFavorite("players", player.id, player.name); }}
                        className="p-1 rounded-full hover:bg-white/20 transition-colors"
                      >
                        <Star className={cn("h-3.5 w-3.5", isFavorite("players", player.id) ? "fill-yellow-400 text-yellow-400" : "text-white/60")} />
                      </button>
                      <Badge className="bg-white/20 text-primary-foreground text-[10px] sm:text-xs">#{player.jersey}</Badge>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4">
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="text-center">
                        <div className="text-base sm:text-xl font-black text-foreground">{player.goals}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">Buts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base sm:text-xl font-black text-foreground">{player.assists}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">Passes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base sm:text-xl font-black text-foreground">{player.appearances}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">Matchs</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-border/50">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="rounded-full bg-muted px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium text-muted-foreground">
                          {player.position.slice(0, 3)}
                        </span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">{player.age}y</span>
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-primary">{player.marketValue}</span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {filteredPlayers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No players found matching your search.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Players;
