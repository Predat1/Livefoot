import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Search as SearchIcon, Trophy, Users, User, Newspaper } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearch, SearchResult } from "@/hooks/useSearch";
import TeamLogo from "@/components/TeamLogo";
import PlayerAvatar from "@/components/PlayerAvatar";
import LeagueLogo from "@/components/LeagueLogo";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const { query, setQuery, results } = useSearch();

  useState(() => {
    if (initialQuery) setQuery(initialQuery);
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "team": return <Users className="h-5 w-5 text-primary" />;
      case "player": return <User className="h-5 w-5 text-primary" />;
      case "competition": return <Trophy className="h-5 w-5 text-primary" />;
      case "news": return <Newspaper className="h-5 w-5 text-primary" />;
      default: return null;
    }
  };

  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  const typeLabels: Record<string, string> = {
    team: "Teams",
    player: "Players",
    competition: "Competitions",
    news: "News",
  };

  return (
    <Layout>
      <div className="container py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
            <h1 className="text-xl sm:text-3xl font-black text-foreground">Search</h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground ml-3 sm:ml-4">Find teams, players, competitions, and news</p>
        </div>

        {/* Search Input */}
        <div className="mb-8 relative max-w-2xl mx-auto">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teams, players, competitions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 h-12 sm:h-14 rounded-2xl border-border/50 bg-card text-base sm:text-lg"
            autoFocus
          />
        </div>

        {/* Results */}
        {query.length >= 2 ? (
          results.length > 0 ? (
            <div className="max-w-2xl mx-auto space-y-6">
              {Object.entries(groupedResults).map(([type, items]) => (
                <div key={type} className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                  <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                    {getIcon(type)}
                    <h3 className="font-bold text-foreground">{typeLabels[type]} ({items.length})</h3>
                  </div>
                  <div className="divide-y divide-border/50">
                    {items.map((r) => (
                      <Link
                        key={`${r.type}-${r.id}`}
                        to={r.href}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
                      >
                        {r.type === "team" && <TeamLogo teamName={r.name} size="sm" />}
                        {r.type === "player" && <PlayerAvatar name={r.name} size="sm" />}
                        {r.type === "competition" && <LeagueLogo leagueId={r.id} size="sm" />}
                        {r.type === "news" && <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Newspaper className="h-4 w-4 text-primary" /></div>}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">{r.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <SearchIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No results found for "{query}"</p>
            </div>
          )
        ) : (
          <div className="text-center py-16">
            <SearchIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Type at least 2 characters to search</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchPage;
