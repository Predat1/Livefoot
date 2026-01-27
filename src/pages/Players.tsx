import { useState } from "react";
import Layout from "@/components/Layout";
import { mockPlayers, positions, countries } from "@/data/playersData";
import { Search, Star, Target, TrendingUp, User, ChevronRight, Shirt, Ruler, Weight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Players = () => {
  const [activePosition, setActivePosition] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"goals" | "rating" | "value" | "assists">("goals");
  const [selectedPlayer, setSelectedPlayer] = useState<typeof mockPlayers[0] | null>(null);

  const filteredPlayers = mockPlayers
    .filter(player => activePosition === "All" || player.position === activePosition)
    .filter(player => 
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

  return (
    <Layout>
      <div className="container py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
            <h1 className="text-xl sm:text-3xl font-black text-foreground">Players</h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground ml-3 sm:ml-4">Discover top footballers and their statistics</p>
        </div>

        {/* Filters */}
        <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search players, teams, countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg sm:rounded-xl border-border/50 bg-card text-sm"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
              <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Sort:</span>
              {[
                { id: "goals", label: "Goals", icon: Target },
                { id: "assists", label: "Assists", icon: TrendingUp },
                { id: "rating", label: "Rating", icon: Star },
                { id: "value", label: "Value", icon: TrendingUp },
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

          {/* Position Filter */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {positions.map((position) => (
              <button
                key={position}
                onClick={() => setActivePosition(position)}
                className={cn(
                  "rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300",
                  activePosition === position
                    ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {position}
              </button>
            ))}
          </div>
        </div>

        {/* Players Grid */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPlayers.map((player, index) => (
            <Dialog key={player.id}>
              <DialogTrigger asChild>
                <div
                  className="group rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden transition-all duration-300 hover-lift animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setSelectedPlayer(player)}
                >
                  {/* Player Header */}
                  <div className="relative gradient-primary p-3 sm:p-4 text-primary-foreground">
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center gap-1">
                      <span className="text-lg sm:text-xl">{player.countryFlag}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-white/20 text-base sm:text-2xl font-black">
                        {player.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="text-right">
                        <div className="text-lg sm:text-2xl font-black">{player.rating}</div>
                        <div className="text-[10px] sm:text-xs opacity-80">Rating</div>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-3">
                      <h3 className="font-bold text-sm sm:text-lg truncate">{player.name}</h3>
                      <p className="text-xs sm:text-sm opacity-90 truncate">{player.team}</p>
                    </div>
                    <Badge className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-white/20 text-primary-foreground text-[10px] sm:text-xs">
                      #{player.jersey}
                    </Badge>
                  </div>

                  {/* Stats */}
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
                        <span className="rounded-full bg-muted px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium text-muted-foreground">
                          {player.position.slice(0, 3)}
                        </span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">{player.age}y</span>
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-primary">{player.marketValue}</span>
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary text-xl font-black text-primary-foreground">
                      {player.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{player.name}</h3>
                      <p className="text-sm text-muted-foreground">{player.team}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  {/* Personal Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                      <User className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Nationality</p>
                        <p className="text-sm font-medium">{player.countryFlag} {player.nationality}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                      <Shirt className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Position</p>
                        <p className="text-sm font-medium">{player.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                      <Ruler className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Height</p>
                        <p className="text-sm font-medium">{player.height}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                      <Weight className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Weight</p>
                        <p className="text-sm font-medium">{player.weight}</p>
                      </div>
                    </div>
                  </div>

                  {/* Season Stats */}
                  <div className="p-4 rounded-xl bg-muted/30">
                    <h4 className="font-bold text-foreground mb-3">Season Statistics</h4>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center">
                        <div className="text-2xl font-black text-primary">{player.goals}</div>
                        <div className="text-xs text-muted-foreground">Goals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-black text-foreground">{player.assists}</div>
                        <div className="text-xs text-muted-foreground">Assists</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-black text-foreground">{player.appearances}</div>
                        <div className="text-xs text-muted-foreground">Apps</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-black text-foreground">{player.minutesPlayed}</div>
                        <div className="text-xs text-muted-foreground">Minutes</div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/30 text-center">
                      <div className="text-xl font-black text-foreground">{player.shotsPerGame}</div>
                      <div className="text-xs text-muted-foreground">Shots/Game</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 text-center">
                      <div className="text-xl font-black text-foreground">{player.passAccuracy}%</div>
                      <div className="text-xs text-muted-foreground">Pass Accuracy</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 text-center">
                      <div className="text-xl font-black text-foreground">{player.duelsWon}%</div>
                      <div className="text-xs text-muted-foreground">Duels Won</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 text-center">
                      <div className="text-xl font-black text-primary">{player.rating}</div>
                      <div className="text-xs text-muted-foreground">Avg Rating</div>
                    </div>
                  </div>

                  {/* Discipline & Value */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="w-4 h-4 rounded bg-yellow-500"></span>
                        <span className="text-sm font-medium">{player.yellowCards}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-4 h-4 rounded bg-destructive"></span>
                        <span className="text-sm font-medium">{player.redCards}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Market Value</p>
                      <p className="text-lg font-black text-primary">{player.marketValue}</p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
