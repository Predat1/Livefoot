import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import Layout from "@/components/Layout";
import { mockPlayers, positions } from "@/data/playersData";
import { Search, Star, Target, TrendingUp, X, GitCompare, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import PlayerAvatar from "@/components/PlayerAvatar";
import CountryFlag from "@/components/CountryFlag";
import TeamLogo from "@/components/TeamLogo";
import { useFavorites } from "@/hooks/useFavorites";

const Players = () => {
  const [activePosition, setActivePosition] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"goals" | "rating" | "value" | "assists">("goals");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  const filteredPlayers = mockPlayers
    .filter((player) => activePosition === "All" || player.position === activePosition)
    .filter((player) =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.country.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "goals") return b.goals - a.goals;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "assists") return b.assists - a.assists;
      return parseInt(b.marketValue.replace(/[^0-9]/g, "")) - parseInt(a.marketValue.replace(/[^0-9]/g, ""));
    });

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 2) return prev; // max 2
      return [...prev, id];
    });
  };

  const comparePlayers = compareIds.map((id) => mockPlayers.find((p) => p.id === id)).filter(Boolean);

  useEffect(() => {
    if (compareIds.length === 2) setCompareOpen(true);
  }, [compareIds]);

  const statRows = [
    { label: "Goals", key: "goals" as const },
    { label: "Assists", key: "assists" as const },
    { label: "Appearances", key: "appearances" as const },
    { label: "Rating", key: "rating" as const },
    { label: "Age", key: "age" as const },
  ];

  return (
    <Layout>
      <SEOHead title="Football Players" description="Discover top footballers, their statistics, goals, assists, ratings and market values." />
      <div className="container py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
            <h1 className="text-xl sm:text-3xl font-black text-foreground">Players</h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground ml-3 sm:ml-4">Discover top footballers and their statistics</p>
        </div>

        <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search players, teams, countries..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-lg sm:rounded-xl border-border/50 bg-card text-sm" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
              <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Sort:</span>
              {[
                { id: "goals", label: "Goals", icon: Target },
                { id: "assists", label: "Assists", icon: TrendingUp },
                { id: "rating", label: "Rating", icon: Star },
                { id: "value", label: "Value", icon: TrendingUp },
              ].map((sort) => (
                <button key={sort.id} onClick={() => setSortBy(sort.id as "goals" | "rating" | "value" | "assists")} className={cn("flex items-center gap-1 rounded-md sm:rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap", sortBy === sort.id ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted")}>
                  <sort.icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{sort.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {positions.map((position) => (
              <button key={position} onClick={() => setActivePosition(position)} className={cn("rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300", activePosition === position ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground")}>
                {position}
              </button>
            ))}
          </div>
          {/* Compare hint */}
          {compareIds.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <GitCompare className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium text-foreground flex-1">
                {compareIds.length === 1 ? "Select 1 more player to compare" : "2 players selected"}
              </span>
              <div className="flex items-center gap-2">
                {compareIds.length === 2 && (
                  <button
                    onClick={() => setCompareOpen(!compareOpen)}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    {compareOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {compareOpen ? "Hide" : "Compare"}
                  </button>
                )}
                <button onClick={() => { setCompareIds([]); setCompareOpen(false); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <X className="h-3 w-3" /> Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Comparison panel */}
        {compareOpen && comparePlayers.length === 2 && (
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden mb-6 animate-fade-in">
            <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-foreground">Player Comparison</h3>
            </div>
            <div className="p-4">
              {/* Player headers */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div />
                {comparePlayers.map((p) => (
                  <div key={p!.id} className="text-center">
                    <PlayerAvatar name={p!.name} photoUrl={p!.photoUrl} size="md" className="mx-auto mb-2" />
                    <p className="font-bold text-sm text-foreground truncate">{p!.name}</p>
                    <p className="text-xs text-muted-foreground">{p!.team}</p>
                  </div>
                ))}
              </div>
              {/* Stats rows */}
              {statRows.map(({ label, key }) => {
                const [a, b] = comparePlayers.map((p) => Number(p![key]));
                const aBetter = a > b;
                const bBetter = b > a;
                return (
                  <div key={key} className="grid grid-cols-3 gap-4 py-2.5 border-t border-border/50 items-center">
                    <span className="text-xs text-muted-foreground text-center">{label}</span>
                    <div className={cn("text-center text-sm font-black rounded-lg py-1", aBetter ? "text-primary bg-primary/10" : "text-foreground")}>{a}</div>
                    <div className={cn("text-center text-sm font-black rounded-lg py-1", bBetter ? "text-primary bg-primary/10" : "text-foreground")}>{b}</div>
                  </div>
                );
              })}
              <div className="grid grid-cols-3 gap-4 py-2.5 border-t border-border/50 items-center">
                <span className="text-xs text-muted-foreground text-center">Market Value</span>
                {comparePlayers.map((p) => (
                  <div key={p!.id} className="text-center text-sm font-bold text-primary">{p!.marketValue}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPlayers.map((player, index) => (
            <div
              key={player.id}
              className="group rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden transition-all duration-300 hover-lift animate-fade-in relative"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Compare toggle */}
              <button
                onClick={() => toggleCompare(player.id)}
                className={cn(
                  "absolute top-2 left-2 z-10 h-6 w-6 rounded-full flex items-center justify-center transition-all",
                  compareIds.includes(player.id)
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-black/30 text-white opacity-0 group-hover:opacity-100",
                  compareIds.length >= 2 && !compareIds.includes(player.id) && "opacity-30 cursor-not-allowed"
                )}
                title={compareIds.includes(player.id) ? "Remove from comparison" : "Add to comparison"}
                disabled={compareIds.length >= 2 && !compareIds.includes(player.id)}
              >
                <GitCompare className="h-3 w-3" />
              </button>

              <Link to={`/players/${player.id}`}>
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
                      <div className="text-[10px] sm:text-xs text-muted-foreground">Goals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base sm:text-xl font-black text-foreground">{player.assists}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">Assists</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base sm:text-xl font-black text-foreground">{player.appearances}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">Apps</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="rounded-full bg-muted px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium text-muted-foreground">{player.position.slice(0, 3)}</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">{player.age}y</span>
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-primary">{player.marketValue}</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
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
