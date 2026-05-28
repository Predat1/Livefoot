import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const REQUIRED_ENV = ["API_FOOTBALL_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "P", "BT", "LIVE", "INT"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);
const PRIORITY_LEAGUES = ["135", "39", "140", "78", "61", "2", "3"];
const DIAGNOSTIC_TEAMS = ["500", "505"]; // Bologna, Inter in API-Football.
const STALE_LIVE_MINUTES = 10;

type ApiFixture = {
  fixture?: {
    id?: number | string;
    status?: { short?: string; elapsed?: number | null };
  };
  teams?: {
    home?: { id?: number | string; name?: string; logo?: string };
    away?: { id?: number | string; name?: string; logo?: string };
  };
  goals?: { home?: number | null; away?: number | null };
  league?: { id?: number | string; name?: string; logo?: string; country?: string };
  [key: string]: unknown;
};

type PreviousLiveState = {
  home_score?: number | null;
  away_score?: number | null;
  status?: string | null;
};

type SupabaseError = {
  message: string;
};

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
}

function todayInTimeZone(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

async function fetchApiFootball(endpoint: string, params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`https://v3.football.api-sports.io/${endpoint}${query ? `?${query}` : ""}`, {
    headers: { "x-apisports-key": Deno.env.get("API_FOOTBALL_KEY") ?? "" },
  });
  const payload = await response.json() as { response?: ApiFixture[]; errors?: unknown; error?: unknown };
  if (!response.ok) throw new Error(`${endpoint} failed: ${response.status} ${JSON.stringify(payload.errors || payload.error || "")}`);
  return payload.response || [];
}

function dedupeFixtures(fixtures: ApiFixture[]) {
  const map = new Map<string, ApiFixture>();
  for (const fixture of fixtures) {
    const id = String(fixture?.fixture?.id || "");
    if (!id || map.has(id)) continue;
    map.set(id, fixture);
  }
  return Array.from(map.values());
}

async function upsertFixtureState(supabase: ReturnType<typeof getSupabaseClient>, fixture: ApiFixture) {
  const status = fixture?.fixture?.status?.short || "NS";
  const fixtureId = String(fixture?.fixture?.id || "");
  if (!fixtureId) return;

  const { data: previous, error: previousError } = await supabase
    .from("live_match_states")
    .select("home_score, away_score, status")
    .eq("fixture_id", fixtureId)
    .maybeSingle() as { data: PreviousLiveState | null; error: SupabaseError | null };
  if (previousError) throw new Error(`live_match_states lookup failed: ${previousError.message}`);

  const homeScore = fixture?.goals?.home ?? 0;
  const awayScore = fixture?.goals?.away ?? 0;

  const { error: upsertError } = await supabase.rpc("upsert_live_match_state", {
    p_fixture_id: fixtureId,
    p_home_team_id: String(fixture?.teams?.home?.id || ""),
    p_home_team: fixture?.teams?.home?.name || "",
    p_home_logo: fixture?.teams?.home?.logo || "",
    p_away_team_id: String(fixture?.teams?.away?.id || ""),
    p_away_team: fixture?.teams?.away?.name || "",
    p_away_logo: fixture?.teams?.away?.logo || "",
    p_home_score: homeScore,
    p_away_score: awayScore,
    p_minute: fixture?.fixture?.status?.elapsed ?? null,
    p_status: status,
    p_league_id: String(fixture?.league?.id || ""),
    p_league_name: fixture?.league?.name || "",
    p_league_logo: fixture?.league?.logo || "",
    p_league_country: fixture?.league?.country || "",
  });
  if (upsertError) throw new Error(`upsert_live_match_state failed: ${upsertError.message}`);

  const previousTotal = (previous?.home_score ?? 0) + (previous?.away_score ?? 0);
  const currentTotal = homeScore + awayScore;
  if (currentTotal > previousTotal) {
    const { error: eventError } = await supabase.from("live_match_events").insert({
      fixture_id: fixtureId,
      event_type: "goal",
      minute: fixture?.fixture?.status?.elapsed ?? null,
      home_score: homeScore,
      away_score: awayScore,
      detail: "score_change",
      raw_payload: fixture,
    });
    if (eventError) throw new Error(`live_match_events goal insert failed: ${eventError.message}`);
  }

  if (previous?.status !== status && (LIVE_STATUSES.has(status) || FINISHED_STATUSES.has(status))) {
    const { error: eventError } = await supabase.from("live_match_events").insert({
      fixture_id: fixtureId,
      event_type: FINISHED_STATUSES.has(status) ? "fulltime" : status === "HT" ? "halftime" : "kickoff",
      minute: fixture?.fixture?.status?.elapsed ?? null,
      home_score: homeScore,
      away_score: awayScore,
      detail: status,
      raw_payload: fixture,
    });
    if (eventError) throw new Error(`live_match_events status insert failed: ${eventError.message}`);
  }
}

async function pruneMissingLiveStates(supabase: ReturnType<typeof getSupabaseClient>, trackedFixtureIds: Set<string>) {
  const cutoff = new Date(Date.now() - STALE_LIVE_MINUTES * 60_000).toISOString();
  let query = supabase
    .from("live_match_states")
    .delete()
    .in("status", Array.from(LIVE_STATUSES))
    .lt("updated_at", cutoff);

  if (trackedFixtureIds.size > 0) {
    query = query.not("fixture_id", "in", `(${Array.from(trackedFixtureIds).join(",")})`);
  }

  const { error } = await query;
  if (error) throw new Error(`stale live cleanup failed: ${error.message}`);
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok");

    const missing = REQUIRED_ENV.filter((key) => !Deno.env.get(key));
    if (missing.length) {
      return new Response(JSON.stringify({ error: `Missing env: ${missing.join(", ")}` }), { status: 500 });
    }

    const body = await req.json().catch(() => ({})) as { timezone?: string; date?: string; diagnostic?: boolean };
    const timezone = body.timezone || "Europe/Rome";
    const date = body.date || todayInTimeZone(timezone);
    const diagnostic = body.diagnostic === true;
    const supabase = getSupabaseClient();

    const sources: Array<{ source: string; fixtures: ApiFixture[] }> = [];
    const live = await fetchApiFootball("fixtures", { live: "all", timezone }).catch((error) => {
      console.error("[sync-live-fixtures] live=all failed", error);
      return [];
    });
    sources.push({ source: "live=all", fixtures: live });

    const leagueResults = await Promise.allSettled(
      PRIORITY_LEAGUES.map(async (league) => ({
        league,
        fixtures: await fetchApiFootball("fixtures", { date, league, season: "2025", timezone }),
      })),
    );
    for (const result of leagueResults) {
      if (result.status === "fulfilled") sources.push({ source: `league:${result.value.league}`, fixtures: result.value.fixtures });
      else console.error("[sync-live-fixtures] priority league failed", result.reason);
    }

    if (diagnostic) {
      const teamResults = await Promise.allSettled(
        DIAGNOSTIC_TEAMS.map(async (team) => ({
          team,
          fixtures: await fetchApiFootball("fixtures", { date, team, timezone }),
        })),
      );
      for (const result of teamResults) {
        if (result.status === "fulfilled") sources.push({ source: `team:${result.value.team}`, fixtures: result.value.fixtures });
      }
    }

    const allFixtures = dedupeFixtures(sources.flatMap((source) => source.fixtures));
    const trackedFixtures = allFixtures.filter((fixture) => {
      const status = fixture?.fixture?.status?.short || "";
      return LIVE_STATUSES.has(status) || FINISHED_STATUSES.has(status);
    });

    for (const fixture of trackedFixtures) {
      await upsertFixtureState(supabase, fixture);
    }

    await pruneMissingLiveStates(
      supabase,
      new Set(trackedFixtures.map((fixture) => String(fixture?.fixture?.id || "")).filter(Boolean)),
    );

    try {
      const { error: cleanupError } = await supabase.rpc("cleanup_finished_matches");
      if (cleanupError) console.error("[sync-live-fixtures] cleanup failed", cleanupError);
    } catch (cleanupError) {
      console.error("[sync-live-fixtures] cleanup failed", cleanupError);
    }

    return new Response(JSON.stringify({
      ok: true,
      timezone,
      date,
      totalFixtures: allFixtures.length,
      trackedFixtures: trackedFixtures.length,
      sources: sources.map((source) => ({ source: source.source, count: source.fixtures.length })),
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[sync-live-fixtures] fatal", error);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
