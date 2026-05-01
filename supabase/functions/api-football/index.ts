import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory cache with TTL
const cache = new Map<string, { data: unknown; expiresAt: number }>();

const CACHE_TTL: Record<string, number> = {
  // Live data — short cache
  "fixtures": 60,           // 1 min for live scores
  "fixtures/events": 60,
  "fixtures/lineups": 120,
  "fixtures/statistics": 60,
  "fixtures/players": 120,
  // Semi-live
  "standings": 300,          // 5 min
  "players/topscorers": 300,
  "players/topassists": 300,
  "players/topredcards": 300,
  "players/topyellowcards": 300,
  // Static-ish data — long cache
  "leagues": 3600,           // 1 hour
  "teams": 3600,
  "teams/statistics": 600,
  "players": 600,
  "players/squads": 3600,
  "transfers": 1800,
  "trophies": 86400,
  "coaches": 3600,
  "venues": 86400,
  "countries": 86400,
  "odds": 300,
  "predictions": 600,
  "injuries": 600,
  "sidelined": 3600,
};

function getCacheTTL(endpoint: string): number {
  // Check exact match first, then prefix match
  if (CACHE_TTL[endpoint]) return CACHE_TTL[endpoint];
  const prefix = Object.keys(CACHE_TTL).find((k) => endpoint.startsWith(k));
  return prefix ? CACHE_TTL[prefix] : 120; // Default 2 min
}

function buildCacheKey(endpoint: string, params: Record<string, string>): string {
  const sorted = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return `${endpoint}?${sorted}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, params = {} } = await req.json();

    if (!endpoint || typeof endpoint !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'endpoint' parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize endpoint
    const cleanEndpoint = endpoint.replace(/^\/+/, "");

    // Check cache
    const cacheKey = buildCacheKey(cleanEndpoint, params);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return new Response(
        JSON.stringify({ ...cached.data as object, _cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build API URL
    const queryString = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");

    const apiUrl = `https://v3.football.api-sports.io/${cleanEndpoint}${queryString ? `?${queryString}` : ""}`;

    const apiKey = Deno.env.get("API_FOOTBALL_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-apisports-key": apiKey,
      },
    });

    const data = await response.json();

    // Detect API-level errors (invalid key, quota, etc.) and DO NOT cache them
    const hasApiError =
      data &&
      typeof data === "object" &&
      data.errors &&
      !Array.isArray(data.errors) &&
      Object.keys(data.errors).length > 0;

    // Cache the response only if it's a successful payload
    const ttl = getCacheTTL(cleanEndpoint);
    if (!hasApiError && response.ok) {
      cache.set(cacheKey, {
        data,
        expiresAt: Date.now() + ttl * 1000,
      });
    }

    // Clean expired cache entries periodically (every 100 requests)
    if (Math.random() < 0.01) {
      const now = Date.now();
      for (const [key, val] of cache) {
        if (now >= val.expiresAt) cache.delete(key);
      }
    }

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Cache-TTL": String(ttl),
        "X-Requests-Remaining": response.headers.get("x-ratelimit-requests-remaining") || "unknown",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
