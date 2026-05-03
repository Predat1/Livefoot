import { supabase } from "@/integrations/supabase/client";

interface ApiFootballResponse<T = unknown> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string> | [];
  results: number;
  paging: { current: number; total: number };
  response: T[];
  _cached?: boolean;
}

async function callApi<T = unknown>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<ApiFootballResponse<T>> {
  const { data, error } = await supabase.functions.invoke("api-football", {
    body: { endpoint, params },
  });

  if (error) throw new Error(`API Football error: ${error.message}`);

  const response = data as ApiFootballResponse<T>;

  // Check for API-level errors
  if (response.errors && !Array.isArray(response.errors) && Object.keys(response.errors).length > 0) {
    throw new Error(Object.values(response.errors).join(", "));
  }

  return response;
}

// ─── Fixtures / Matches ───────────────────────────────────────
export const getFixtures = (params: Record<string, string>) =>
  callApi("fixtures", params);

export const getLiveFixtures = () =>
  callApi("fixtures", { live: "all" });

export const getFixtureById = (id: string) =>
  callApi("fixtures", { id });

export const getFixtureEvents = (fixtureId: string) =>
  callApi("fixtures/events", { fixture: fixtureId });

export const getFixtureLineups = (fixtureId: string) =>
  callApi("fixtures/lineups", { fixture: fixtureId });

export const getFixtureStatistics = (fixtureId: string) =>
  callApi("fixtures/statistics", { fixture: fixtureId });

export const getFixturePlayers = (fixtureId: string) =>
  callApi("fixtures/players", { fixture: fixtureId });

export const getHeadToHead = (h2h: string) =>
  callApi("fixtures/headtohead", { h2h });

// ─── Leagues / Competitions ──────────────────────────────────
export const getLeagues = (params?: Record<string, string>) =>
  callApi("leagues", params);

export const getLeagueById = (id: string) =>
  callApi("leagues", { id });

export const getLeagueSeasons = () =>
  callApi("leagues/seasons");

// ─── Standings ────────────────────────────────────────────────
export const getStandings = (league: string, season: string) =>
  callApi("standings", { league, season });

// ─── Teams ────────────────────────────────────────────────────
export const getTeams = (params: Record<string, string>) =>
  callApi("teams", params);

export const getTeamById = (id: string) =>
  callApi("teams", { id });

export const searchTeamByName = (name: string) =>
  callApi("teams", { search: name });

export const getTeamStatistics = (team: string, season: string, league: string) =>
  callApi("teams/statistics", { team, season, league });

export const getTeamSquad = (team: string) =>
  callApi("players/squads", { team });

// ─── Players ──────────────────────────────────────────────────
export const getPlayers = (params: Record<string, string>) =>
  callApi("players", params);

export const getPlayerById = (id: string, season: string) =>
  callApi("players", { id, season });

export const searchPlayerByName = (name: string, season: string) =>
  callApi("players", { search: name, season });

export const getTopScorers = (league: string, season: string) =>
  callApi("players/topscorers", { league, season });

export const getTopAssists = (league: string, season: string) =>
  callApi("players/topassists", { league, season });

export const getTopYellowCards = (league: string, season: string) =>
  callApi("players/topyellowcards", { league, season });

export const getTopRedCards = (league: string, season: string) =>
  callApi("players/topredcards", { league, season });

// ─── Transfers ────────────────────────────────────────────────
export const getTransfers = (params: Record<string, string>) =>
  callApi("transfers", params);


// ─── Odds ─────────────────────────────────────────────────────
export const getOdds = (params: Record<string, string>) =>
  callApi("odds", params);

// ─── Injuries ─────────────────────────────────────────────────
export const getInjuries = (params: Record<string, string>) =>
  callApi("injuries", params);

// ─── Coaches ──────────────────────────────────────────────────
export const getCoach = (params: Record<string, string>) =>
  callApi("coachs", params);

// ─── Venues ───────────────────────────────────────────────────
export const getVenues = (params: Record<string, string>) =>
  callApi("venues", params);

// ─── Trophies ─────────────────────────────────────────────────
export const getTrophies = (params: Record<string, string>) =>
  callApi("trophies", params);

// ─── Countries ────────────────────────────────────────────────
export const getCountries = () =>
  callApi("countries");

// ─── Sidelined ────────────────────────────────────────────────
export const getSidelined = (params: Record<string, string>) =>
  callApi("sidelined", params);

// ─── Predictions ──────────────────────────────────────────────
export const getPredictions = (fixtureId: string) =>
  callApi("predictions", { fixture: fixtureId });

export default {
  getFixtures,
  getLiveFixtures,
  getFixtureById,
  getFixtureEvents,
  getFixtureLineups,
  getFixtureStatistics,
  getFixturePlayers,
  getHeadToHead,
  getLeagues,
  getLeagueById,
  getLeagueSeasons,
  getStandings,
  getTeams,
  getTeamById,
  searchTeamByName,
  getTeamStatistics,
  getTeamSquad,
  getPlayers,
  getPlayerById,
  searchPlayerByName,
  getTopScorers,
  getTopAssists,
  getTopYellowCards,
  getTopRedCards,
  getTransfers,
  getOdds,
  getInjuries,
  getCoach,
  getVenues,
  getTrophies,
  getCountries,
  getSidelined,
  getPredictions,
};
