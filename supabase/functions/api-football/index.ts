import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory cache with TTL
const cache = new Map<string, { data: unknown; expiresAt: number }>();

const CACHE_TTL: Record<string, number> = {
  // Live data — cache increased to save credits
  "fixtures": 900,           // 15 min (was 1 min)
  "fixtures/events": 900,
  "fixtures/lineups": 3600,   // 1 hour
  "fixtures/statistics": 900,
  "fixtures/players": 3600,
  // Semi-live
  "standings": 43200,         // 12 hours (was 5 min)
  "players/topscorers": 43200,
  "players/topassists": 43200,
  "players/topredcards": 43200,
  "players/topyellowcards": 43200,
  // Static-ish data — long cache
  "leagues": 86400,           // 24 hours
  "teams": 86400,
  "teams/statistics": 21600,  // 6 hours
  "players": 21600,
  "players/squads": 86400,
  "transfers": 86400,
  "trophies": 86400,
  "coaches": 86400,
  "venues": 86400,
  "countries": 86400,
  "odds": 3600,               // 1 hour
  "predictions": 43200,       // 12 hours
  "injuries": 3600,           // 1 hour
  "sidelined": 86400,
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
      console.error("DEBUG: API_FOOTBALL_KEY is missing in Supabase Secrets!");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`DEBUG: Calling API Football: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-apisports-key": apiKey,
      },
    });

    const data = await response.json();
    console.log(`DEBUG: API Response status: ${response.status}`);
    
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error("DEBUG: API Football returned errors:", data.errors);
    }

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
