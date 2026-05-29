import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { mockTeams } from "@/data/teamsData";
import { mockCompetitions } from "@/data/competitionsData";
import { mockNews } from "@/data/newsData";
import {
  getFixtures,
  getLiveFixtures,
  searchTeamByName,
  searchPlayerByName,
  searchLeagueByName,
} from "@/services/apiFootball";
import type { LeagueData, MatchData } from "@/hooks/useApiFootball";
import type { NewsArticle } from "@/hooks/useFootballNews";
import { LEAGUE_PRIORITY_SCORES, getMatchPriorityScore } from "@/utils/matchRanking";
import { formatApiDate, getUserMatchTimezone } from "@/utils/matchTime";

export interface SearchResult {
  type: "match" | "team" | "player" | "competition" | "news";
  id: string;
  name: string;
  subtitle: string;
  href: string;
  image?: string;
  meta?: Record<string, string | number | boolean | undefined>;
  score?: number;
}

export interface SearchFilters {
  types: SearchResult["type"][];
  league: string;
  country: string;
  position: string;
  marketValueMin: number;
  marketValueMax: number;
}

export const LEAGUES = [
  "Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1",
  "Champions League", "Europa League", "Eredivisie", "Primeira Liga",
  "Copa Libertadores", "Copa Sudamericana", "CAF U17 AFCON", "Euro U17", "Club Friendlies",
];

export const COUNTRIES = [
  "England", "Spain", "Italy", "Germany", "France", "Portugal",
  "Netherlands", "Belgium", "Brazil", "Argentina", "USA", "Cameroon",
];

export const POSITIONS = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

export const DEFAULT_FILTERS: SearchFilters = {
  types: ["match", "team", "player", "competition", "news"],
  league: "",
  country: "",
  position: "",
  marketValueMin: 0,
  marketValueMax: 500,
};

const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "P", "BT", "LIVE", "INT"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);

const SEARCH_ALIASES: Record<string, string[]> = {
  inter: ["internazionale", "inter milan", "fc internazionale"],
  internazionale: ["inter", "inter milan"],
  bologne: ["bologna"],
  bologna: ["bologne"],
  psg: ["paris saint germain", "paris sg"],
  "paris saint germain": ["psg", "paris sg"],
  barca: ["barcelona", "fc barcelona"],
  bayern: ["bayern munich", "fc bayern"],
  "man city": ["manchester city"],
  "man utd": ["manchester united"],
  ucl: ["champions league", "uefa champions league"],
  ldc: ["champions league", "ligue des champions"],
  libertadores: ["copa libertadores"],
  sudamericana: ["copa sudamericana"],
  u17: ["euro u17", "u17 championship", "under 17"],
  "caf u17": ["u17 africa cup of nations", "afcon u17", "africa u17", "coupe d afrique u17"],
  "afcon u17": ["caf u17", "u17 africa cup of nations", "coupe d afrique u17"],
  "coupe d afrique u17": ["caf u17", "afcon u17", "u17 africa cup of nations"],
  amical: ["friendly", "friendlies"],
};

const POPULAR_TERMS = [
  "champions league", "premier league", "la liga", "serie a", "bundesliga", "ligue 1",
  "europa league", "libertadores", "sudamericana", "caf u17", "afcon u17", "africa cup of nations u17", "international", "friendly",
  "real madrid", "barcelona", "manchester city", "liverpool", "arsenal", "inter",
  "juventus", "ac milan", "psg", "bayern", "chelsea", "marseille", "lyon",
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function getFootballSeasonForDate(date: Date) {
  const year = date.getFullYear();
  return String(date.getMonth() >= 6 ? year : year - 1);
}

function unique<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function expandQuery(query: string) {
  const normalized = normalize(query);
  const variants = new Set([normalized]);

  Object.entries(SEARCH_ALIASES).forEach(([key, aliases]) => {
    if (normalized.includes(key)) aliases.forEach((alias) => variants.add(normalized.replace(key, alias)));
    aliases.forEach((alias) => {
      if (normalized.includes(alias)) variants.add(normalized.replace(alias, key));
    });
  });

  return Array.from(variants).filter(Boolean);
}

function textMatches(text: string, queries: string[]) {
  const normalized = normalize(text);
  return queries.some((query) =>
    normalized.includes(query) || query.split(" ").every((part) => normalized.includes(part)),
  );
}

function relevanceScore(result: SearchResult, queries: string[]) {
  const haystack = normalize(`${result.name} ${result.subtitle} ${Object.values(result.meta || {}).join(" ")}`);
  const textScore = queries.reduce((best, query) => {
    if (haystack === query) return Math.max(best, 10000);
    if (haystack.startsWith(query)) return Math.max(best, 8500);
    if (haystack.includes(query)) return Math.max(best, 6500);
    if (query.split(" ").every((part) => haystack.includes(part))) return Math.max(best, 4500);
    return best;
  }, 0);

  const typeBoost: Record<SearchResult["type"], number> = {
    match: 2800,
    team: 2100,
    competition: 1900,
    player: 1500,
    news: 700,
  };
  const liveBoost = result.type === "match" && result.meta?.status === "live" ? 6000 : 0;
  const priorityBoost = typeof result.meta?.leagueId === "string" ? (LEAGUE_PRIORITY_SCORES[result.meta.leagueId] || 0) : 0;
  const popularBoost = POPULAR_TERMS.some((term) => haystack.includes(term)) ? 500 : 0;

  return textScore + typeBoost[result.type] + liveBoost + priorityBoost + popularBoost + (result.score || 0);
}

function transformApiFixtures(fixtures: any[] = [], timezone = getUserMatchTimezone()): SearchResult[] {
  return fixtures
    .filter((fix) => fix?.fixture?.id && fix?.teams?.home?.name && fix?.teams?.away?.name)
    .map((fix) => {
      const short = fix.fixture?.status?.short || "NS";
      const isLive = LIVE_STATUSES.has(short);
      const isFinished = FINISHED_STATUSES.has(short);
      const status = isLive ? "live" : isFinished ? "finished" : "scheduled";
      const elapsed = fix.fixture?.status?.elapsed;
      const homeScore = fix.goals?.home;
      const awayScore = fix.goals?.away;
      const scoreText = isLive || isFinished ? ` ${homeScore ?? 0}-${awayScore ?? 0} ` : " vs ";
      const date = fix.fixture?.date ? new Date(fix.fixture.date) : null;
      const time = date ? date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: timezone }) : "";
      const leagueName = fix.league?.name || "Match";
      const country = fix.league?.country || "";

      return {
        type: "match" as const,
        id: String(fix.fixture.id),
        name: `${fix.teams.home.name}${scoreText}${fix.teams.away.name}`,
        subtitle: `${leagueName}${country ? ` - ${country}` : ""} - ${isLive ? `${elapsed || ""}' LIVE` : isFinished ? "Termine" : time}`,
        image: fix.league?.logo,
        href: `/match/${fix.fixture.id}`,
        score: getMatchPriorityScore({
          id: String(fix.fixture.id),
          status,
          statusShort: short,
          minute: elapsed || undefined,
          kickoffIso: fix.fixture.date,
          homeTeam: { id: String(fix.teams.home.id || ""), name: fix.teams.home.name, score: homeScore },
          awayTeam: { id: String(fix.teams.away.id || ""), name: fix.teams.away.name, score: awayScore },
          league: { id: String(fix.league?.id || ""), name: leagueName, country },
        }),
        meta: {
          status,
          statusShort: short,
          minute: elapsed || undefined,
          league: leagueName,
          leagueId: String(fix.league?.id || ""),
          country,
          homeTeam: fix.teams.home.name,
          awayTeam: fix.teams.away.name,
        },
      };
    });
}

function transformLeagueMatches(leagues: LeagueData[] = []): SearchResult[] {
  return leagues.flatMap((league) =>
    (league.matches || []).map((match: MatchData) => {
      const scoreText = match.status !== "scheduled"
        ? ` ${match.homeTeam.score ?? 0}-${match.awayTeam.score ?? 0} `
        : " vs ";

      return {
        type: "match" as const,
        id: match.id,
        name: `${match.homeTeam.name}${scoreText}${match.awayTeam.name}`,
        subtitle: `${league.name}${league.country ? ` - ${league.country}` : ""} - ${match.status === "live" ? `${match.minute || ""}' LIVE` : match.status === "finished" ? "Termine" : match.time}`,
        image: league.logo,
        href: `/match/${match.id}`,
        score: getMatchPriorityScore(match, league),
        meta: {
          status: match.status,
          statusShort: match.statusShort,
          minute: match.minute,
          league: league.name,
          leagueId: league.id,
          country: league.country,
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
        },
      };
    }),
  );
}

function getFallbackResults(): SearchResult[] {
  const teams = mockTeams.map((team: any) => ({
    type: "team" as const,
    id: team.id,
    name: team.name,
    subtitle: `${team.country || ""} - ${team.league || "Equipe"}`,
    href: `/teams/${team.id}`,
    meta: { country: team.country || "", league: team.league || "" },
  }));

  const competitions = mockCompetitions.map((competition: any) => ({
    type: "competition" as const,
    id: competition.id,
    name: competition.name,
    subtitle: `${competition.country || ""} - Competition`,
    href: `/competitions`,
    meta: {
      country: competition.country || "",
      league: competition.name,
      leagueId: competition.id,
    },
    score: POPULAR_TERMS.some((term) => normalize(`${competition.name} ${competition.country}`).includes(term)) ? 700 : 0,
  }));

  return [...teams, ...competitions];
}

export const useSearch = (debounceMs = 300) => {
  const queryClient = useQueryClient();
  const [query, setQueryRaw] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [apiResults, setApiResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setQuery = useCallback((value: string) => {
    setQueryRaw(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(value), debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      const search = debouncedQuery.trim();
      if (search.length < 2) {
        setApiResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const timezone = getUserMatchTimezone();
        const season = getFootballSeasonForDate(new Date());
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const [teamsRes, playersRes, leaguesRes, liveRes, yesterdayRes, todayRes, tomorrowRes] = await Promise.allSettled([
          searchTeamByName(search),
          searchPlayerByName(search, season),
          searchLeagueByName(search),
          getLiveFixtures(timezone),
          getFixtures({ date: formatApiDate(yesterday, timezone), timezone }),
          getFixtures({ date: formatApiDate(today, timezone), timezone }),
          getFixtures({ date: formatApiDate(tomorrow, timezone), timezone }),
        ]);

        const nextResults: SearchResult[] = [];

        if (teamsRes.status === "fulfilled") {
          (teamsRes.value.response || []).slice(0, 8).forEach((item: any) => {
            nextResults.push({
              type: "team",
              id: String(item.team.id),
              name: item.team.name,
              subtitle: `${item.team.country || ""} - Equipe`,
              image: item.team.logo,
              href: `/teams/${item.team.id}`,
              meta: { country: item.team.country || "" },
            });
          });
        }

        if (playersRes.status === "fulfilled") {
          (playersRes.value.response || []).slice(0, 8).forEach((item: any) => {
            const stats = item.statistics?.[0] || {};
            nextResults.push({
              type: "player",
              id: String(item.player.id),
              name: item.player.name,
              subtitle: `${stats.team?.name || item.player.nationality || ""} - Joueur`,
              image: item.player.photo,
              href: `/players/${item.player.id}`,
              meta: {
                country: item.player.nationality || "",
                position: stats.games?.position || "",
                team: stats.team?.name || "",
              },
            });
          });
        }

        if (leaguesRes.status === "fulfilled") {
          (leaguesRes.value.response || []).slice(0, 8).forEach((item: any) => {
            nextResults.push({
              type: "competition",
              id: String(item.league.id),
              name: item.league.name,
              subtitle: `${item.country?.name || ""} - Competition`,
              image: item.league.logo,
              href: `/competitions`,
              score: LEAGUE_PRIORITY_SCORES[String(item.league.id)] || 0,
              meta: {
                country: item.country?.name || "",
                leagueId: String(item.league.id),
              },
            });
          });
        }

        const fixtureResults = [liveRes, yesterdayRes, todayRes, tomorrowRes]
          .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
          .flatMap((result) => transformApiFixtures(result.value?.response || [], timezone));

        setApiResults(unique([...fixtureResults, ...nextResults], (item) => `${item.type}-${item.id}`));
      } catch (error) {
        console.error("Search API error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const results = useMemo<SearchResult[]>(() => {
    const normalizedQuery = normalize(debouncedQuery.trim());
    if (normalizedQuery.length < 2) return [];

    const queryVariants = expandQuery(normalizedQuery);
    const cachedFixtures = queryClient
      .getQueriesData<LeagueData[]>({ queryKey: ["fixtures"] })
      .flatMap(([, data]) => transformLeagueMatches(data || []));
    const cachedLive = queryClient
      .getQueriesData<LeagueData[]>({ queryKey: ["live-match-states"] })
      .flatMap(([, data]) => transformLeagueMatches(data || []));
    const cachedSnapshots = queryClient
      .getQueriesData<LeagueData[]>({ queryKey: ["match-snapshots"] })
      .flatMap(([, data]) => transformLeagueMatches(data || []));
    const newsCache = queryClient.getQueryData<NewsArticle[]>(["football-news"]) || [];

    const baseResults = unique([...cachedLive, ...cachedSnapshots, ...cachedFixtures, ...apiResults, ...getFallbackResults()], (item) => `${item.type}-${item.id}`);

    if (filters.types.includes("news")) {
      const news = newsCache.length > 0 ? newsCache : mockNews;
      news
        .filter((item: any) => textMatches(`${item.title || ""} ${item.summary || ""} ${item.category || ""}`, queryVariants))
        .slice(0, 5)
        .forEach((item: any) => {
          baseResults.push({
            type: "news",
            id: item.id,
            name: item.title,
            subtitle: `${item.category || "Football"} - Actualite`,
            href: `/news/${item.id}`,
            image: item.image,
            score: item.trending ? 250 : 0,
          });
        });
    }

    return unique(baseResults, (item) => `${item.type}-${item.id}`)
      .filter((item) => filters.types.includes(item.type))
      .filter((item) => textMatches(`${item.name} ${item.subtitle} ${Object.values(item.meta || {}).join(" ")}`, queryVariants))
      .filter((item) => !filters.country || normalize(String(item.meta?.country || item.subtitle)).includes(normalize(filters.country)))
      .filter((item) => !filters.league || normalize(String(item.meta?.league || item.subtitle)).includes(normalize(filters.league)))
      .filter((item) => !filters.position || item.type !== "player" || normalize(String(item.meta?.position || "")).includes(normalize(filters.position)))
      .sort((a, b) => relevanceScore(b, queryVariants) - relevanceScore(a, queryVariants) || a.name.localeCompare(b.name))
      .slice(0, 50);
  }, [apiResults, debouncedQuery, filters, queryClient]);

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    isLoading,
    filters,
    updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => setFilters((prev) => ({ ...prev, [key]: value })),
    resetFilters: () => setFilters(DEFAULT_FILTERS),
    activeFilterCount: (
      (filters.types.length < DEFAULT_FILTERS.types.length ? 1 : 0) +
      (filters.league ? 1 : 0) +
      (filters.country ? 1 : 0) +
      (filters.position ? 1 : 0) +
      (filters.marketValueMin > 0 || filters.marketValueMax < 500 ? 1 : 0)
    ),
  };
};
