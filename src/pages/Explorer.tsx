import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import CountryFlag from "@/components/CountryFlag";
import { Trophy, Users, Star, Search, Globe, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { buildEntitySlug } from "@/utils/slugify";
import { useQuery } from "@tanstack/react-query";
import { useTrendingLeagues, TRENDING_LEAGUE_IDS } from "@/hooks/useApiFootball";
import { getTeams, getTopScorers } from "@/services/apiFootball";
import { useFavorites } from "@/hooks/useFavorites";

type Tab = "all" | "competitions" | "teams" | "players";

// Only fetch top 5 leagues for teams/players to reduce costs
const TOP_LEAGUE_IDS = TRENDING_LEAGUE_IDS.slice(0, 5);

const Explorer = () => {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "Tout", icon: <Globe className="h-4 w-4" /> },
    { key: "competitions", label: "Compétitions", icon: <Trophy className="h-4 w-4" /> },
    { key: "teams", label: "Équipes", icon: <Users className="h-4 w-4" /> },
    { key: "players", label: "Joueurs", icon: <Star className="h-4 w-4" /> },
  ];

  const { data: leagues = [], isLoading: leaguesLoading } = useTrendingLeagues();

  // Single query for all teams across top leagues — only when teams tab is active
  const shouldFetchTeams = activeTab === "all" || activeTab === "teams";
  const { data: allTeams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["explorer-teams", TOP_LEAGUE_IDS.join(",")],
    queryFn: async () => {
      const results: { id: string; name: string; logo: string; country: string; league: string; venue: string | null }[] = [];
      for (const leagueId of TOP_LEAGUE_IDS) {
        const league = leagues.find((l) => l.id === leagueId);
        const season = league?.season || "2024";
        try {
          const res = await getTeams({ league: leagueId, season });
          const leagueName = league?.name || "";
          for (const item of (res.response || []) as any[]) {
            results.push({
              id: String(item.team.id),
              name: item.team.name,
              logo: item.team.logo,
              country: item.team.country || league?.country || "",
              league: leagueName,
              venue: item.venue?.name || null,
            });
          }
        } catch { /* skip failed league */ }
      }
      return results;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: shouldFetchTeams && leagues.length > 0,
  });

  // Single query for all scorers — only when players tab is active
  const shouldFetchPlayers = activeTab === "all" || activeTab === "players";
  const { data: allPlayers = [], isLoading: playersLoading } = useQuery({
    queryKey: ["explorer-scorers", TOP_LEAGUE_IDS.join(",")],
    queryFn: async () => {
      const players: { id: string; name: string; team: string; teamLogo: string; country: string; position: string; goals: number; assists: number; rating: number; jersey: number; photoUrl: string }[] = [];
      const seen = new Set<string>();
      for (const leagueId of TOP_LEAGUE_IDS) {
        const league = leagues.find((l) => l.id === leagueId);
        const season = league?.season || "2024";
        try {
          const res = await getTopScorers(leagueId, season);
          for (const item of (res.response || []) as any[]) {
            const p = item.player;
            const s = item.statistics[0];
            const id = String(p.id);
            if (seen.has(id)) continue;
            seen.add(id);
            players.push({
              id,
              name: p.name,
              team: s.team.name,
              teamLogo: s.team.logo || "",
              country: p.nationality || "",
              position: s.games.position || "Forward",
              goals: s.goals.total || 0,
              assists: s.goals.assists || 0,
              rating: parseFloat(s.games.rating) || 0,
              jersey: s.games.number || 0,
              photoUrl: p.photo || "",
            });
          }
        } catch { /* skip */ }
      }
      return players;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: shouldFetchPlayers && leagues.length > 0,
  });

  const isLoading = leaguesLoading;

  const competitions = useMemo(() => {
    return leagues.map((l) => ({
      id: l.id, name: l.name, logo: l.logo, country: l.country,
      countryFlag: l.countryFlag, season: l.season, type: l.type,
    }));
  }, [leagues]);

  // Filters
  const filteredCompetitions = useMemo(() => {
    return competitions.filter((c) => {
      const matchCountry = !selectedCountry || c.country === selectedCountry;
      const matchSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCountry && matchSearch;
    });
  }, [competitions, selectedCountry, searchQuery]);

  const filteredTeams = useMemo(() => {
    return allTeams.filter((t) => {
      const matchCountry = !selectedCountry || t.country === selectedCountry;
      const matchSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCountry && matchSearch;
    });
  }, [allTeams, selectedCountry, searchQuery]);

  const filteredPlayers = useMemo(() => {
    return allPlayers.filter((p) => {
      const matchCountry = !selectedCountry || p.country === selectedCountry;
      const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCountry && matchSearch;
    });
  }, [allPlayers, selectedCountry, searchQuery]);

  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    competitions.forEach((c) => set.add(c.country));
    allTeams.forEach((t) => set.add(t.country));
    return Array.from(set).filter(Boolean).sort();
  }, [competitions, allTeams]);

  const groupByCountry = <T extends { country: string }>(items: T[]) => {
    const grouped: Record<string, T[]> = {};
    items.forEach((item) => {
      const key = item.country || "Autre";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return grouped;
  };

  const competitionsByCountry = groupByCountry(filteredCompetitions);
  const teamsByCountry = groupByCountry(filteredTeams);
  const playersByCountry = groupByCountry(filteredPlayers);

  const hasResults = filteredCompetitions.length > 0 || filteredTeams.length > 0 || filteredPlayers.length > 0;

  const renderSection = (
    title: string, icon: React.ReactNode, groupedData: Record<string, any[]>,
    renderItem: (item: any) => React.ReactNode, type: string, sectionLoading: boolean
  ) => {
    const entries = Object.entries(groupedData).sort(([a], [b]) => a.localeCompare(b));
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {entries.reduce((sum, [, items]) => sum + items.length, 0)}
          </span>
        </div>
        {sectionLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Aucun résultat</p>
        ) : (
          entries.map(([country, items]) => (
            <div key={`${type}-${country}`} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                <CountryFlag country={country} size="sm" />
                <span className="text-sm font-bold text-foreground">{country}</span>
                <span className="text-xs text-muted-foreground ml-auto">{items.length}</span>
              </div>
              <div className="divide-y divide-border">{items.map(renderItem)}</div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderCompetition = (comp: any) => (
    <div key={comp.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
      <Link to="/competitions" className="flex items-center gap-3 flex-1 min-w-0">
        {comp.logo ? (
          <img src={comp.logo} alt={comp.name} className="h-6 w-6 object-contain" />
        ) : (
          <Trophy className="h-5 w-5 text-muted-foreground" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{comp.name}</p>
          <p className="text-xs text-muted-foreground">{comp.type} · Saison {comp.season}</p>
        </div>
      </Link>
      <button
        onClick={(e) => { e.stopPropagation(); toggleFavorite("competitions", comp.id, comp.name); }}
        className="p-1.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
      >
        <Star className={cn("h-4 w-4 transition-colors", isFavorite("competitions", comp.id) ? "fill-primary text-primary" : "text-muted-foreground/40")} />
      </button>
      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </div>
  );

  const renderTeam = (team: any) => (
    <Link key={team.id} to={`/teams/${buildEntitySlug(team.id, team.name)}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
      {team.logo ? (
        <img src={team.logo} alt={team.name} className="h-7 w-7 object-contain" />
      ) : (
        <Users className="h-5 w-5 text-muted-foreground" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{team.name}</p>
        <p className="text-xs text-muted-foreground">{team.league}{team.venue ? ` · ${team.venue}` : ""}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );

  const renderPlayer = (player: any) => (
    <Link key={player.id} to={`/players/${buildEntitySlug(player.id, player.name)}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
      {player.photoUrl ? (
        <img src={player.photoUrl} alt={player.name} className="h-9 w-9 rounded-full object-cover bg-muted" />
      ) : (
        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-primary">
          {player.jersey || "?"}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{player.name}</p>
        <p className="text-xs text-muted-foreground">{player.team} · {player.position}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold text-primary">{player.rating ? player.rating.toFixed(1) : "—"}</p>
        <p className="text-[10px] text-muted-foreground">{player.goals}G {player.assists}A</p>
      </div>
    </Link>
  );

  return (
    <Layout>
      <SEOHead title="Explorer | LiveFoot" description="Explorez les compétitions, équipes et joueurs de football par pays." />
      <div className="container py-4 space-y-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Explorer</h1>
          <p className="text-sm text-muted-foreground mt-1">Découvrez le football par pays</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-10 rounded-xl bg-card border-border" />
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
              activeTab === tab.key ? "gradient-primary text-primary-foreground shadow-md" : "bg-card text-muted-foreground hover:text-foreground border border-border"
            )}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button onClick={() => setSelectedCountry(null)} className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
            !selectedCountry ? "bg-primary/15 text-primary border-primary/30" : "bg-card text-muted-foreground border-border hover:text-foreground"
          )}>
            <Globe className="h-3 w-3" />Tous
          </button>
          {availableCountries.slice(0, 15).map((country) => (
            <button key={country} onClick={() => setSelectedCountry(selectedCountry === country ? null : country)} className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
              selectedCountry === country ? "bg-primary/15 text-primary border-primary/30" : "bg-card text-muted-foreground border-border hover:text-foreground"
            )}>
              <CountryFlag country={country} size="sm" />{country}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 pb-20">
            {(activeTab === "all" || activeTab === "competitions") &&
              renderSection("Compétitions", <Trophy className="h-5 w-5 text-primary" />, competitionsByCountry, renderCompetition, "comp", false)}
            {(activeTab === "all" || activeTab === "teams") &&
              renderSection("Équipes", <Users className="h-5 w-5 text-primary" />, teamsByCountry, renderTeam, "team", teamsLoading)}
            {(activeTab === "all" || activeTab === "players") &&
              renderSection("Joueurs", <Star className="h-5 w-5 text-primary" />, playersByCountry, renderPlayer, "player", playersLoading)}
            {!hasResults && !teamsLoading && !playersLoading && (
              <div className="text-center py-16">
                <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Aucun résultat trouvé</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Explorer;
