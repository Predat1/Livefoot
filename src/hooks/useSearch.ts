import { useState, useMemo } from "react";
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
}

export const useSearch = () => {
  const [query, setQuery] = useState("");

  const results = useMemo<SearchResult[]>(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();

    const teamResults: SearchResult[] = mockTeams
      .filter((t) => t.name.toLowerCase().includes(q) || t.league.toLowerCase().includes(q))
      .map((t) => ({
        type: "team",
        id: t.id,
        name: t.name,
        subtitle: `${t.league} • ${t.country}`,
        href: `/teams/${t.id}`,
      }));

    const playerResults: SearchResult[] = mockPlayers
      .filter((p) => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q))
      .map((p) => ({
        type: "player",
        id: p.id,
        name: p.name,
        subtitle: `${p.team} • ${p.position}`,
        href: `/players/${p.id}`,
      }));

    const compResults: SearchResult[] = mockCompetitions
      .filter((c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q))
      .map((c) => ({
        type: "competition",
        id: c.id,
        name: c.name,
        subtitle: c.country,
        href: `/competitions`,
      }));

    const newsResults: SearchResult[] = mockNews
      .filter((n) => n.title.toLowerCase().includes(q))
      .slice(0, 3)
      .map((n) => ({
        type: "news",
        id: n.id,
        name: n.title,
        subtitle: n.category,
        href: `/news`,
      }));

    return [...teamResults, ...playerResults, ...compResults, ...newsResults].slice(0, 10);
  }, [query]);

  return { query, setQuery, results };
};
