import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { mockTeams } from "@/data/teamsData";
import { mockPlayers } from "@/data/playersData";
import { mockCompetitions } from "@/data/competitionsData";
import { mockNews } from "@/data/newsData";
import { searchTeamByName, searchPlayerByName } from "@/services/apiFootball";

export interface SearchResult {
  type: "team" | "player" | "competition" | "news";
  id: string;
  name: string;
  subtitle: string;
  href: string;
  image?: string;
  meta?: Record<string, string | number>;
}

export interface SearchFilters {
  types: ("team" | "player" | "competition" | "news")[];
  league: string;
  country: string;
  position: string;
  marketValueMin: number;
  marketValueMax: number;
}

export const DEFAULT_FILTERS: SearchFilters = {
  types: ["team", "player", "competition", "news"],
  league: "",
  country: "",
  position: "",
  marketValueMin: 0,
  marketValueMax: 500,
};

// Normalize string
const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const useSearch = (debounceMs = 300) => {
  const [query, setQueryRaw] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [apiResults, setApiResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setQuery = useCallback((val: string) => {
    setQueryRaw(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(val), debounceMs);
  }, [debounceMs]);

  // Fetch real API results when query changes
  useEffect(() => {
    const fetchResults = async () => {
      const q = debouncedQuery.trim();
      if (q.length < 3) {
        setApiResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const [teamsRes, playersRes] = await Promise.allSettled([
          searchTeamByName(q),
          searchPlayerByName(q, "2024")
        ]);

        const newResults: SearchResult[] = [];

        if (teamsRes.status === "fulfilled" && teamsRes.value.response) {
          teamsRes.value.response.slice(0, 5).forEach((t: any) => {
            newResults.push({
              type: "team",
              id: String(t.team.id),
              name: t.team.name,
              subtitle: `${t.team.country || ""} • Équipe`,
              image: t.team.logo,
              href: `/teams/${t.team.id}`,
            });
          });
        }

        if (playersRes.status === "fulfilled" && playersRes.value.response) {
          playersRes.value.response.slice(0, 5).forEach((p: any) => {
            newResults.push({
              type: "player",
              id: String(p.player.id),
              name: p.player.name,
              subtitle: `${p.statistics[0]?.team?.name || ""} • Joueur`,
              image: p.player.photo,
              href: `/players/${p.player.id}`,
            });
          });
        }

        setApiResults(newResults);
      } catch (err) {
        console.error("Search API error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const results = useMemo<SearchResult[]>(() => {
    const q = normalize(debouncedQuery.trim());
    if (q.length === 0) return [];

    const out: SearchResult[] = [...apiResults];

    // Competitions (Mock fallback)
    if (filters.types.includes("competition")) {
      mockCompetitions
        .filter((c) => normalize(c.name).includes(q) || normalize(c.country).includes(q))
        .slice(0, 3)
        .forEach((c) =>
          out.push({
            type: "competition",
            id: c.id,
            name: c.name,
            subtitle: `${c.country} • Compétition`,
            href: `/competitions`,
          })
        );
    }

    // News (Mock fallback)
    if (filters.types.includes("news")) {
      mockNews
        .filter((n) => normalize(n.title).includes(q) || normalize(n.category).includes(q))
        .slice(0, 3)
        .forEach((n) =>
          out.push({
            type: "news",
            id: n.id,
            name: n.title,
            subtitle: `${n.category} • Actualité`,
            href: `/news/${n.id}`,
          })
        );
    }

    return out;
  }, [debouncedQuery, apiResults, filters.types]);

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    isLoading,
    filters,
    updateFilter: (key: keyof SearchFilters, value: any) => setFilters(prev => ({ ...prev, [key]: value })),
    resetFilters: () => setFilters(DEFAULT_FILTERS),
  };
};
