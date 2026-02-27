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
    staleTime: 30 * 60 * 1000,  // 30min — scorer rankings stable
    gcTime: 60 * 60 * 1000,
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

// Tier 1 — Big 5 European leagues + UEFA
export const TIER1_IDS = new Set(["39", "140", "135", "78", "61"]);
// Tier 2 — UEFA competitions + top leagues
export const TIER2_IDS = new Set(["2", "3", "848", "4", "5", "480", "531"]); // UCL, UEL, UECL, Euro, WC, Copa America, UEFA Nations League
// Tier 3 — Popular regional leagues
export const TIER3_IDS = new Set([
  "262", "71", "88", "94", "307", "253", "128", "203", "144", "179", "40",
  "98", "292", "188", "113", "103", "119", "106", "197", "207", "218",
  "233", "200", "288", "323", "239", "265", "305", "169",
  // Additional leagues
  "72", "141", "136", "79", "62", "89", "95", "210", "286", "333", "283",
  "271", "172", "345", "373", "318", "268", "270", "242", "299", "330",
  "99", "274", "296", "340", "301", "202", "409", "306", "350", "401",
  "357", "332", "225", "235", "302", "244", "352",
]);

// All trending league IDs combined
export const TRENDING_LEAGUE_IDS = [
  // Tier 1 - Big 5
  "39", "140", "135", "78", "61",
  // Tier 2 - UEFA + International
  "2", "3", "848", "4", "5",
  // Tier 3 - Regional
  "262", "71", "88", "94", "307", "253", "128", "203", "144", "179", "40",
  "98", "292", "188", "113", "233", "200",
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
  return useQuery({
    queryKey: ["player-detail", playerId, season],
    queryFn: async () => {
      const { getPlayerById } = await import("@/services/apiFootball");
      const res = await getPlayerById(playerId, season);
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
        // All statistics entries (for multi-season if available)
        allStats: (item.statistics || []) as any[],
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!playerId,
  });
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
      // Fetch several seasons
      const seasons = ["2024", "2023", "2022", "2021", "2020"];
      const results: any[] = [];
      for (const season of seasons) {
        try {
          const res = await getPlayers({ id: playerId, season });
          if (res.response?.[0]) {
            const item = res.response[0] as any;
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
          }
        } catch { /* skip failed season */ }
      }
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
    staleTime: 10 * 60 * 1000,
    enabled: !!homeId && !!awayId,
  });
}

// ─── Predictions ─────────────────────────────────────────────

export function usePredictions(fixtureId: string) {
  return useQuery({
    queryKey: ["predictions", fixtureId],
    queryFn: async () => {
      const { getPredictions } = await import("@/services/apiFootball");
      const res = await getPredictions(fixtureId);
      if (!res.response || res.response.length === 0) return null;
      return res.response[0] as any;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!fixtureId,
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
    staleTime: 5 * 60 * 1000,
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
    staleTime: 2 * 60 * 1000,
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
    staleTime: 10 * 60 * 1000,
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
