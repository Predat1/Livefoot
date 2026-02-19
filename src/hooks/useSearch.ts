import { useState, useMemo, useCallback, useRef } from "react";
import { mockTeams } from "@/data/teamsData";
import { mockPlayers } from "@/data/playersData";
import { mockCompetitions } from "@/data/competitionsData";
import { mockNews } from "@/data/newsData";

export interface SearchResult {
  type: "team" | "player" | "competition" | "news";
  id: string;
  name: string;
  subtitle: string;
  href: string;
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

// Parse market value string like "€180M" or "€45M" to number in millions
const parseMarketValue = (value: string): number => {
  const match = value.replace(/[€$£]/g, "").match(/([\d.]+)([MK]?)/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = match[2]?.toUpperCase();
  if (unit === "M") return num;
  if (unit === "K") return num / 1000;
  return num;
};

export const LEAGUES = Array.from(new Set(mockTeams.map((t) => t.league))).sort();
export const COUNTRIES = Array.from(new Set([
  ...mockTeams.map((t) => t.country),
  ...mockPlayers.map((p) => p.country),
  ...mockCompetitions.map((c) => c.country),
])).sort();
export const POSITIONS = Array.from(new Set(mockPlayers.map((p) => p.position))).sort();

// Normalize string: remove accents and lowercase for accent-insensitive search
const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const useSearch = (debounceMs = 250) => {
  const [query, setQueryRaw] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setQuery = useCallback((val: string) => {
    setQueryRaw(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(val), debounceMs);
  }, [debounceMs]);

  const updateFilter = useCallback(<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const results = useMemo<SearchResult[]>(() => {
    const q = normalize(debouncedQuery.trim());
    const hasQuery = q.length >= 1;
    const hasFilters =
      filters.league !== "" ||
      filters.country !== "" ||
      filters.position !== "" ||
      filters.marketValueMin > 0 ||
      filters.marketValueMax < 500;

    if (!hasQuery && !hasFilters) return [];

    const out: SearchResult[] = [];

    // Teams
    if (filters.types.includes("team")) {
      mockTeams
        .filter((t) => {
          if (hasQuery && !normalize(t.name).includes(q) && !normalize(t.league).includes(q) && !normalize(t.country).includes(q)) return false;
          if (filters.league && t.league !== filters.league) return false;
          if (filters.country && t.country !== filters.country) return false;
          return true;
        })
        .forEach((t) =>
          out.push({
            type: "team",
            id: t.id,
            name: t.name,
            subtitle: `${t.league} • ${t.country}`,
            href: `/teams/${t.id}`,
            meta: { position: t.currentPosition, league: t.league, country: t.country },
          })
        );
    }

    // Players
    if (filters.types.includes("player")) {
      mockPlayers
        .filter((p) => {
          if (hasQuery && !normalize(p.name).includes(q) && !normalize(p.team).includes(q) && !normalize(p.nationality).includes(q)) return false;
          if (filters.league) {
            const playerTeam = mockTeams.find((t) => t.name === p.team);
            if (!playerTeam || playerTeam.league !== filters.league) return false;
          }
          if (filters.country && p.country !== filters.country) return false;
          if (filters.position && p.position !== filters.position) return false;
          const mv = parseMarketValue(p.marketValue);
          if (mv < filters.marketValueMin || mv > filters.marketValueMax) return false;
          return true;
        })
        .forEach((p) =>
          out.push({
            type: "player",
            id: p.id,
            name: p.name,
            subtitle: `${p.team} • ${p.position} • ${p.marketValue}`,
            href: `/players/${p.id}`,
            meta: { rating: p.rating, goals: p.goals, position: p.position, marketValue: parseMarketValue(p.marketValue) },
          })
        );
    }

    // Competitions
    if (filters.types.includes("competition")) {
      mockCompetitions
        .filter((c) => {
          if (hasQuery && !normalize(c.name).includes(q) && !normalize(c.country).includes(q)) return false;
          if (filters.country && c.country !== filters.country) return false;
          return true;
        })
        .forEach((c) =>
          out.push({
            type: "competition",
            id: c.id,
            name: c.name,
            subtitle: `${c.country} • ${c.teams} équipes`,
            href: `/competitions`,
            meta: { country: c.country },
          })
        );
    }

    // News
    if (filters.types.includes("news")) {
      mockNews
        .filter((n) => {
          if (hasQuery && !normalize(n.title).includes(q) && !normalize(n.category).includes(q)) return false;
          return true;
        })
        .slice(0, 5)
        .forEach((n) =>
          out.push({
            type: "news",
            id: n.id,
            name: n.title,
            subtitle: `${n.category} • ${n.date}`,
            href: `/news/${n.id}`,
            meta: {},
          })
        );
    }

    return out;
  }, [debouncedQuery, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.types.length < 4) count++;
    if (filters.league) count++;
    if (filters.country) count++;
    if (filters.position) count++;
    if (filters.marketValueMin > 0 || filters.marketValueMax < 500) count++;
    return count;
  }, [filters]);

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    filters,
    updateFilter,
    resetFilters,
    activeFilterCount,
  };
};
