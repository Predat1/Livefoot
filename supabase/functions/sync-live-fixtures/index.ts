import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const REQUIRED_ENV = ["API_FOOTBALL_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "P", "BT", "LIVE", "INT", "SUSP"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);
const TRACKED_STATUSES = new Set([...LIVE_STATUSES, ...FINISHED_STATUSES]);
const PRIORITY_LEAGUES = [
  "1", "2", "3", "4", "5", "9", "10", "11", "13", "15", "36", "37",
  "39", "40", "61", "62", "71", "72", "78", "79", "88", "89", "94", "95",
  "119", "128", "135", "136", "140", "141", "144", "179", "197", "203",
  "233", "253", "262", "270", "271", "307", "531", "667", "848",
];
const CRON_TICK_SECONDS = 15;
const LIVE_ALL_SECONDS = 15;
const DATE_TODAY_SECONDS = 300;
const PRIORITY_LEAGUE_SECONDS = 600;
const ADJACENT_DATES_SECONDS = 1800;
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

type SourceCount = {
  source: string;
  count: number;
};

type SyncError = {
  source: string;
  status?: number;
  message: string;
  apiErrors?: string[];
  rateLimit?: RateLimitInfo;
  blocking?: boolean;
};

type RateLimitInfo = {
  requestsLimit: string | null;
  requestsRemaining: string | null;
  minuteLimit: string | null;
  minuteRemaining: string | null;
};

class ApiFootballSourceError extends Error {
  status?: number;
  apiErrors: string[];
  rateLimit: RateLimitInfo;
  blocking: boolean;

  constructor(message: string, options: { status?: number; apiErrors?: string[]; rateLimit?: RateLimitInfo; blocking?: boolean } = {}) {
    super(message);
    this.name = "ApiFootballSourceError";
    this.status = options.status;
    this.apiErrors = options.apiErrors || [];
    this.rateLimit = options.rateLimit || emptyRateLimitInfo();
    this.blocking = options.blocking ?? false;
  }
}

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

function isCadenceWindow(startedAt: number, intervalSeconds: number) {
  return Math.floor(startedAt / 1000) % intervalSeconds < CRON_TICK_SECONDS;
}

function priorityLeagueForSlot(startedAt: number) {
  const slot = Math.floor(startedAt / (PRIORITY_LEAGUE_SECONDS * 1000));
  return PRIORITY_LEAGUES[slot % PRIORITY_LEAGUES.length];
}

function emptyRateLimitInfo(): RateLimitInfo {
  return {
    requestsLimit: null,
    requestsRemaining: null,
    minuteLimit: null,
    minuteRemaining: null,
  };
}

function extractRateLimitInfo(headers: Headers): RateLimitInfo {
  return {
    requestsLimit: headers.get("x-ratelimit-requests-limit"),
    requestsRemaining: headers.get("x-ratelimit-requests-remaining"),
    minuteLimit: headers.get("x-ratelimit-limit"),
    minuteRemaining: headers.get("x-ratelimit-remaining"),
  };
}

function normalizeApiErrors(payload: { errors?: unknown; error?: unknown }) {
  const rawErrors = payload?.errors ?? payload?.error;
  if (!rawErrors) return [];
  if (Array.isArray(rawErrors)) return rawErrors.map((error) => String(error)).filter(Boolean);
  if (typeof rawErrors === "string") return rawErrors ? [rawErrors] : [];
  if (typeof rawErrors === "object") {
    return Object.values(rawErrors as Record<string, unknown>)
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .map((value) => String(value))
      .filter(Boolean);
  }
  return [String(rawErrors)].filter(Boolean);
}

function isDailyQuotaError(errors: string[]) {
  const text = errors.join(" ").toLowerCase();
  return text.includes("request limit for the day") ||
    text.includes("quota") ||
    (text.includes("limit") && text.includes("day"));
}

function isBlockingApiError(errors: string[]) {
  const text = errors.join(" ").toLowerCase();
  return [
    "key",
    "token",
    "subscription",
    "plan",
    "quota",
    "rate",
    "limit",
    "access",
    "permission",
    "blocked",
    "forbidden",
    "unauthorized",
    "not allowed",
    "exceeded",
  ].some((needle) => text.includes(needle));
}

async function getDailyQuotaBlock(supabase: ReturnType<typeof getSupabaseClient>) {
  const startOfUtcDay = new Date();
  startOfUtcDay.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("live_sync_runs")
    .select("finished_at, errors")
    .eq("provider", "api-football")
    .eq("ok", false)
    .gte("finished_at", startOfUtcDay.toISOString())
    .order("finished_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("[sync-live-fixtures] quota block lookup failed", error);
    return null;
  }

  const blockedRun = (data || []).find((run: any) => {
    const errors = Array.isArray(run.errors) ? run.errors : [];
    return errors.some((entry: any) => isDailyQuotaError([
      entry?.message,
      ...(Array.isArray(entry?.apiErrors) ? entry.apiErrors : []),
    ].filter(Boolean)));
  });

  if (!blockedRun) return null;

  const resetAt = new Date(startOfUtcDay);
  resetAt.setUTCDate(resetAt.getUTCDate() + 1);
  return {
    since: blockedRun.finished_at,
    resetAt: resetAt.toISOString(),
  };
}

function describeUnknownError(error: unknown): SyncError {
  if (error instanceof ApiFootballSourceError) {
    return {
      source: "unknown",
      status: error.status,
      message: error.message,
      apiErrors: error.apiErrors,
      rateLimit: error.rateLimit,
      blocking: error.blocking,
    };
  }
  return {
    source: "unknown",
    message: error instanceof Error ? error.message : String(error),
  };
}

async function fetchApiFootball<T = ApiFixture>(endpoint: string, params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`https://v3.football.api-sports.io/${endpoint}${query ? `?${query}` : ""}`, {
    headers: { "x-apisports-key": Deno.env.get("API_FOOTBALL_KEY") ?? "" },
  });
  const rateLimit = extractRateLimitInfo(response.headers);
  const payload = await response.json() as { response?: T[]; errors?: unknown; error?: unknown };
  const apiErrors = normalizeApiErrors(payload);
  if (!response.ok || apiErrors.length > 0) {
    const blocking = isBlockingApiError(apiErrors) || [401, 403, 429].includes(response.status);
    throw new ApiFootballSourceError(
      `${endpoint} failed: ${response.status}${apiErrors.length ? ` ${apiErrors.join("; ")}` : ""}`,
      { status: response.status, apiErrors, rateLimit, blocking },
    );
  }
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

async function insertSyncRun(
  supabase: ReturnType<typeof getSupabaseClient>,
  input: {
    date: string;
    timezone: string;
    ok: boolean;
    totalFixtures: number;
    trackedFixtures: number;
    liveFixtures: number;
    finishedFixtures: number;
    sources: SourceCount[];
    errors: SyncError[];
    diagnostic: Record<string, unknown>;
    startedAt: number;
  },
) {
  const now = new Date();
  const { error } = await supabase.from("live_sync_runs").insert({
    provider: "api-football",
    run_date: input.date,
    timezone: input.timezone,
    ok: input.ok,
    total_fixtures: input.totalFixtures,
    tracked_fixtures: input.trackedFixtures,
    live_fixtures: input.liveFixtures,
    finished_fixtures: input.finishedFixtures,
    sources: input.sources,
    errors: input.errors,
    diagnostic: input.diagnostic,
    started_at: new Date(input.startedAt).toISOString(),
    finished_at: now.toISOString(),
    duration_ms: Math.max(0, now.getTime() - input.startedAt),
  });
  if (error) console.error("[sync-live-fixtures] live_sync_runs insert failed", error);
}

async function runFixtureSource(source: string, fetcher: () => Promise<ApiFixture[]>) {
  try {
    const fixtures = await fetcher();
    return { source, fixtures, error: null as SyncError | null };
  } catch (error) {
    const syncError = describeUnknownError(error);
    syncError.source = source;
    return { source, fixtures: [] as ApiFixture[], error: syncError };
  }
}

async function runTimezoneDiagnostic(date: string) {
  const checks = await Promise.all([
    runFixtureSource("diagnostic:date:no-timezone", () => fetchApiFootball("fixtures", { date })),
    runFixtureSource("diagnostic:date:UTC", () => fetchApiFootball("fixtures", { date, timezone: "UTC" })),
  ]);

  return checks.map((check) => ({
    source: check.source,
    count: check.fixtures.length,
    error: check.error,
  }));
}

serve(async (req) => {
  const startedAt = Date.now();
  let supabase: ReturnType<typeof getSupabaseClient> | null = null;
  let date = "";
  let timezone = "Africa/Douala";
  let sources: SourceCount[] = [];
  let errors: SyncError[] = [];
  let diagnostic: Record<string, unknown> = {};

  try {
    if (req.method === "OPTIONS") return new Response("ok");

    const missing = REQUIRED_ENV.filter((key) => !Deno.env.get(key));
    if (missing.length) {
      return new Response(JSON.stringify({ error: `Missing env: ${missing.join(", ")}` }), { status: 500 });
    }

    const body = await req.json().catch(() => ({})) as { timezone?: string; date?: string; diagnostic?: boolean; force?: boolean };
    timezone = body.timezone || "Africa/Douala";
    date = body.date || dateInTimeZone(new Date(), timezone);
    const yesterday = addDays(date, -1);
    const tomorrow = addDays(date, 1);
    const season = footballSeasonForDate(date);
    const diagnosticEnabled = body.diagnostic === true || Deno.env.get("LIVE_SYNC_DEBUG") === "true";
    const forcedRun = body.force === true || diagnosticEnabled;

    if (!forcedRun && !isCadenceWindow(startedAt, LIVE_ALL_SECONDS)) {
      return new Response(JSON.stringify({
        ok: true,
        provider: "api-football",
        skipped: true,
        reason: "quota_safe_cadence",
        timezone,
        date,
        diagnostic: {
          liveAllSeconds: LIVE_ALL_SECONDS,
          cronTickSeconds: CRON_TICK_SECONDS,
        },
      }), { headers: { "Content-Type": "application/json" } });
    }

    supabase = getSupabaseClient();

    const quotaBlock = await getDailyQuotaBlock(supabase);
    if (quotaBlock && !forcedRun) {
      const quotaErrors: SyncError[] = [{
        source: "quota-breaker",
        message: "API-Football daily quota already exhausted. Upstream calls are paused until reset.",
        blocking: true,
      }];
      const quotaDiagnostic = {
        quotaBlockedSince: quotaBlock.since,
        quotaResetAt: quotaBlock.resetAt,
        liveAllSeconds: LIVE_ALL_SECONDS,
        cronTickSeconds: CRON_TICK_SECONDS,
      };
      await insertSyncRun(supabase, {
        date,
        timezone,
        ok: false,
        totalFixtures: 0,
        trackedFixtures: 0,
        liveFixtures: 0,
        finishedFixtures: 0,
        sources: [{ source: "quota-breaker", count: 0 }],
        errors: quotaErrors,
        diagnostic: quotaDiagnostic,
        startedAt,
      });

      return new Response(JSON.stringify({
        ok: false,
        provider: "api-football",
        skipped: true,
        reason: "upstream_daily_quota_exhausted",
        timezone,
        date,
        errors: quotaErrors,
        diagnostic: quotaDiagnostic,
      }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.max(60, Math.ceil((new Date(quotaBlock.resetAt).getTime() - Date.now()) / 1000))),
        },
      });
    }

    const liveAllResult = await runFixtureSource("live=all", () => fetchApiFootball("fixtures", { live: "all", timezone }));
    const requests: Array<Promise<{ source: string; fixtures: ApiFixture[]; error: SyncError | null }>> = [];

    if (!liveAllResult.error?.blocking && isCadenceWindow(startedAt, DATE_TODAY_SECONDS)) {
      requests.push(runFixtureSource("date:today", () => fetchApiFootball("fixtures", { date, timezone })));
    }

    if (!liveAllResult.error?.blocking && isCadenceWindow(startedAt, PRIORITY_LEAGUE_SECONDS)) {
      const league = priorityLeagueForSlot(startedAt);
      requests.push(runFixtureSource(`league:${league}`, () => fetchApiFootball("fixtures", { date, league, season, timezone })));
    }

    if (!liveAllResult.error?.blocking && isCadenceWindow(startedAt, ADJACENT_DATES_SECONDS)) {
      requests.push(runFixtureSource("date:yesterday", () => fetchApiFootball("fixtures", { date: yesterday, timezone })));
      requests.push(runFixtureSource("date:tomorrow", () => fetchApiFootball("fixtures", { date: tomorrow, timezone })));
    }

    if (!liveAllResult.error?.blocking && diagnosticEnabled) {
      const diagnosticSlot = Math.floor(startedAt / 60_000);
      const searches = [
        DIAGNOSTIC_SEARCHES[diagnosticSlot % DIAGNOSTIC_SEARCHES.length],
        DIAGNOSTIC_SEARCHES[(diagnosticSlot + 1) % DIAGNOSTIC_SEARCHES.length],
      ];
      for (const search of searches) {
        requests.push(
          runFixtureSource(`diagnostic:${search}`, () => fetchDiagnosticTeamFixtures(search, date, timezone)),
        );
      }
    }

    const results = [liveAllResult, ...await Promise.all(requests)];
    const allFixtures: ApiFixture[] = [];

    for (const result of results) {
      sources.push({ source: result.source, count: result.fixtures.length });
      if (result.error) {
        errors.push(result.error);
        console.error("[sync-live-fixtures] API-Football source failed", result.error);
        continue;
      }
      allFixtures.push(...result.fixtures);
    }

    const dedupedFixtures = dedupeFixtures(allFixtures);
    const trackedFixtures = dedupedFixtures.filter((fixture) => TRACKED_STATUSES.has(fixture?.fixture?.status?.short || ""));
    const liveFixtures = trackedFixtures.filter((fixture) => LIVE_STATUSES.has(fixture?.fixture?.status?.short || ""));
    const finishedFixtures = trackedFixtures.filter((fixture) => FINISHED_STATUSES.has(fixture?.fixture?.status?.short || ""));

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

    const initialBlockingErrors = errors.filter((error) => error.blocking);
    const dateTodayScanned = results.some((r) => r.source === "date:today");
    const dateTodayCount = results.find((r) => r.source === "date:today")?.fixtures.length ?? 0;

    const timezoneDiagnostic = dedupedFixtures.length === 0 && dateTodayScanned && dateTodayCount === 0 && initialBlockingErrors.length === 0
      ? await runTimezoneDiagnostic(date)
      : [];
    for (const check of timezoneDiagnostic) {
      sources.push({ source: check.source, count: check.count });
      if (check.error) errors.push(check.error);
    }

    const timezoneMismatch = dedupedFixtures.length === 0 && dateTodayScanned && dateTodayCount === 0 && timezoneDiagnostic.some((check) => check.count > 0);
    if (timezoneMismatch) {
      errors.push({
        source: "diagnostic:timezone",
        message: "API-Football returned fixtures in timezone diagnostic while primary scans returned zero.",
      });
    }
    const blockingErrors = errors.filter((error) => error.blocking);

    diagnostic = {
      timezone,
      requestedDate: date,
      season,
      sourceCount: sources.length,
      failedSourceCount: errors.length,
      zeroSourceCount: sources.filter((source) => source.count === 0).length,
      cadence: {
        liveAllSeconds: LIVE_ALL_SECONDS,
        dateTodaySeconds: DATE_TODAY_SECONDS,
        rotatedPriorityLeagueSeconds: PRIORITY_LEAGUE_SECONDS,
        yesterdayTomorrowSeconds: ADJACENT_DATES_SECONDS,
        estimatedServerRequestsPerDay: Math.round(
          86400 / LIVE_ALL_SECONDS +
          86400 / DATE_TODAY_SECONDS +
          86400 / PRIORITY_LEAGUE_SECONDS +
          (86400 / ADJACENT_DATES_SECONDS) * 2,
        ),
      },
      activePriorityLeague: priorityLeagueForSlot(startedAt),
      timezoneChecks: timezoneDiagnostic,
      fallbackHint: dedupedFixtures.length === 0
        ? "API-Football returned no fixtures for live/date/priority league scans. Check API key, plan coverage, date, timezone, and API-Football account status."
        : null,
    };

    if (dedupedFixtures.length === 0) {
      console.warn("[sync-live-fixtures] API-Football returned zero fixtures for all sources", { date, timezone });
    }

    const ok = !timezoneMismatch && blockingErrors.length === 0 && !(dedupedFixtures.length === 0 && errors.length > 0);
    await insertSyncRun(supabase, {
      date,
      timezone,
      ok,
      totalFixtures: dedupedFixtures.length,
      trackedFixtures: trackedFixtures.length,
      liveFixtures: liveFixtures.length,
      finishedFixtures: finishedFixtures.length,
      sources,
      errors,
      diagnostic,
      startedAt,
    });

    if (!ok) {
      return new Response(JSON.stringify({
        ok: false,
        provider: "api-football",
        timezone,
        date,
        totalFixtures: dedupedFixtures.length,
        trackedFixtures: trackedFixtures.length,
        liveFixtures: liveFixtures.length,
        finishedFixtures: finishedFixtures.length,
        sources,
        errors,
        diagnostic,
      }), {
        status: blockingErrors.length > 0 ? 502 : 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      provider: "api-football",
      timezone,
      date,
      totalFixtures: dedupedFixtures.length,
      trackedFixtures: trackedFixtures.length,
      liveFixtures: liveFixtures.length,
      finishedFixtures: finishedFixtures.length,
      sources,
      errors,
      diagnostic,
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[sync-live-fixtures] fatal", error);
    errors.push({ source: "fatal", message });
    if (supabase) {
      await insertSyncRun(supabase, {
        date: date || dateInTimeZone(new Date(), timezone),
        timezone,
        ok: false,
        totalFixtures: 0,
        trackedFixtures: 0,
        liveFixtures: 0,
        finishedFixtures: 0,
        sources,
        errors,
        diagnostic,
        startedAt,
      });
    }
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
