import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import CountryFlag from "@/components/CountryFlag";
import { mockCompetitions } from "@/data/competitionsData";
import { mockTeams } from "@/data/teamsData";
import { mockPlayers } from "@/data/playersData";
import { Trophy, Users, Star, Search, Globe, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Tab = "all" | "competitions" | "teams" | "players";

const COUNTRIES = [
  { name: "England", flag: "England" },
  { name: "Spain", flag: "Spain" },
  { name: "Germany", flag: "Germany" },
  { name: "Italy", flag: "Italy" },
  { name: "France", flag: "France" },
  { name: "Portugal", flag: "Portugal" },
  { name: "Europe", flag: "Europe" },
];

const Explorer = () => {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "Tout", icon: <Globe className="h-4 w-4" /> },
    { key: "competitions", label: "Compétitions", icon: <Trophy className="h-4 w-4" /> },
    { key: "teams", label: "Équipes", icon: <Users className="h-4 w-4" /> },
    { key: "players", label: "Joueurs", icon: <Star className="h-4 w-4" /> },
  ];

  const filteredCompetitions = useMemo(() => {
    return mockCompetitions.filter((c) => {
      const matchCountry = !selectedCountry || c.country === selectedCountry;
      const matchSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCountry && matchSearch;
    });
  }, [selectedCountry, searchQuery]);

  const filteredTeams = useMemo(() => {
    return mockTeams.filter((t) => {
      const matchCountry = !selectedCountry || t.country === selectedCountry;
      const matchSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCountry && matchSearch;
    });
  }, [selectedCountry, searchQuery]);

  const filteredPlayers = useMemo(() => {
    return mockPlayers.filter((p) => {
      const matchCountry = !selectedCountry || p.country === selectedCountry;
      const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCountry && matchSearch;
    });
  }, [selectedCountry, searchQuery]);

  // Group by country
  const groupByCountry = <T extends { country: string }>(items: T[]) => {
    const grouped: Record<string, T[]> = {};
    items.forEach((item) => {
      if (!grouped[item.country]) grouped[item.country] = [];
      grouped[item.country].push(item);
    });
    return grouped;
  };

  const competitionsByCountry = groupByCountry(filteredCompetitions);
  const teamsByCountry = groupByCountry(filteredTeams);
  const playersByCountry = groupByCountry(filteredPlayers);

  const allCountries = useMemo(() => {
    const set = new Set<string>();
    if (activeTab === "all" || activeTab === "competitions") filteredCompetitions.forEach((c) => set.add(c.country));
    if (activeTab === "all" || activeTab === "teams") filteredTeams.forEach((t) => set.add(t.country));
    if (activeTab === "all" || activeTab === "players") filteredPlayers.forEach((p) => set.add(p.country));
    return Array.from(set).sort();
  }, [activeTab, filteredCompetitions, filteredTeams, filteredPlayers]);

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    groupedData: Record<string, any[]>,
    renderItem: (item: any) => React.ReactNode,
    type: string
  ) => {
    const entries = Object.entries(groupedData).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {entries.reduce((sum, [, items]) => sum + items.length, 0)}
          </span>
        </div>
        {entries.map(([country, items]) => (
          <div key={`${type}-${country}`} className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
              <CountryFlag country={country} size="sm" />
              <span className="text-sm font-bold text-foreground">{country}</span>
              <span className="text-xs text-muted-foreground ml-auto">{items.length}</span>
            </div>
            <div className="divide-y divide-border">
              {items.map(renderItem)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCompetition = (comp: typeof mockCompetitions[0]) => (
    <Link
      key={comp.id}
      to={`/competitions`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
    >
      <span className="text-xl">{comp.logo}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{comp.name}</p>
        <p className="text-xs text-muted-foreground">{comp.teams} équipes · Saison {comp.season}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );

  const renderTeam = (team: typeof mockTeams[0]) => (
    <Link
      key={team.id}
      to={`/teams/${team.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
    >
      <span className="text-xl">{team.logo}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{team.name}</p>
        <p className="text-xs text-muted-foreground">{team.league} · {team.stadium}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );

  const renderPlayer = (player: typeof mockPlayers[0]) => (
    <Link
      key={player.id}
      to={`/players/${player.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
    >
      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-primary">
        {player.jersey}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{player.name}</p>
        <p className="text-xs text-muted-foreground">{player.team} · {player.position}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold text-primary">{player.rating}</p>
        <p className="text-[10px] text-muted-foreground">{player.goals}G {player.assists}A</p>
      </div>
    </Link>
  );

  return (
    <Layout>
      <SEOHead
        title="Explorer | LiveFoot"
        description="Explorez les compétitions, équipes et joueurs de football par pays."
      />

      <div className="container py-4 space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-foreground">Explorer</h1>
          <p className="text-sm text-muted-foreground mt-1">Découvrez le football par pays</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-card border-border"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                activeTab === tab.key
                  ? "gradient-primary text-primary-foreground shadow-md"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Country pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setSelectedCountry(null)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
              !selectedCountry
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            )}
          >
            <Globe className="h-3 w-3" />
            Tous
          </button>
          {COUNTRIES.map((c) => (
            <button
              key={c.name}
              onClick={() => setSelectedCountry(selectedCountry === c.name ? null : c.name)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                selectedCountry === c.name
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              )}
            >
              <CountryFlag country={c.flag} size="sm" />
              {c.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6 pb-20">
          {(activeTab === "all" || activeTab === "competitions") &&
            renderSection("Compétitions", <Trophy className="h-5 w-5 text-primary" />, competitionsByCountry, renderCompetition, "comp")}

          {(activeTab === "all" || activeTab === "teams") &&
            renderSection("Équipes", <Users className="h-5 w-5 text-primary" />, teamsByCountry, renderTeam, "team")}

          {(activeTab === "all" || activeTab === "players") &&
            renderSection("Joueurs", <Star className="h-5 w-5 text-primary" />, playersByCountry, renderPlayer, "player")}

          {allCountries.length === 0 && (
            <div className="text-center py-16">
              <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">Aucun résultat trouvé</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Explorer;
