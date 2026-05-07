import { useQuery } from "@tanstack/react-query";
import {
  getFixtures, getLiveFixtures, getTopScorers, getTopAssists,
  getStandings, getFixtureById, getFixtureEvents, getFixtureLineups,
  getFixtureStatistics, getHeadToHead, getLeagues, getTeams, getTeamById,
  getTeamSquad, getTeamStatistics, getTransfers, searchTeamByName, getPredictions,
} from "@/services/apiFootball";
import { format } from "date-fns";
import { mockLeagues } from "@/data/mockData";

// ─── Resilience Helpers ───────────────────────────────────────

/**
 * Wraps a promise with an AbortController-based timeout.
 * Throws a typed Error if the promise does not resolve within `ms` milliseconds.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label = "request"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout: ${label} exceeded ${ms}ms`));
    }, ms);
    promise
      .then((val) => { clearTimeout(timer); resolve(val); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

/**
 * Validates that an AI prediction response has the expected shape.
 * Returns a safe default if the schema doesn't match (API drift protection).
 */
function validateAiPrediction(data: unknown): { analysis: string; predictedScore: string; confidence: number; keyFactor: string } {
  const DEFAULT = { analysis: "", predictedScore: "? - ?", confidence: 0, keyFactor: "" };
  if (!data || typeof data !== "object") return DEFAULT;
  const d = data as Record<string, unknown>;
  return {
    analysis:       typeof d.analysis       === "string" ? d.analysis       : DEFAULT.analysis,
    predictedScore: typeof d.predictedScore === "string" ? d.predictedScore : DEFAULT.predictedScore,
    confidence:     typeof d.confidence     === "number" ? d.confidence     : DEFAULT.confidence,
    keyFactor:      typeof d.keyFactor      === "string" ? d.keyFactor      : DEFAULT.keyFactor,
  };
}

// ─── Types matching existing component interfaces ─────────────

export interface MatchTeam {
  id: string;
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

const fallbackLeagues = mockLeagues as unknown as LeagueData[];

// ─── Data transformers ────────────────────────────────────────

function mapFixtureStatus(apiStatus: string): "scheduled" | "live" | "finished" {
  const liveStatuses = ["1H", "2H", "HT", "ET", "P", "BT", "LIVE", "INT"];
  const finishedStatuses = ["FT", "AET", "PEN", "AWD", "WO"];
  if (liveStatuses.includes(apiStatus)) return "live";
  if (finishedStatuses.includes(apiStatus)) return "finished";
  return "scheduled";
}

function transformFixturesToLeagues(fixtures: any[] = []): LeagueData[] {
  const leagueMap = new Map<number, LeagueData>();
  
  if (!fixtures || !Array.isArray(fixtures)) return [];

  for (const fix of fixtures) {
    if (!fix || !fix.league || !fix.teams || !fix.fixture) continue;

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

    const homeTeam = fix.teams?.home;
    const awayTeam = fix.teams?.away;

    if (!homeTeam || !awayTeam) continue;

    const match: MatchData = {
      id: String(fix.fixture.id),
      homeTeam: {
        id: String(homeTeam.id),
        name: homeTeam.name,
        logo: homeTeam.logo,
        score: status !== "scheduled" ? fix.goals?.home : undefined,
      },
      awayTeam: {
        id: String(awayTeam.id),
        name: awayTeam.name,
        logo: awayTeam.logo,
        score: status !== "scheduled" ? fix.goals?.away : undefined,
      },
      time: new Date(fix.fixture.date).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status,
      minute: fix.fixture.status?.elapsed || undefined,
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

function transformTopScorers(scorers: any[] = []): PlayerData[] {
  if (!scorers || !Array.isArray(scorers)) return [];
  return scorers.map((item) => {
    const p = item.player;
    const stats = item.statistics || [];
    const s = stats[0];
    
    if (!p || !s) return null as any;

    return {
      id: String(p.id),
      name: p.name || "Joueur Inconnu",
      team: s.team?.name || "Équipe Inconnue",
      teamId: String(s.team?.id || ""),
      teamLogo: s.team?.logo,
      country: p.nationality || "",
      countryFlag: "",
      position: s.games?.position || "Forward",
      age: p.age || 0,
      goals: s.goals?.total || 0,
      assists: s.goals?.assists || 0,
      appearances: s.games?.appearences || 0,
      minutesPlayed: s.games?.minutes || 0,
      rating: parseFloat(s.games?.rating) || 0,
      marketValue: "",
      yellowCards: s.cards?.yellow || 0,
      redCards: s.cards?.red || 0,
      shotsPerGame: s.shots?.total
        ? Math.round((s.shots.total / (s.games.appearences || 1)) * 10) / 10
        : 0,
      passAccuracy: s.passes?.accuracy ? parseInt(s.passes.accuracy) : 0,
      duelsWon: s.duels?.won || 0,
      nationality: p.nationality || "",
      height: p.height || "",
      weight: p.weight || "",
      foot: "",
      jersey: s.games?.number || 0,
      photoUrl: p.photo || "",
    };
  }).filter(Boolean);
}

// ─── React Query Hooks ────────────────────────────────────────

export function useFixturesByDate(date: Date) {
  const dateStr = format(date, "yyyy-MM-dd");
  return useQuery({
    queryKey: ["fixtures", dateStr],
    queryFn: async () => {
      try {
        const res = await getFixtures({ date: dateStr });
        return transformFixturesToLeagues(res?.response || []);
      } catch (error) {
        console.warn("Impossible de charger les matchs, affichage du contenu de secours.", error);
        return fallbackLeagues;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for general lists
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useLiveFixtures() {
  return useQuery({
    queryKey: ["fixtures", "live"],
    queryFn: async () => {
      try {
        const res = await getLiveFixtures();
        return transformFixturesToLeagues(res?.response || []);
      } catch (error) {
        console.warn("Impossible de charger les matchs en direct, affichage du contenu de secours.", error);
        return fallbackLeagues
          .map((league) => ({ ...league, matches: league.matches.filter((match) => match.status === "live") }))
          .filter((league) => league.matches.length > 0);
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute for Live
    refetchInterval: 1 * 60 * 1000,
  });
}

export function useTopScorers(leagueId: string, season: string) {
  return useQuery({
    queryKey: ["topscorers", leagueId, season],
    queryFn: async () => {
      const res = await getTopScorers(leagueId, season);
      return transformTopScorers(res.response);
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000,
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
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
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
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
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
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 1 * 60 * 1000,
    refetchIntervalInBackground: false,
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
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
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
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
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
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
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
    staleTime: 30 * 60 * 1000,  // 30min — team rosters stable within session
    gcTime: 60 * 60 * 1000,     // keep 1h in memory
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
  const isNumeric = /^\d+$/.test(teamId);

  // If numeric, fetch directly by ID
  const directQuery = useQuery({
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
    enabled: !!teamId && isNumeric,
  });

  // If slug, search by name and pick best match
  const slugQuery = useQuery({
    queryKey: ["team-search", teamId],
    queryFn: async () => {
      const searchName = teamId.replace(/-/g, " ");
      const res = await searchTeamByName(searchName);
      if (!res.response || res.response.length === 0) return null;
      // Find best match (case-insensitive)
      const match = res.response.find((r: any) =>
        r.team.name.toLowerCase() === searchName.toLowerCase()
      ) || res.response[0];
      const item = match as any;
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
    enabled: !!teamId && !isNumeric,
  });

  return isNumeric ? directQuery : slugQuery;
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
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
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
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
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
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: !!teamId,
  });
}

// ─── Competitions (trending leagues) ──────────────────────────

// Tier 1 — Big 5 European leagues + UEFA
export const TIER1_IDS = new Set(["39", "140", "135", "78", "61"]);
// Tier 2 — UEFA competitions + top leagues
export const TIER2_IDS = new Set(["2", "3", "848", "4", "5", "480", "531"]); // UCL, UEL, UECL, Euro, WC, Copa America, UEFA Nations League
// Tier 3 — Popular regional leagues + African leagues
export const TIER3_IDS = new Set([
  "262", "71", "88", "94", "307", "253", "128", "203", "144", "179", "40",
  "98", "292", "188", "113", "103", "119", "106", "197", "207", "218",
  "233", "200", "288", "323", "239", "265", "305", "169",
  // Additional leagues
  "72", "141", "136", "79", "62", "89", "95", "210", "286", "333", "283",
  "271", "172", "345", "373", "318", "268", "270", "242", "299", "330",
  "99", "274", "296", "340", "301", "202", "409", "306", "350", "401",
  "357", "332", "225", "235", "302", "244", "352",
  // African leagues
  "233",  // Botola Pro (Morocco)
  "36",   // CAF Champions League
  "37",   // CAF Confederation Cup
  "29",   // AFCON (Africa Cup of Nations)
  "551",  // Egyptian Premier League
  "270",  // South Africa Premier Division
  "187",  // Tunisian Ligue 1
  "367",  // Algerian Ligue 1
  "271",  // Nigerian NPFL
  "573",  // Ghanaian Premier League
  "564",  // Kenyan Premier League
  "366",  // Senegalese Ligue 1
  "572",  // Ivory Coast Ligue 1
  "365",  // Cameroon Elite One
  "568",  // Tanzanian Premier League
  "569",  // Ugandan Premier League
]);

// All trending league IDs combined
export const TRENDING_LEAGUE_IDS = [
  // Tier 1 - Big 5
  "39", "140", "135", "78", "61",
  // Tier 2 - UEFA + International
  "2", "3", "848", "4", "5",
  // African — CAF + Top domestic
  "29", "36", "37", "551", "233", "187", "367", "270", "271", "366",
  // Tier 3 - Regional
  "262", "71", "88", "94", "307", "253", "128", "203", "144", "179", "40",
  "98", "292", "188", "113", "200",
];
export const TRENDING_LEAGUE_SET = new Set(TRENDING_LEAGUE_IDS);

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
    staleTime: 2 * 60 * 60 * 1000,
    gcTime: 4 * 60 * 60 * 1000,
  });
}

// ─── All Leagues (for Competitions page) ─────────────────────

export interface AllLeagueItem {
  id: string;
  name: string;
  logo: string;
  type: string;
  country: string;
  countryFlag: string;
  season: string;
}

export function useAllLeagues() {
  return useQuery({
    queryKey: ["all-leagues"],
    queryFn: async () => {
      const res = await getLeagues({ current: "true" });
      const all = (res.response || []) as any[];

      return all.map((item: any) => ({
        id: String(item.league.id),
        name: item.league.name,
        logo: item.league.logo,
        type: item.league.type,
        country: item.country?.name || "",
        countryFlag: item.country?.flag || "",
        season: item.seasons?.[item.seasons.length - 1]?.year
          ? String(item.seasons[item.seasons.length - 1].year)
          : "2024",
      })) as AllLeagueItem[];
    },
    staleTime: 2 * 60 * 60 * 1000,
    gcTime: 4 * 60 * 60 * 1000,
  });
}

// ─── Player Detail ───────────────────────────────────────────

export function usePlayerDetailApi(playerId: string, season = "2024") {
  const isNumeric = /^\d+$/.test(playerId);

  const parsePlayerResponse = (res: any) => {
    if (!res.response || res.response.length === 0) return null;
    const item = res.response[0] as any;
    const p = item.player;
    const s = item.statistics?.[0];
    if (!p || !s) return null;
    return {
      id: String(p.id),
      name: p.name,
      firstname: p.firstname,
      lastname: p.lastname,
      age: p.age || 0,
      nationality: p.nationality || "",
      height: p.height || "",
      weight: p.weight || "",
      photo: p.photo || "",
      birth: p.birth,
      team: s.team?.name || "",
      teamId: String(s.team?.id || ""),
      teamLogo: s.team?.logo || "",
      league: s.league?.name || "",
      leagueId: String(s.league?.id || ""),
      leagueLogo: s.league?.logo || "",
      leagueCountry: s.league?.country || "",
      leagueFlag: s.league?.flag || "",
      position: s.games?.position || "Unknown",
      jersey: s.games?.number || 0,
      rating: parseFloat(s.games?.rating) || 0,
      appearances: s.games?.appearences || 0,
      lineups: s.games?.lineups || 0,
      minutes: s.games?.minutes || 0,
      captain: s.games?.captain || false,
      goals: s.goals?.total || 0,
      assists: s.goals?.assists || 0,
      conceded: s.goals?.conceded,
      saves: s.goals?.saves,
      yellowCards: s.cards?.yellow || 0,
      redCards: s.cards?.red || 0,
      shotsTotal: s.shots?.total || 0,
      shotsOn: s.shots?.on || 0,
      passesTotal: s.passes?.total || 0,
      passesKey: s.passes?.key || 0,
      passAccuracy: parseInt(s.passes?.accuracy) || 0,
      tacklesTotal: s.tackles?.total || 0,
      tacklesBlocks: s.tackles?.blocks || 0,
      tacklesInterceptions: s.tackles?.interceptions || 0,
      duelsTotal: s.duels?.total || 0,
      duelsWon: s.duels?.won || 0,
      dribblesAttempts: s.dribbles?.attempts || 0,
      dribblesSuccess: s.dribbles?.success || 0,
      foulsDrawn: s.fouls?.drawn || 0,
      foulsCommitted: s.fouls?.committed || 0,
      penaltyScored: s.penalty?.scored || 0,
      penaltyMissed: s.penalty?.missed || 0,
      allStats: (item.statistics || []) as any[],
    };
  };

  const directQuery = useQuery({
    queryKey: ["player-detail", playerId, season],
    queryFn: async () => {
      const { getPlayerById } = await import("@/services/apiFootball");
      const res = await getPlayerById(playerId, season);
      return parsePlayerResponse(res);
    },
    staleTime: 60 * 60 * 1000, // 1 hour for standings
    enabled: !!playerId && isNumeric,
  });

  const slugQuery = useQuery({
    queryKey: ["player-search", playerId, season],
    queryFn: async () => {
      const { searchPlayerByName } = await import("@/services/apiFootball");
      const searchName = playerId.replace(/-/g, " ");
      const res = await searchPlayerByName(searchName, season);
      if (!res.response || res.response.length === 0) return null;
      // Find best match
      const best = res.response.find((r: any) =>
        r.player.name.toLowerCase() === searchName.toLowerCase() ||
        r.player.lastname?.toLowerCase() === searchName.toLowerCase()
      ) || res.response[0];
      return parsePlayerResponse({ response: [best] });
    },
    staleTime: 60 * 60 * 1000, // 1 hour for squad
    enabled: !!playerId && !isNumeric,
  });

  return isNumeric ? directQuery : slugQuery;
}

// ─── Player Trophies ─────────────────────────────────────────

export function usePlayerTrophies(playerId: string) {
  return useQuery({
    queryKey: ["player-trophies", playerId],
    queryFn: async () => {
      const { getTrophies } = await import("@/services/apiFootball");
      const res = await getTrophies({ player: playerId });
      return (res.response || []) as { league: string; country: string; season: string; place: string }[];
    },
    staleTime: 30 * 60 * 1000,
    enabled: !!playerId,
  });
}

// ─── Player Seasons (multi-season stats) ─────────────────────

export function usePlayerSeasons(playerId: string) {
  return useQuery({
    queryKey: ["player-seasons", playerId],
    queryFn: async () => {
      const { getPlayers } = await import("@/services/apiFootball");
      const seasons = ["2024", "2023", "2022", "2021", "2020"];
      
      const responses = await Promise.allSettled(
        seasons.map(season => getPlayers({ id: playerId, season }))
      );

      const results: any[] = [];
      responses.forEach((res, idx) => {
        if (res.status !== "fulfilled") return;
        const item = res.value?.response?.[0] as any;
        if (!item) return;
        const season = seasons[idx];
        const stats = item.statistics || [];
        for (const s of stats) {
          results.push({
            season,
            league: s.league?.name || "",
            leagueLogo: s.league?.logo || "",
            team: s.team?.name || "",
            teamLogo: s.team?.logo || "",
            appearances: s.games?.appearences || 0,
            goals: s.goals?.total || 0,
            assists: s.goals?.assists || 0,
            minutes: s.games?.minutes || 0,
            rating: parseFloat(s.games?.rating) || 0,
          });
        }
      });
      return results;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!playerId,
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
    staleTime: 60 * 60 * 1000,
    enabled: !!homeId && !!awayId,
  });
}

export function useFixturePredictions(fixtureId: string) {
  return useQuery({
    queryKey: ["predictions", fixtureId],
    queryFn: async () => {
      try {
        const res = await withTimeout(getPredictions(fixtureId), 12_000, "predictions");
        if (!res?.response || res.response.length === 0) return null;
        return res.response[0];
      } catch (err) {
        console.warn("[useFixturePredictions] Prédictions API Football indisponibles:", err);
        // Retourne null — le composant doit gérer l'état null sans crasher
        return null;
      }
    },
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
    retry: false,           // pas de retry automatique — API Football est quotée
    throwOnError: false,    // ne pas propager l'erreur vers une ErrorBoundary parente
    enabled: !!fixtureId,
  });
}

export function useAiExpert(params: {
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  leagueName: string;
}) {
  return useQuery({
    queryKey: ["ai-expert", params.fixtureId],
    queryFn: async () => {
      const { getAiPrediction } = await import("@/services/apiFootball");
      const { data, error } = await getAiPrediction(params);
      if (error) throw error;
      return data as {
        matchState: string;
        analysis: string;
        reasoning: string;
        predictedScore: string;
        confidence: number;
        confidenceStars: number;
        keyFactor: string;
        xgHome: number;
        xgAway: number;
        valueBet: string | null;
        predictions: {
          winner: string;
          btts: string;
          bttsConfidence: number;
          overUnder25: string;
          overUnder25Confidence: number;
          overUnder35: string;
          doubleChance: string;
          corners: string;
          cards: string;
          possession: string;
          firstScorerTeam: string;
          anytimeScorer: string;
          penalty: string;
          var: string;
          cleanSheet: string;
          timingFirstGoal: string;
          highestScoringHalf: string;
          winningMargin: string;
        };
        vipClub: string;
        status?: string; // Ajouté pour gérer le 202 Accepted (processing)
        message?: string;
      };
    },
    staleTime: 24 * 60 * 60 * 1000,
    // ✅ N'appelle l'IA que quand toutes les données sont présentes
    enabled: !!params.fixtureId && !!params.homeTeam && !!params.awayTeam,
    retry: 1,
    // Poll toutes les 3 secondes si l'Edge Function nous dit que l'IA est en cours d'initialisation (Cache Lock)
    refetchInterval: (query) => {
      // Dans React Query v5, la data est accessible via query.state.data
      const data = query.state?.data as any;
      if (data?.status === "processing") return 3000;
      return false;
    },
  });
}

// ─── Team Recent Form (last 5 fixtures) ─────────────────────

export function useTeamForm(teamId: string) {
  return useQuery({
    queryKey: ["team-form", teamId],
    queryFn: async () => {
      const res = await getFixtures({ team: teamId, last: "5" });
      const fixtures = res.response || [];
      return (fixtures as any[]).map((fix: any) => {
        const isHome = String(fix.teams.home.id) === teamId;
        const goalsFor = isHome ? fix.goals.home : fix.goals.away;
        const goalsAgainst = isHome ? fix.goals.away : fix.goals.home;
        const won = goalsFor > goalsAgainst;
        const draw = goalsFor === goalsAgainst;
        return {
          id: String(fix.fixture.id),
          result: won ? "W" : draw ? "D" : "L",
          goalsFor,
          goalsAgainst,
          opponent: isHome ? fix.teams.away.name : fix.teams.home.name,
          opponentLogo: isHome ? fix.teams.away.logo : fix.teams.home.logo,
          league: fix.league.name,
          date: new Date(fix.fixture.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        };
      });
    },
    staleTime: 30 * 60 * 1000, // 30 mins for team form
    enabled: !!teamId,
  });
}

// ─── Fixture Player Ratings ─────────────────────────────────

export function useFixturePlayers(fixtureId: string) {
  return useQuery({
    queryKey: ["fixture-players", fixtureId],
    queryFn: async () => {
      const { getFixturePlayers } = await import("@/services/apiFootball");
      const res = await getFixturePlayers(fixtureId);
      return (res.response || []) as any[];
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
    enabled: !!fixtureId,
  });
}

// ─── Odds ────────────────────────────────────────────────────

export function useFixtureOdds(fixtureId: string) {
  return useQuery({
    queryKey: ["fixture-odds", fixtureId],
    queryFn: async () => {
      const { getOdds } = await import("@/services/apiFootball");
      const res = await getOdds({ fixture: fixtureId });
      return (res.response || []) as any[];
    },
    staleTime: 20 * 60 * 1000, // 20 mins for odds
    enabled: !!fixtureId,
  });
}

// ─── Injuries ────────────────────────────────────────────────
export function useFixtureInjuries(fixtureId: string) {
  return useQuery({
    queryKey: ["fixture-injuries", fixtureId],
    queryFn: async () => {
      const { getInjuries } = await import("@/services/apiFootball");
      const res = await getInjuries({ fixture: fixtureId });
      return (res.response || []) as any[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!fixtureId,
  });
}

// ─── Coaches ─────────────────────────────────────────────────
export function useTeamCoach(teamId: string) {
  return useQuery({
    queryKey: ["team-coach", teamId],
    queryFn: async () => {
      const { getCoach } = await import("@/services/apiFootball");
      const res = await getCoach({ team: teamId });
      return (res.response?.[0] || null) as any;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: !!teamId,
  });
}

// ─── Sidelined ───────────────────────────────────────────────
export function usePlayerSidelined(playerId: string) {
  return useQuery({
    queryKey: ["player-sidelined", playerId],
    queryFn: async () => {
      const { getSidelined } = await import("@/services/apiFootball");
      const res = await getSidelined({ player: playerId });
      return (res.response || []) as any[];
    },
    staleTime: 60 * 60 * 1000,
    enabled: !!playerId,
  });
}

// ─── Live Odds ───────────────────────────────────────────────
export function useLiveOdds(fixtureId: string) {
  return useQuery({
    queryKey: ["live-odds", fixtureId],
    queryFn: async () => {
      const { getLiveOdds } = await import("@/services/apiFootball");
      const res = await getLiveOdds({ fixture: fixtureId });
      return (res.response || []) as any[];
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000,
    enabled: !!fixtureId,
  });
}
