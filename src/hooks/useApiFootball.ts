import { useQuery } from "@tanstack/react-query";
import {
  getFixtures, getLiveFixtures, getTopScorers, getTopAssists,
  getStandings, getFixtureById, getFixtureEvents, getFixtureLineups,
  getFixtureStatistics, getHeadToHead, getLeagues, getTeams, getTeamById,
  getTeamSquad, getTeamStatistics, getTransfers,
} from "@/services/apiFootball";
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
    const s = item.statistics[0];
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
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
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

// ─── Standings ────────────────────────────────────────────────

export interface StandingTeam {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsFor: number;
  goalsAgainst: number;
  form: string;
}

export function useStandings(leagueId: string, season: string) {
  return useQuery({
    queryKey: ["standings", leagueId, season],
    queryFn: async () => {
      const res = await getStandings(leagueId, season);
      if (!res.response || res.response.length === 0) return [];
      const leagueData = (res.response[0] as any)?.league;
      if (!leagueData?.standings?.[0]) return [];
      return leagueData.standings[0] as StandingTeam[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!leagueId && !!season,
  });
}

// ─── Single Fixture ───────────────────────────────────────────

export function useFixtureDetail(fixtureId: string) {
  return useQuery({
    queryKey: ["fixture", fixtureId],
    queryFn: async () => {
      const res = await getFixtureById(fixtureId);
      if (!res.response || res.response.length === 0) return null;
      return res.response[0];
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    enabled: !!fixtureId,
  });
}

export function useFixtureEvents(fixtureId: string) {
  return useQuery({
    queryKey: ["fixture-events", fixtureId],
    queryFn: async () => {
      const res = await getFixtureEvents(fixtureId);
      return res.response || [];
    },
    staleTime: 60 * 1000,
    enabled: !!fixtureId,
  });
}

export function useFixtureLineups(fixtureId: string) {
  return useQuery({
    queryKey: ["fixture-lineups", fixtureId],
    queryFn: async () => {
      const res = await getFixtureLineups(fixtureId);
      return res.response || [];
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!fixtureId,
  });
}

export function useFixtureStatistics(fixtureId: string) {
  return useQuery({
    queryKey: ["fixture-statistics", fixtureId],
    queryFn: async () => {
      const res = await getFixtureStatistics(fixtureId);
      return res.response || [];
    },
    staleTime: 60 * 1000,
    enabled: !!fixtureId,
  });
}

export function useAvailableLeagues() {
  return useQuery({
    queryKey: ["leagues"],
    queryFn: async () => {
      const res = await getLeagues({ current: "true" });
      return res.response || [];
    },
    staleTime: 60 * 60 * 1000,
  });
}

// ─── Teams ────────────────────────────────────────────────────

export function useTeamsByLeague(leagueId: string, season: string) {
  return useQuery({
    queryKey: ["teams", leagueId, season],
    queryFn: async () => {
      const res = await getTeams({ league: leagueId, season });
      return (res.response || []).map((item: any) => ({
        id: String(item.team.id),
        name: item.team.name,
        logo: item.team.logo,
        country: item.team.country,
        founded: item.team.founded,
        venue: item.venue
          ? {
              name: item.venue.name,
              city: item.venue.city,
              capacity: item.venue.capacity,
              image: item.venue.image,
            }
          : null,
      }));
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!leagueId && !!season,
  });
}

export interface ApiTeamInfo {
  id: string;
  name: string;
  logo: string;
  country: string;
  founded: number;
  venue: { name: string; city: string; capacity: number; image: string } | null;
}

export function useTeamDetail(teamId: string) {
  return useQuery({
    queryKey: ["team", teamId],
    queryFn: async () => {
      const res = await getTeamById(teamId);
      if (!res.response || res.response.length === 0) return null;
      const item = res.response[0] as any;
      return {
        id: String(item.team.id),
        name: item.team.name,
        logo: item.team.logo,
        country: item.team.country,
        founded: item.team.founded,
        venue: item.venue
          ? {
              name: item.venue.name,
              city: item.venue.city,
              capacity: item.venue.capacity,
              image: item.venue.image,
            }
          : null,
      } as ApiTeamInfo;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!teamId,
  });
}

export function useTeamSquad(teamId: string) {
  return useQuery({
    queryKey: ["team-squad", teamId],
    queryFn: async () => {
      const res = await getTeamSquad(teamId);
      if (!res.response || res.response.length === 0) return [];
      const squad = (res.response[0] as any)?.players || [];
      return squad.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        age: p.age,
        number: p.number,
        position: p.position,
        photo: p.photo,
      }));
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!teamId,
  });
}

export function useTeamFixtures(teamId: string, season: string) {
  return useQuery({
    queryKey: ["team-fixtures", teamId, season],
    queryFn: async () => {
      const res = await getFixtures({ team: teamId, season, last: "10" });
      return (res.response || []).map((fix: any) => ({
        id: String(fix.fixture.id),
        date: new Date(fix.fixture.date).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
        time: new Date(fix.fixture.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        homeTeam: { name: fix.teams.home.name, logo: fix.teams.home.logo },
        awayTeam: { name: fix.teams.away.name, logo: fix.teams.away.logo },
        homeScore: fix.goals.home,
        awayScore: fix.goals.away,
        status: mapFixtureStatus(fix.fixture.status.short),
        league: fix.league.name,
      }));
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!teamId,
  });
}

export function useTeamNextFixtures(teamId: string) {
  return useQuery({
    queryKey: ["team-next-fixtures", teamId],
    queryFn: async () => {
      const res = await getFixtures({ team: teamId, next: "5" });
      return (res.response || []).map((fix: any) => ({
        id: String(fix.fixture.id),
        date: new Date(fix.fixture.date).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
        time: new Date(fix.fixture.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        homeTeam: { name: fix.teams.home.name, logo: fix.teams.home.logo },
        awayTeam: { name: fix.teams.away.name, logo: fix.teams.away.logo },
        league: fix.league.name,
      }));
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!teamId,
  });
}

// ─── Transfers ────────────────────────────────────────────────

export interface ApiTransfer {
  player: { id: number; name: string };
  update: string;
  transfers: {
    date: string;
    type: string;
    teams: {
      in: { id: number; name: string; logo: string };
      out: { id: number; name: string; logo: string };
    };
  }[];
}

export function useTransfersByTeam(teamId: string) {
  return useQuery({
    queryKey: ["transfers", teamId],
    queryFn: async () => {
      const res = await getTransfers({ team: teamId });
      return (res.response || []) as ApiTransfer[];
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!teamId,
  });
}

// ─── Competitions (trending leagues) ──────────────────────────

// Top trending league IDs (most followed globally)
export const TRENDING_LEAGUE_IDS = ["39", "140", "135", "78", "61", "2", "3", "848", "94", "88"];

export function useTrendingLeagues() {
  return useQuery({
    queryKey: ["trending-leagues"],
    queryFn: async () => {
      // Fetch all current leagues
      const res = await getLeagues({ current: "true", type: "league" });
      const all = (res.response || []) as any[];
      
      // Prioritize trending leagues first, then sort rest by country popularity
      const trendingSet = new Set(TRENDING_LEAGUE_IDS);
      const trending: any[] = [];
      const others: any[] = [];
      
      for (const item of all) {
        if (trendingSet.has(String(item.league.id))) {
          trending.push(item);
        } else {
          others.push(item);
        }
      }
      
      // Sort trending by their order in TRENDING_LEAGUE_IDS
      trending.sort((a, b) => {
        return TRENDING_LEAGUE_IDS.indexOf(String(a.league.id)) - TRENDING_LEAGUE_IDS.indexOf(String(b.league.id));
      });
      
      return [...trending, ...others.slice(0, 20)].map((item: any) => ({
        id: String(item.league.id),
        name: item.league.name,
        logo: item.league.logo,
        type: item.league.type,
        country: item.country?.name || "",
        countryFlag: item.country?.flag || "",
        season: item.seasons?.[item.seasons.length - 1]?.year
          ? String(item.seasons[item.seasons.length - 1].year)
          : "2024",
      }));
    },
    staleTime: 60 * 60 * 1000,
  });
}

// ─── Head to Head ────────────────────────────────────────────

export function useHeadToHead(homeId: string, awayId: string) {
  const h2h = `${homeId}-${awayId}`;
  return useQuery({
    queryKey: ["h2h", h2h],
    queryFn: async () => {
      const res = await getHeadToHead(h2h);
      return res.response || [];
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!homeId && !!awayId,
  });
}
