import { supabase } from "@/integrations/supabase/client";

interface ApiFootballResponse<T = unknown> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string> | [];
  results: number;
  paging: { current: number; total: number };
  response: T[];
  _cached?: boolean;
  _stale?: boolean;
  _staleReason?: string;
  _upstreamError?: unknown;
  _quotaResetAt?: string;
  code?: string;
}

async function callApi<T = unknown>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<ApiFootballResponse<T>> {
  try {
    const { data, error } = await supabase.functions.invoke("api-football", {
      body: { endpoint, params },
    });

    if (error) {
      console.error(`Edge Function invocation error [${endpoint}]:`, error);
      
      // Check if it's a non-2xx error from the edge function itself
      if (error.message?.includes("non-2xx status code")) {
        throw new Error(
          `Erreur Edge Function 'api-football' - La fonction retourne une erreur. ` +
          `Vérifiez dans les logs Supabase: Dashboard > Edge Functions > api-football > Logs. ` +
          `Erreur: ${error.message}`
        );
      }
      
      throw new Error(
        `Erreur de connexion (Edge Function: ${error.message}). ` +
        `Assurez-vous que la fonction 'api-football' est bien déployée sur votre projet Supabase. ` +
        `Commande de déploiement: supabase functions deploy api-football`
      );
    }

    // If data is null/undefined, something went wrong
    if (!data) {
      throw new Error("La fonction Edge Function a retourné une réponse vide");
    }

    const response = data as ApiFootballResponse<T>;

    // Check for API-level errors from API-Football
    if (response.errors && !Array.isArray(response.errors) && Object.keys(response.errors).length > 0) {
      throw new Error(Object.values(response.errors).join(", "));
    }

    if (response._upstreamError && !response._stale) {
      const upstreamMessage =
        typeof response._upstreamError === "string"
          ? response._upstreamError
          : Array.isArray(response._upstreamError)
          ? response._upstreamError.join(", ")
          : Object.values(response._upstreamError as Record<string, unknown> || {}).join(", ");
      throw new Error(upstreamMessage || "API-Football a retourné une erreur fournisseur.");
    }

    return response;
  } catch (e: any) {
    // If it's already our custom error, re-throw
    if (e.message?.includes("Edge Function") || e.message?.includes("api-football")) {
      throw e;
    }
    
    // Otherwise wrap with more context
    console.error(`API call failed [${endpoint}]:`, e);
    throw new Error(
      `Échec de l'appel API [${endpoint}]: ${e.message}. ` +
      `Vérifiez votre connexion internet et que l'Edge Function est bien déployée.`
    );
  }
}

// ─── Fixtures / Matches ───────────────────────────────────────
export const getFixtures = (params: Record<string, string>) =>
  callApi("fixtures", params);

export const getLiveFixtures = (timezone?: string) =>
  callApi("fixtures", { live: "all", ...(timezone ? { timezone } : {}) });

export const getFixtureById = (id: string, extraParams: Record<string, string> = {}) =>
  callApi("fixtures", { id, ...extraParams });

export const getFixtureEvents = (fixtureId: string, extraParams: Record<string, string> = {}) =>
  callApi("fixtures/events", { fixture: fixtureId, ...extraParams });

export const getFixtureLineups = (fixtureId: string, extraParams: Record<string, string> = {}) =>
  callApi("fixtures/lineups", { fixture: fixtureId, ...extraParams });

export const getFixtureStatistics = (fixtureId: string, extraParams: Record<string, string> = {}) =>
  callApi("fixtures/statistics", { fixture: fixtureId, ...extraParams });

export const getFixturePlayers = (fixtureId: string, extraParams: Record<string, string> = {}) =>
  callApi("fixtures/players", { fixture: fixtureId, ...extraParams });

export const getHeadToHead = (h2h: string) =>
  callApi("fixtures/headtohead", { h2h });

// ─── Leagues / Competitions ──────────────────────────────────
export const getLeagues = (params?: Record<string, string>) =>
  callApi("leagues", params);

export const getLeagueById = (id: string) =>
  callApi("leagues", { id });

export const getLeagueSeasons = () =>
  callApi("leagues/seasons");

export const searchLeagueByName = (name: string) =>
  callApi("leagues", { search: name });


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

export const getLiveOdds = (params: Record<string, string>) =>
  callApi("odds/live", params);

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
export const getAiPrediction = (params: { fixtureId: string; homeTeam: string; awayTeam: string; leagueName: string }) =>
  supabase.functions.invoke("ai-prediction", { body: params });

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
  getLiveOdds,
  getInjuries,
  getCoach,
  getVenues,
  getTrophies,
  getCountries,
  getSidelined,
  getPredictions,
};
