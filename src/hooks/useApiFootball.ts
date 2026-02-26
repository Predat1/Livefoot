import { useQuery } from "@tanstack/react-query";
import { getFixtures, getLiveFixtures, getTopScorers, getTopAssists } from "@/services/apiFootball";
import { format } from "date-fns";

// ─── Types matching existing component interfaces ─────────────

export interface MatchTeam {
  name: string;
  logo?: string;
  score?: number;
}

export interface MatchEvent {
  minute: number;
  type: "goal" | "yellow" | "red" | "substitution";
  team: "home" | "away";
  player: string;
  assist?: string;
}

export interface MatchData {
  id: string;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  time: string;
  status: "scheduled" | "live" | "finished";
  minute?: number;
  isTv?: boolean;
  stadium?: string;
  events?: MatchEvent[];
}

export interface LeagueData {
  id: string;
  name: string;
  country: string;
  flag?: string;
  logo?: string;
  matches: MatchData[];
}

export interface PlayerData {
  id: string;
  name: string;
  team: string;
  teamId: string;
  teamLogo?: string;
  country: string;
  countryFlag: string;
  position: string;
  age: number;
  goals: number;
  assists: number;
  appearances: number;
  minutesPlayed: number;
  rating: number;
  marketValue: string;
  yellowCards: number;
  redCards: number;
  shotsPerGame: number;
  passAccuracy: number;
  duelsWon: number;
  nationality: string;
  height: string;
  weight: string;
  foot: string;
  jersey: number;
  photoUrl: string;
}

// ─── Data transformers ────────────────────────────────────────

function mapFixtureStatus(apiStatus: string): "scheduled" | "live" | "finished" {
  const liveStatuses = ["1H", "2H", "HT", "ET", "P", "BT", "LIVE", "INT"];
  const finishedStatuses = ["FT", "AET", "PEN", "AWD", "WO"];
  if (liveStatuses.includes(apiStatus)) return "live";
  if (finishedStatuses.includes(apiStatus)) return "finished";
  return "scheduled";
}

function transformFixturesToLeagues(fixtures: any[]): LeagueData[] {
  const leagueMap = new Map<number, LeagueData>();

  for (const fix of fixtures) {
    const leagueId = fix.league.id;
    if (!leagueMap.has(leagueId)) {
      leagueMap.set(leagueId, {
        id: String(leagueId),
        name: fix.league.name,
        country: fix.league.country,
        flag: fix.league.flag,
        logo: fix.league.logo,
        matches: [],
      });
    }

    const status = mapFixtureStatus(fix.fixture.status.short);

    const match: MatchData = {
      id: String(fix.fixture.id),
      homeTeam: {
        name: fix.teams.home.name,
        logo: fix.teams.home.logo,
        score: status !== "scheduled" ? fix.goals.home : undefined,
      },
      awayTeam: {
        name: fix.teams.away.name,
        logo: fix.teams.away.logo,
        score: status !== "scheduled" ? fix.goals.away : undefined,
      },
      time: new Date(fix.fixture.date).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status,
      minute: fix.fixture.status.elapsed || undefined,
      stadium: fix.fixture.venue?.name,
    };

    leagueMap.get(leagueId)!.matches.push(match);
  }

  // Sort leagues: ones with live matches first, then by number of matches
  return Array.from(leagueMap.values()).sort((a, b) => {
    const aLive = a.matches.some((m) => m.status === "live") ? 1 : 0;
    const bLive = b.matches.some((m) => m.status === "live") ? 1 : 0;
    if (bLive !== aLive) return bLive - aLive;
    return b.matches.length - a.matches.length;
  });
}

function transformTopScorers(scorers: any[]): PlayerData[] {
  return scorers.map((item) => {
    const p = item.player;
    const s = item.statistics[0]; // First league stats
    return {
      id: String(p.id),
      name: p.name,
      team: s.team.name,
      teamId: String(s.team.id),
      teamLogo: s.team.logo,
      country: p.nationality,
      countryFlag: "",
      position: s.games.position || "Forward",
      age: p.age || 0,
      goals: s.goals.total || 0,
      assists: s.goals.assists || 0,
      appearances: s.games.appearences || 0,
      minutesPlayed: s.games.minutes || 0,
      rating: parseFloat(s.games.rating) || 0,
      marketValue: "",
      yellowCards: s.cards.yellow || 0,
      redCards: s.cards.red || 0,
      shotsPerGame: s.shots.total
        ? Math.round((s.shots.total / (s.games.appearences || 1)) * 10) / 10
        : 0,
      passAccuracy: s.passes.accuracy ? parseInt(s.passes.accuracy) : 0,
      duelsWon: s.duels.won || 0,
      nationality: p.nationality,
      height: p.height || "",
      weight: p.weight || "",
      foot: "",
      jersey: s.games.number || 0,
      photoUrl: p.photo || "",
    };
  });
}

// ─── React Query Hooks ────────────────────────────────────────

export function useFixturesByDate(date: Date) {
  const dateStr = format(date, "yyyy-MM-dd");
  return useQuery({
    queryKey: ["fixtures", dateStr],
    queryFn: async () => {
      const res = await getFixtures({ date: dateStr });
      return transformFixturesToLeagues(res.response);
    },
    staleTime: 60 * 1000, // 1 min
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

export function useLiveFixtures() {
  return useQuery({
    queryKey: ["fixtures", "live"],
    queryFn: async () => {
      const res = await getLiveFixtures();
      return transformFixturesToLeagues(res.response);
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useTopScorers(leagueId: string, season: string) {
  return useQuery({
    queryKey: ["topscorers", leagueId, season],
    queryFn: async () => {
      const res = await getTopScorers(leagueId, season);
      return transformTopScorers(res.response);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!leagueId && !!season,
  });
}

export function useTopAssists(leagueId: string, season: string) {
  return useQuery({
    queryKey: ["topassists", leagueId, season],
    queryFn: async () => {
      const res = await getTopAssists(leagueId, season);
      return transformTopScorers(res.response);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!leagueId && !!season,
  });
}
