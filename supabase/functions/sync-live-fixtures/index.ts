import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const REQUIRED_ENV = ["API_FOOTBALL_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "P", "BT", "LIVE", "INT"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);
const TRACKED_STATUSES = new Set([...LIVE_STATUSES, ...FINISHED_STATUSES]);
const PRIORITY_LEAGUES = [
  "1", "2", "3", "4", "5", "9", "10", "11", "13", "15", "36", "37",
  "39", "40", "61", "62", "71", "72", "78", "79", "88", "89", "94", "95",
  "119", "128", "135", "136", "140", "141", "144", "179", "197", "203",
  "233", "253", "262", "270", "271", "307", "531", "667", "848",
];
const DIAGNOSTIC_SEARCHES = [
  "Iran", "Gambia", "South Africa", "Nicaragua", "Iraq", "Andorra", "France U17", "Denmark U17",
];
const STALE_LIVE_MINUTES = 10;

type ApiFixture = {
  fixture?: {
    id?: number | string;
    date?: string;
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

type ApiTeamSearchItem = {
  team?: { id?: number | string; name?: string };
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

function dateInTimeZone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  }).formatToParts(date);
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

function addDays(date: string, days: number) {
  const parsed = new Date(`${date}T12:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function footballSeasonForDate(date: string) {
  const parsed = new Date(`${date}T12:00:00Z`);
  const year = parsed.getUTCFullYear();
  return String(parsed.getUTCMonth() >= 6 ? year : year - 1);
}

async function fetchApiFootball<T = ApiFixture>(endpoint: string, params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`https://v3.football.api-sports.io/${endpoint}${query ? `?${query}` : ""}`, {
    headers: { "x-apisports-key": Deno.env.get("API_FOOTBALL_KEY") ?? "" },
  });
  const payload = await response.json() as { response?: T[]; errors?: unknown; error?: unknown };
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
  if (!TRACKED_STATUSES.has(status)) return;

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

  if (previous?.status !== status) {
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

async function fetchDiagnosticTeamFixtures(search: string, date: string, timezone: string) {
  const teams = await fetchApiFootball<ApiTeamSearchItem>("teams", { search });
  const teamIds = teams
    .map((item) => String(item?.team?.id || ""))
    .filter(Boolean)
    .slice(0, 2);

  const results = await Promise.allSettled(
    teamIds.map((team) => fetchApiFootball("fixtures", { team, date, timezone })),
  );

  return results
    .filter((result): result is PromiseFulfilledResult<ApiFixture[]> => result.status === "fulfilled")
    .flatMap((result) => result.value);
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok");

    const missing = REQUIRED_ENV.filter((key) => !Deno.env.get(key));
    if (missing.length) {
      return new Response(JSON.stringify({ error: `Missing env: ${missing.join(", ")}` }), { status: 500 });
    }

    const body = await req.json().catch(() => ({})) as { timezone?: string; date?: string; diagnostic?: boolean };
    const timezone = body.timezone || "Africa/Douala";
    const date = body.date || dateInTimeZone(new Date(), timezone);
    const yesterday = addDays(date, -1);
    const tomorrow = addDays(date, 1);
    const season = footballSeasonForDate(date);
    const diagnostic = body.diagnostic === true || Deno.env.get("LIVE_SYNC_DEBUG") === "true";
    const supabase = getSupabaseClient();

    const requests: Array<Promise<{ source: string; fixtures: ApiFixture[] }>> = [
      fetchApiFootball("fixtures", { live: "all", timezone }).then((fixtures) => ({ source: "live=all", fixtures })),
      fetchApiFootball("fixtures", { date, timezone }).then((fixtures) => ({ source: "date:today", fixtures })),
      fetchApiFootball("fixtures", { date: yesterday, timezone }).then((fixtures) => ({ source: "date:yesterday", fixtures })),
      fetchApiFootball("fixtures", { date: tomorrow, timezone }).then((fixtures) => ({ source: "date:tomorrow", fixtures })),
      ...PRIORITY_LEAGUES.map((league) =>
        fetchApiFootball("fixtures", { date, league, season, timezone })
          .then((fixtures) => ({ source: `league:${league}`, fixtures })),
      ),
    ];

    if (diagnostic) {
      for (const search of DIAGNOSTIC_SEARCHES) {
        requests.push(
          fetchDiagnosticTeamFixtures(search, date, timezone)
            .then((fixtures) => ({ source: `diagnostic:${search}`, fixtures })),
        );
      }
    }

    const results = await Promise.allSettled(requests);
    const sources: Array<{ source: string; count: number }> = [];
    const allFixtures: ApiFixture[] = [];

    for (const result of results) {
      if (result.status !== "fulfilled") {
        console.error("[sync-live-fixtures] API-Football source failed", result.reason);
        continue;
      }
      sources.push({ source: result.value.source, count: result.value.fixtures.length });
      allFixtures.push(...result.value.fixtures);
    }

    const dedupedFixtures = dedupeFixtures(allFixtures);
    const trackedFixtures = dedupedFixtures.filter((fixture) => TRACKED_STATUSES.has(fixture?.fixture?.status?.short || ""));

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

    if (dedupedFixtures.length === 0) {
      console.warn("[sync-live-fixtures] API-Football returned zero fixtures for all sources", { date, timezone });
    }

    return new Response(JSON.stringify({
      ok: true,
      provider: "api-football",
      timezone,
      date,
      totalFixtures: dedupedFixtures.length,
      trackedFixtures: trackedFixtures.length,
      liveFixtures: trackedFixtures.filter((fixture) => LIVE_STATUSES.has(fixture?.fixture?.status?.short || "")).length,
      sources,
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
