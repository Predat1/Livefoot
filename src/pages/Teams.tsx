import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { mockTeams, teamCountries, teamLeagues } from "@/data/teamsData";
import { MapPin, Users, Trophy, Search, ChevronRight, Calendar, TrendingUp, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const Teams = () => {
  const [activeCountry, setActiveCountry] = useState("All");
  const [activeLeague, setActiveLeague] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTeams = mockTeams
    .filter(team => activeCountry === "All" || team.country === activeCountry)
    .filter(team => activeLeague === "All" || team.league === activeLeague)
    .filter(team => 
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.league.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.manager.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getResultColor = (result: string) => {
    switch (result) {
      case "W":
        return "bg-primary text-primary-foreground";
      case "D":
        return "bg-muted text-muted-foreground";
      case "L":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Layout>
      <div className="container py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
            <h1 className="text-xl sm:text-3xl font-black text-foreground">Teams</h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground ml-3 sm:ml-4">Explore top football clubs from around the world</p>
        </div>

        {/* Filters */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search teams, leagues, managers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-lg sm:rounded-xl border-border/50 bg-card text-sm"
            />
          </div>

          {/* League Filter */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
              <span className="text-xs sm:text-sm text-muted-foreground mr-1 sm:mr-2">League:</span>
              {teamLeagues.map((league) => (
                <button
                  key={league}
                  onClick={() => setActiveLeague(league)}
                  className={cn(
                    "rounded-full px-2.5 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap",
                    activeLeague === league
                      ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {league}
                </button>
              ))}
            </div>
          </div>

          {/* Country Filter */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground mr-1 sm:mr-2">Country:</span>
            {teamCountries.map((country) => (
              <button
                key={country}
                onClick={() => setActiveCountry(country)}
                className={cn(
                  "rounded-full px-2.5 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300",
                  activeCountry === country
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {country}
              </button>
            ))}
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team, index) => (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className="group rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden transition-all duration-300 hover-lift animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Team Header */}
              <div className="gradient-primary p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg sm:rounded-xl bg-white/20 text-2xl sm:text-3xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                      {team.logo}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm sm:text-lg text-primary-foreground truncate">
                        {team.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-primary-foreground/80 truncate">{team.league}</p>
                    </div>
                  </div>
                  <Badge className="bg-white/20 text-primary-foreground text-[10px] sm:text-xs">
                    #{team.currentPosition}
                  </Badge>
                </div>
              </div>

              {/* Team Body */}
              <div className="p-3 sm:p-4">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-primary" />
                    <span className="truncate">{team.stadium}</span>
                    <span className="text-[10px] sm:text-xs">({team.capacity.toLocaleString()})</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-primary" />
                    <span className="truncate">{team.manager}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-primary" />
                    <span>Founded {team.founded}</span>
                  </div>
                </div>

                {/* Titles */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50 grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                      <span className="text-sm sm:text-lg font-black text-foreground">{team.titles.league}</span>
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">League</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-500" />
                      <span className="text-sm sm:text-lg font-black text-foreground">{team.titles.cups}</span>
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Cups</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500" />
                      <span className="text-sm sm:text-lg font-black text-foreground">{team.titles.european}</span>
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">European</span>
                  </div>
                </div>

                {/* Last & Next Match */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50 space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Last match:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{team.lastMatch.opponent}</span>
                      <Badge className={cn("text-[10px]", getResultColor(team.lastMatch.result))}>
                        {team.lastMatch.result} {team.lastMatch.score}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Next match:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{team.nextMatch.opponent}</span>
                      <span className="text-[10px] text-muted-foreground">{team.nextMatch.time}</span>
                    </div>
                  </div>
                </div>

                {/* View Details */}
                <div className="mt-3 sm:mt-4 flex items-center justify-end">
                  <span className="text-xs sm:text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Details
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No teams found matching your search.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Teams;
