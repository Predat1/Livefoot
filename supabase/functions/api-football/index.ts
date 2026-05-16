import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ALLOWED_ORIGINS = ["https://www.livefoot.fun", "https://www.livefoot.fun", "http://localhost:5173", "http://localhost:8080"];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // higher limit for general API proxy
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

// ─── In-Memory Cache ─────────────────────────────────────────
// Protects against quota exhaustion: multiple users hitting the same
// endpoint within the TTL window share a single upstream API call.

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

// Max cache entries to prevent memory leaks on long-running instances
const MAX_CACHE_ENTRIES = 500;

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

/** Evict expired entries + enforce max size */
function evictCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now > entry.expiresAt) cache.delete(key);
  }
  // If still over limit, remove oldest entries
  if (cache.size > MAX_CACHE_ENTRIES) {
    const entries = [...cache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    const toRemove = cache.size - MAX_CACHE_ENTRIES;
    for (let i = 0; i < toRemove; i++) {
      cache.delete(entries[i][0]);
    }
  }
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

const REQUIRED_ENV = ["API_FOOTBALL_KEY"];

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

    // 4. Check in-memory cache
    const cacheKey = buildCacheKey(endpoint, params || {});
    const ttl = getTtlForEndpoint(endpoint, params || {});
    const now = Date.now();
    const cached = cache.get(cacheKey);

    if (cached && now < cached.expiresAt) {
      console.log(`[api-football] CACHE HIT: ${cacheKey} (expires in ${Math.round((cached.expiresAt - now) / 1000)}s)`);
      return new Response(JSON.stringify({ ...(cached.data as object), _cached: true }), {
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

    // 6. Store in cache (only successful responses)
    if (response.status === 200 && data && !data.errors?.length) {
      cache.set(cacheKey, { data, expiresAt: now + ttl });
      // Periodic eviction
      if (cache.size > MAX_CACHE_ENTRIES * 0.9) evictCache();
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
