import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const ALLOWED_ORIGINS = [
  "https://www.livefoot.fun",
  "http://localhost:5173",
  "http://localhost:8080",
];

const REQUIRED_ENV = ["API_FOOTBALL_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const DAILY_LIMIT = 7000;
const RATE_LIMIT = 30;
const RATE_WINDOW = 60_000;

type QuotaState = { allowed: boolean; used: number; remaining: number; limit: number };

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const localMemoryCache = new Map<string, { data: any; expiresAt: number }>();
const pendingUpstreamRequests = new Map<string, Promise<{ data: any; status: number; quota: QuotaState }>>();

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
};

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function getMemoryCache(key: string): any | null {
  const entry = localMemoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    localMemoryCache.delete(key);
    return null;
  }
  return entry.data;
}

function setMemoryCache(key: string, data: any, ttlMs: number) {
  localMemoryCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

async function getCachedResponse(
  supabase: any,
  key: string,
  allowExpired = false,
): Promise<{ data: any; expired: boolean; expiresAt: string } | null> {
  try {
    const { data, error } = await supabase
      .from("api_football_cache")
      .select("data, expires_at")
      .eq("key", key)
      .single();

    if (error || !data) return null;

    const expired = Date.now() > new Date(data.expires_at).getTime();
    if (expired && !allowExpired) return null;

    return { data: data.data, expired, expiresAt: data.expires_at };
  } catch (err) {
    console.error(`[api-football] Cache read error for ${key}:`, err);
    return null;
  }
}

async function setCachedResponse(supabase: any, key: string, data: any, ttlMs: number) {
  try {
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();
    await supabase.from("api_football_cache").upsert({
      key,
      data,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

    if (Math.random() < 0.03) {
      (async () => {
        try {
          await supabase
            .from("api_football_cache")
            .delete()
            .lt("expires_at", new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString());
          console.log("[api-football] Old expired cache cleanup completed");
        } catch (err) {
          console.error("[api-football] Cache cleanup error:", err);
        }
      })();
    }
  } catch (err) {
    console.error(`[api-football] Cache write error for ${key}:`, err);
  }
}

function sanitizeParams(params: Record<string, string> = {}): Record<string, string> {
  return Object.fromEntries(Object.entries(params).filter(([key]) => !key.startsWith("_")));
}

function buildCacheKey(endpoint: string, params: Record<string, string>): string {
  const publicParams = sanitizeParams(params);
  const sortedParams = Object.keys(publicParams)
    .sort()
    .map((key) => `${key}=${publicParams[key]}`)
    .join("&");
  return `${endpoint}?${sortedParams}`;
}

function getTtlForEndpoint(endpoint: string, params: Record<string, string>, payload?: any): number {
  const statusHint = params?._matchStatus || payload?.response?.[0]?.fixture?.status?.short || "";
  const live = ["1H", "2H", "HT", "ET", "P", "BT", "LIVE", "INT"].includes(statusHint);
  const finished = ["FT", "AET", "PEN", "AWD", "WO"].includes(statusHint);

  if (finished) {
    if (endpoint === "fixtures") return 24 * 60 * 60_000;
    if (endpoint.startsWith("fixtures/events")) return 7 * 24 * 60 * 60_000;
    if (endpoint.startsWith("fixtures/statistics")) return 7 * 24 * 60 * 60_000;
    if (endpoint.startsWith("fixtures/players")) return 7 * 24 * 60 * 60_000;
    if (endpoint.startsWith("fixtures/lineups")) return 7 * 24 * 60 * 60_000;
  }

  if (endpoint === "fixtures" && params?.live === "all") return 90_000;
  if (endpoint.startsWith("fixtures/events")) return live ? 60_000 : 15 * 60_000;
  if (endpoint.startsWith("fixtures/statistics")) return live ? 90_000 : 30 * 60_000;
  if (endpoint.startsWith("fixtures/players")) return live ? 2 * 60_000 : 12 * 60 * 60_000;
  if (endpoint.startsWith("fixtures/lineups")) return live ? 5 * 60_000 : 30 * 60_000;
  if (endpoint.startsWith("fixtures/headtohead")) return 60 * 60_000;
  if (endpoint === "fixtures" && params?.team) return 2 * 60 * 60_000;
  if (endpoint === "fixtures" && params?.id) return live ? 60_000 : 15 * 60_000;
  if (endpoint === "fixtures") return 10 * 60_000;
  if (endpoint === "standings") return 24 * 60 * 60_000;
  if (endpoint === "leagues" || endpoint === "leagues/seasons") return 24 * 60 * 60_000;
  if (endpoint.startsWith("teams")) return 24 * 60 * 60_000;
  if (endpoint.startsWith("players")) return 12 * 60 * 60_000;
  if (["transfers", "trophies", "sidelined", "coachs", "countries", "venues"].includes(endpoint)) {
    return 7 * 24 * 60 * 60_000;
  }
  if (endpoint === "predictions") return 12 * 60 * 60_000;
  if (endpoint === "odds") return 20 * 60_000;
  if (endpoint === "odds/live") return live ? 2 * 60_000 : 10 * 60_000;
  if (endpoint === "injuries") return 30 * 60_000;
  return 10 * 60_000;
}

function attachMeta(data: any, meta: Record<string, any>) {
  if (data && typeof data === "object" && !Array.isArray(data)) return { ...data, ...meta };
  return { response: data, ...meta };
}

async function consumeDailyQuota(supabase: any): Promise<QuotaState> {
  const { data, error } = await supabase.rpc("consume_api_football_quota", {
    p_day: todayUtc(),
    p_limit: DAILY_LIMIT,
  });
  if (error) {
    console.error("[api-football] Quota RPC failed, failing closed:", error);
    return { allowed: false, used: DAILY_LIMIT, remaining: 0, limit: DAILY_LIMIT };
  }
  return data as QuotaState;
}

async function recordCacheEvent(supabase: any, cacheStatus: string) {
  try {
    await supabase.rpc("record_api_football_cache_event", {
      p_day: todayUtc(),
      p_cache_status: cacheStatus,
    });
  } catch (err) {
    console.error("[api-football] Cache event log error:", err);
  }
}

async function logApiUsage(supabase: any, entry: {
  endpoint: string;
  statusCode: number;
  responseTimeMs: number;
  quotaUsed: number;
  quotaRemaining?: number | null;
  errorMessage?: string | null;
  cacheStatus?: string | null;
  cacheKey?: string | null;
  metadata?: Record<string, any>;
}) {
  try {
    await supabase.from("api_usage_logs").insert({
      endpoint: `api-football/${entry.endpoint}`,
      request_method: "POST",
      status_code: entry.statusCode,
      response_time_ms: entry.responseTimeMs,
      quota_used: entry.quotaUsed,
      quota_remaining: entry.quotaRemaining ?? null,
      error_message: entry.errorMessage ?? null,
      cache_status: entry.cacheStatus ?? null,
      cache_key: entry.cacheKey ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch (err) {
    console.error("[api-football] Usage log error:", err);
  }
}

serve(async (req) => {
  const startedAt = Date.now();
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let supabase: any;
  let endpoint = "unknown";
  let cacheKey: string | null = null;

  try {
    const missing = REQUIRED_ENV.filter((key) => !Deno.env.get(key));
    if (missing.length) {
      return new Response(JSON.stringify({
        error: `Variables d'environnement manquantes : ${missing.join(", ")}`,
        code: "ENV_MISSING",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
    }

    supabase = getSupabaseClient();

    let body: { endpoint?: string; params?: Record<string, string> };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body - JSON expected", code: "INVALID_BODY" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    endpoint = body.endpoint || "";
    const params = body.params || {};
    const upstreamParams = sanitizeParams(params);

    if (!endpoint) {
      return new Response(JSON.stringify({ error: "Missing 'endpoint' parameter", code: "MISSING_ENDPOINT" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    if (!checkRateLimit(clientIp)) {
      return new Response(JSON.stringify({ error: "Trop de requetes. Reessaie dans une minute." }), {
        status: 429,
        headers: { ...corsHeaders, "Retry-After": "60", "Content-Type": "application/json" },
      });
    }

    cacheKey = buildCacheKey(endpoint, params);
    const ttl = getTtlForEndpoint(endpoint, params);
    const memCached = getMemoryCache(cacheKey);

    if (memCached) {
      await recordCacheEvent(supabase, "MEMORY_HIT");
      await logApiUsage(supabase, {
        endpoint,
        statusCode: 200,
        responseTimeMs: Date.now() - startedAt,
        quotaUsed: 0,
        cacheStatus: "MEMORY_HIT",
        cacheKey,
      });
      return new Response(JSON.stringify(attachMeta(memCached, {
        _cached: true,
        _stale: false,
        _quotaRemaining: null,
        _ttl: ttl,
      })), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MEMORY_HIT" },
        status: 200,
      });
    }

    const cached = await getCachedResponse(supabase, cacheKey);
    if (cached) {
      setMemoryCache(cacheKey, cached.data, ttl);
      await recordCacheEvent(supabase, "HIT");
      await logApiUsage(supabase, {
        endpoint,
        statusCode: 200,
        responseTimeMs: Date.now() - startedAt,
        quotaUsed: 0,
        cacheStatus: "HIT",
        cacheKey,
      });
      return new Response(JSON.stringify(attachMeta(cached.data, {
        _cached: true,
        _stale: false,
        _quotaRemaining: null,
        _ttl: ttl,
      })), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
        status: 200,
      });
    }

    const pending = pendingUpstreamRequests.get(cacheKey);
    if (pending) {
      const result = await pending;
      await logApiUsage(supabase, {
        endpoint,
        statusCode: result.status,
        responseTimeMs: Date.now() - startedAt,
        quotaUsed: 0,
        quotaRemaining: result.quota.remaining,
        cacheStatus: "COALESCED",
        cacheKey,
      });
      return new Response(JSON.stringify(attachMeta(result.data, {
        _cached: false,
        _stale: false,
        _coalesced: true,
        _quotaRemaining: result.quota.remaining,
        _ttl: getTtlForEndpoint(endpoint, params, result.data),
      })), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "COALESCED" },
        status: result.status,
      });
    }

    const quota = await consumeDailyQuota(supabase);
    if (!quota.allowed) {
      const stale = await getCachedResponse(supabase, cacheKey, true);
      if (stale) {
        await recordCacheEvent(supabase, "STALE");
        await logApiUsage(supabase, {
          endpoint,
          statusCode: 200,
          responseTimeMs: Date.now() - startedAt,
          quotaUsed: 0,
          quotaRemaining: quota.remaining,
          cacheStatus: "STALE",
          cacheKey,
          metadata: { reason: "quota_exceeded" },
        });
        return new Response(JSON.stringify(attachMeta(stale.data, {
          _cached: true,
          _stale: true,
          _staleReason: "quota_exceeded",
          _quotaRemaining: quota.remaining,
          _ttl: 0,
        })), {
          headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "STALE" },
          status: 200,
        });
      }

      await logApiUsage(supabase, {
        endpoint,
        statusCode: 429,
        responseTimeMs: Date.now() - startedAt,
        quotaUsed: 0,
        quotaRemaining: 0,
        errorMessage: "Daily quota exceeded and no stale cache available",
        cacheStatus: "MISS",
        cacheKey,
      });
      return new Response(JSON.stringify({
        error: "Quota journalier API atteint. Reessaie demain.",
        code: "DAILY_QUOTA_EXCEEDED",
        _quotaRemaining: 0,
      }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const upstreamPromise = (async () => {
      const queryParams = new URLSearchParams(upstreamParams).toString();
      const url = `https://v3.football.api-sports.io/${endpoint}${queryParams ? `?${queryParams}` : ""}`;
      const response = await fetch(url, {
        headers: {
          "x-apisports-key": Deno.env.get("API_FOOTBALL_KEY") ?? "",
        },
      });

      const data = await response.json();
      const finalTtl = getTtlForEndpoint(endpoint, params, data);
      const hasErrors = data?.errors && !Array.isArray(data.errors) && Object.keys(data.errors).length > 0;

      if (response.status === 200 && data && !hasErrors) {
        setMemoryCache(cacheKey!, data, finalTtl);
        await setCachedResponse(supabase, cacheKey!, data, finalTtl);
      }

      return { data, status: response.status, quota };
    })();

    pendingUpstreamRequests.set(cacheKey, upstreamPromise);

    try {
      const result = await upstreamPromise;
      const finalTtl = getTtlForEndpoint(endpoint, params, result.data);
      await logApiUsage(supabase, {
        endpoint,
        statusCode: result.status,
        responseTimeMs: Date.now() - startedAt,
        quotaUsed: 1,
        quotaRemaining: result.quota.remaining,
        errorMessage: result.status >= 400 ? JSON.stringify(result.data?.errors || result.data?.error || "upstream_error") : null,
        cacheStatus: "MISS",
        cacheKey,
      });

      return new Response(JSON.stringify(attachMeta(result.data, {
        _cached: false,
        _stale: false,
        _quotaRemaining: result.quota.remaining,
        _ttl: finalTtl,
      })), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
        status: 200,
      });
    } finally {
      pendingUpstreamRequests.delete(cacheKey);
    }
  } catch (error) {
    console.error("[api-football] Error:", error);

    if (cacheKey && supabase) {
      try {
        const stale = await getCachedResponse(supabase, cacheKey, true);
        if (stale) {
          try {
            await recordCacheEvent(supabase, "STALE");
          } catch (e) {
            console.error("[api-football] Failed to record cache event:", e);
          }
          try {
            await logApiUsage(supabase, {
              endpoint,
              statusCode: 200,
              responseTimeMs: Date.now() - startedAt,
              quotaUsed: 0,
              quotaRemaining: null,
              errorMessage: (error as Error).message,
              cacheStatus: "STALE",
              cacheKey,
              metadata: { reason: "upstream_or_internal_error" },
            });
          } catch (e) {
            console.error("[api-football] Failed to log API usage:", e);
          }
          return new Response(JSON.stringify(attachMeta(stale.data, {
            _cached: true,
            _stale: true,
            _staleReason: "upstream_or_internal_error",
            _staleError: (error as Error).message,
            _quotaRemaining: null,
            _ttl: 0,
          })), {
            headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "STALE" },
            status: 200,
          });
        }
      } catch (staleErr) {
        console.error("[api-football] Stale read failed:", staleErr);
      }
    }

    if (supabase) {
      try {
        await logApiUsage(supabase, {
          endpoint,
          statusCode: 500,
          responseTimeMs: Date.now() - startedAt,
          quotaUsed: 0,
          errorMessage: (error as Error).message,
          cacheStatus: "ERROR",
          cacheKey,
        });
      } catch (logErr) {
        console.error("[api-football] Usage logging failed:", logErr);
      }
    }

    return new Response(JSON.stringify({
      error: (error as Error).message,
      code: "INTERNAL_ERROR",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
