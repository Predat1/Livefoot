import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ALLOWED_ORIGINS = ["https://livefoot.fun", "https://www.livefoot.fun", "http://localhost:5173", "http://localhost:8080"];

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

    // 3. Rate Limiting
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    if (!checkRateLimit(clientIp)) {
      return new Response(JSON.stringify({ error: "Trop de requêtes. Réessaie dans une minute." }), {
        status: 429, headers: { ...corsHeaders, "Retry-After": "60", "Content-Type": "application/json" }
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

    console.log(`[api-football] Fetching: ${url} for IP: ${clientIp}`);

    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
    });

    const data = await response.json();
    
    console.log(`[api-football] Response status: ${response.status}, errors: ${data.errors?.length || 0}`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
