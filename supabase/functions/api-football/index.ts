import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const ALLOWED_ORIGINS = ["https://www.livefoot.fun", "https://www.livefoot.fun", "http://localhost:5173", "http://localhost:8080"];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
};

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // higher limit for general API proxy

// ─── In-Memory Cache (L1 Cache) ──────────────────────────────
const localMemoryCache = new Map<string, { data: any; expiresAt: number }>();

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
  localMemoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs
  });
}
const RATE_WINDOW = 60_000;

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

// ─── Database-Backed Persistent Cache ─────────────────────────
// We use a PostgreSQL table `api_football_cache` to store cached responses.

async function getCachedResponse(supabase: any, key: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from("api_football_cache")
      .select("data, expires_at")
      .eq("key", key)
      .single();

    if (error || !data) return null;

    const expiresAt = new Date(data.expires_at).getTime();
    if (Date.now() > expiresAt) {
      // Lazy deletion of expired entry
      supabase.from("api_football_cache").delete().eq("key", key).catch(() => {});
      return null;
    }

    return data.data;
  } catch (err) {
    console.error(`[api-football] Cache read error for key ${key}:`, err);
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
      updated_at: new Date().toISOString()
    }, { onConflict: "key" });

    // Periodic cleanup of expired entries (approx. 5% of requests)
    if (Math.random() < 0.05) {
      supabase
        .from("api_football_cache")
        .delete()
        .lt("expires_at", new Date().toISOString())
        .then(() => console.log("[api-football] Expired cache clean-up run successfully"))
        .catch((err: any) => console.error("[api-football] Cache cleanup error:", err));
    }
  } catch (err) {
    console.error(`[api-football] Cache write error for key ${key}:`, err);
  }
}

/** TTL (in ms) per endpoint category. More volatile data = shorter TTL. */
function getTtlForEndpoint(endpoint: string, params: Record<string, string>): number {
  // Live fixtures need freshness
  if (endpoint === "fixtures" && params?.live === "all") return 2 * 60_000;        // 2 min
  // Fixture sub-data (events, stats) during live matches
  if (endpoint.startsWith("fixtures/events")) return 60_000;                        // 1 min
  if (endpoint.startsWith("fixtures/statistics")) return 60_000;                    // 1 min
  if (endpoint.startsWith("fixtures/players")) return 60_000;                       // 1 min
  if (endpoint.startsWith("fixtures/lineups")) return 2 * 60_000;                  // 2 min
  if (endpoint.startsWith("fixtures/headtohead")) return 60 * 60_000;              // 1 hour
  // Fixtures by team (last 5) — stable
  if (endpoint === "fixtures" && params?.team) return 2 * 60 * 60_000;              // 2 hours
  // Fixture by date or by id
  if (endpoint === "fixtures") return 5 * 60_000;                                   // 5 min
  // Standings — very stable
  if (endpoint === "standings") return 6 * 60 * 60_000;                             // 6 hours
  // Leagues
  if (endpoint === "leagues" || endpoint === "leagues/seasons") return 12 * 60 * 60_000; // 12 hours
  // Teams / Players / Squads
  if (endpoint.startsWith("teams")) return 6 * 60 * 60_000;                        // 6 hours
  if (endpoint.startsWith("players")) return 6 * 60 * 60_000;                      // 6 hours
  // Transfers, trophies, sidelined, coaches, countries, venues
  if (endpoint === "transfers") return 24 * 60 * 60_000;                            // 24 hours
  if (endpoint === "trophies") return 24 * 60 * 60_000;                             // 24 hours
  if (endpoint === "sidelined") return 24 * 60 * 60_000;                            // 24 hours
  if (endpoint === "coachs") return 24 * 60 * 60_000;                               // 24 hours
  if (endpoint === "countries") return 24 * 60 * 60_000;                            // 24 hours
  if (endpoint === "venues") return 24 * 60 * 60_000;                               // 24 hours
  // Predictions
  if (endpoint === "predictions") return 12 * 60 * 60_000;                          // 12 hours
  // Odds
  if (endpoint === "odds" || endpoint === "odds/live") return 5 * 60_000;           // 5 min
  // Injuries
  if (endpoint === "injuries") return 5 * 60_000;                                   // 5 min
  // Default fallback
  return 5 * 60_000;                                                                 // 5 min
}

/** Build a deterministic cache key from endpoint + sorted params */
function buildCacheKey(endpoint: string, params: Record<string, string>): string {
  const sortedParams = Object.keys(params || {})
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return `${endpoint}?${sortedParams}`;
}



// ─── Daily request counter ───────────────────────────────────
// Tracks actual upstream API calls to prevent exceeding the 7,500/day quota.

let dailyRequestCount = 0;
let dailyResetAt = 0;
const DAILY_LIMIT = 7000; // Leave 500 as safety margin

function checkDailyQuota(): boolean {
  const now = Date.now();
  // Reset counter at midnight UTC
  const todayMidnight = new Date();
  todayMidnight.setUTCHours(0, 0, 0, 0);
  const nextMidnight = todayMidnight.getTime() + 24 * 60 * 60_000;
  
  if (now > dailyResetAt) {
    dailyRequestCount = 0;
    dailyResetAt = nextMidnight;
  }
  
  if (dailyRequestCount >= DAILY_LIMIT) return false;
  dailyRequestCount++;
  return true;
}

const REQUIRED_ENV = ["API_FOOTBALL_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Vérification des variables d'environnement
    const missing = REQUIRED_ENV.filter(k => !Deno.env.get(k));
    if (missing.length) {
      console.error(`Missing env vars: ${missing.join(", ")}`);
      return new Response(JSON.stringify({ 
        error: `Variables d'environnement manquantes : ${missing.join(", ")}`,
        code: "ENV_MISSING"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // 2. Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(JSON.stringify({ 
        error: "Invalid request body - JSON expected",
        code: "INVALID_BODY"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { endpoint, params } = body;
    
    if (!endpoint) {
      return new Response(JSON.stringify({ 
        error: "Missing 'endpoint' parameter",
        code: "MISSING_ENDPOINT"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 3. Rate Limiting (per IP)
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    if (!checkRateLimit(clientIp)) {
      return new Response(JSON.stringify({ error: "Trop de requêtes. Réessaie dans une minute." }), {
        status: 429, headers: { ...corsHeaders, "Retry-After": "60", "Content-Type": "application/json" }
      });
    }

    const cacheKey = buildCacheKey(endpoint, params || {});
    const ttl = getTtlForEndpoint(endpoint, params || {});
    const supabase = getSupabaseClient();

    // 4a. Check in-memory cache (L1)
    const memCached = getMemoryCache(cacheKey);
    if (memCached) {
      console.log(`[api-football] MEMORY CACHE HIT: ${cacheKey}`);
      return new Response(JSON.stringify({ ...memCached, _cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MEMORY_HIT' },
        status: 200,
      });
    }

    // 4b. Check persistent database cache (L2)
    const cachedData = await getCachedResponse(supabase, cacheKey);

    if (cachedData) {
      console.log(`[api-football] DATABASE CACHE HIT: ${cacheKey}`);
      // Populate memory cache for next requests
      setMemoryCache(cacheKey, cachedData, ttl);
      return new Response(JSON.stringify({ ...cachedData, _cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
        status: 200,
      });
    }

    // 5. Check daily quota before making upstream call
    if (!checkDailyQuota()) {
      console.error(`[api-football] DAILY QUOTA REACHED: ${dailyRequestCount}/${DAILY_LIMIT}`);
      return new Response(JSON.stringify({ 
        error: "Quota journalier API atteint. Réessaie demain.",
        code: "DAILY_QUOTA_EXCEEDED",
        _dailyCount: dailyRequestCount,
      }), {
        status: 429, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const apiKey = Deno.env.get('API_FOOTBALL_KEY');

    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: "API_FOOTBALL_KEY not configured in Supabase secrets",
        code: "API_KEY_MISSING"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const queryParams = new URLSearchParams(params || {}).toString();
    const url = `https://v3.football.api-sports.io/${endpoint}${queryParams ? `?${queryParams}` : ''}`;

    console.log(`[api-football] CACHE MISS → Upstream: ${url} (daily: ${dailyRequestCount}/${DAILY_LIMIT})`);

    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
    });

    const data = await response.json();
    
    console.log(`[api-football] Response status: ${response.status}, results: ${data.results || 0}`);

    // 6. Store in caches (only successful responses)
    if (response.status === 200 && data && (!data.errors || (Array.isArray(data.errors) && data.errors.length === 0) || Object.keys(data.errors).length === 0)) {
      setMemoryCache(cacheKey, data, ttl);
      await setCachedResponse(supabase, cacheKey, data, ttl);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
      status: 200,
    });
  } catch (error) {
    console.error("[api-football] Error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      code: "INTERNAL_ERROR",
      stack: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
