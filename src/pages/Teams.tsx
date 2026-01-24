import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { mockTeams, teamCountries } from "@/data/teamsData";
import { MapPin, Users, Trophy, Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const Teams = () => {
  const [activeCountry, setActiveCountry] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTeams = mockTeams
    .filter(team => activeCountry === "All" || team.country === activeCountry)
    .filter(team => 
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.league.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <Layout>
      <div className="container py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
            <h1 className="text-xl sm:text-3xl font-black text-foreground">Teams</h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground ml-3 sm:ml-4">Explore top football clubs</p>
        </div>

        {/* Filters */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-lg sm:rounded-xl border-border/50 bg-card text-sm"
            />
          </div>

          {/* Country Filter */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {teamCountries.map((country) => (
              <button
                key={country}
                onClick={() => setActiveCountry(country)}
                className={cn(
                  "rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300",
                  activeCountry === country
                    ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/30"
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
              className="group rounded-xl sm:rounded-2xl bg-card border border-border/50 p-3 sm:p-5 transition-all duration-300 hover-lift animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-lg sm:rounded-xl bg-muted/80 text-xl sm:text-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                    {team.logo}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
                      {team.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{team.league}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{team.stadium}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>{team.capacity.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Trophy className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{team.manager}</span>
                </div>
              </div>

              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50 flex items-center justify-between">
                <span className="text-[10px] sm:text-xs text-muted-foreground">{team.founded}</span>
                <span className="text-[10px] sm:text-xs font-medium text-primary">{team.country}</span>
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
