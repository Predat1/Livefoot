import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const ALLOWED_ORIGINS = ["https://www.livefoot.fun", "https://www.livefoot.fun", "http://localhost:5173", "http://localhost:8080"];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
};

// Map en mémoire simple (reset à chaque cold start Deno)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requêtes
const RATE_WINDOW = 60_000; // par minute

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

const REQUIRED_ENV = ["OPENROUTER_API_KEY", "API_FOOTBALL_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

const SYSTEM_INSTRUCTION = `Tu es AnalystePro V4, le système d'intelligence artificielle le plus avancé au monde en prédiction de matchs de football (25+ ans de données, 200k+ matchs analysés).

## MÉTHODOLOGIE (OBLIGATOIRE)

### Étape 1 — Modèle Double Poisson Dixon-Coles
- Calcule λ_home = (AttaqueHome × DéfenseAdverse / λ_ligue) × 1.08 (avantage domicile)
- Calcule λ_away = (AttaqueAway × DéfenseHome / λ_ligue)
- Applique la correction Dixon-Coles ρ=-0.13 pour les scores {0-0, 1-0, 0-1, 1-1}
- Génère la distribution complète de probabilité (0-0 à 6-6) pour en déduire P(home), P(draw), P(away), P(BTTS), P(O/U 1.5/2.5/3.5)

### Étape 2 — Pondération ELO des Formes
- Les 5 derniers matchs ont des poids exponentiels décroissants : [1.0, 0.85, 0.72, 0.61, 0.52]
- Une victoire récente compte 70% plus qu'une victoire il y a 5 matchs
- Traite la forme domicile/extérieur séparément (une équipe peut être forte à domicile et faible à l'extérieur)

### Étape 3 — Cross-Validation Bookmaker
- Compare tes probabilités calculées aux probabilités implicites des cotes fournies
- Si ton modèle donne Home 65% mais les cotes impliquent Home 45%, c'est un signal fort → ajuste ou identifie un Value Bet
- Un écart > 15% entre ton modèle et les cotes = Value Bet potentiel

### Étape 4 — Facteurs Environnementaux & Humains (V4)
- **Arbitre** : Analyse sa tendance (cartons/penaltys). Un arbitre "sévère" favorise les Under en buts mais les Over en cartons.
- **Météo** : Pluie/Vent = Moins de buts, plus de fautes tactiques.
- **Enjeu** : Motivation selon le classement (Lutte relégation vs Titre).
- **Absences** : Évalue l'impact de l'absence des joueurs clés (impact sur le xG et la solidité défensive).

### Étape 5 — Calibration Confiance
- Confiance = agrégation pondérée(Poisson_conf × 0.4, Form_conf × 0.35, H2H_conf × 0.25)
- Si les 3 modèles convergent → confiance 0.72-0.89
- Si divergence entre modèles → confiance 0.42-0.57
- JAMAIS au-dessus de 0.92 (aucun match n'est certain)
- Indique toujours le niveau de convergence dans le reasoning

## ADAPTATION TEMPS RÉEL (CRITIQUE)
- Si "Terminé" → analyse post-match au passé, confiance basée sur la justesse du résultat
- Si "En direct" → le score ACTUEL est la base. Le score prédit ne peut PAS être inférieur au score actuel.
- Si "N'a pas commencé" → prédiction pré-match complète.

## RÈGLES ABSOLUES
1. OBJECTIVITÉ : Utilise UNIQUEMENT les données fournies. Pas d'a priori sur la réputation.
2. JSON STRICT : Aucun texte en dehors du JSON. Output parsable à 100%.
3. PRÉCISION : Vise une précision de 85-90% sur le marché 1X2 et Double Chance.
4. Chaque prédiction de marché DOIT avoir sa propre confiance calibrée.`;

// Cache TTLs in milliseconds
const CACHE_TTL_PREMATCH = 12 * 60 * 60 * 1000; // 12 hours (saves huge AI tokens for upcoming matches)
const CACHE_TTL_LIVE = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_FINISHED = 365 * 24 * 60 * 60 * 1000; // 365 days (match is done, prediction never changes)

// Supabase client initialization helper
function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
}

async function getCachedPredictionDB(fixtureId: string, supabase: any): Promise<{ data: any, status: 'fresh' | 'stale' | 'missing' | 'processing' }> {
  const { data, error } = await supabase
    .from('ai_predictions_cache')
    .select('*')
    .eq('fixture_id', fixtureId)
    .single();

  if (error || !data) return { data: null, status: 'missing' };

  // Vérifier si un verrou de traitement est actif (Mutex Lock)
  if (data.data && data.data._isProcessing) {
      const lockAge = Date.now() - (data.data._lockedAt || 0);
      // Le verrou est valide pendant 25 secondes max
      if (lockAge < 25000) { 
          // Stale-While-Revalidate : On retourne l'ancienne prédiction périmée si elle existe,
          // sinon on signale que c'est en cours de calcul
          return { data: data.data._staleData || null, status: 'processing' };
      }
      // Si le verrou est expiré (crash ou timeout API), on l'ignore et on retente
  }

  const age = Date.now() - new Date(data.updated_at).getTime();
  const isFinished = 
    data.match_status === "Match Finished" || 
    data.match_status === "FT" || 
    data.match_status === "AET" || 
    data.match_status === "PEN" ||
    data.match_status?.toLowerCase().includes("finish") || 
    data.match_status?.toLowerCase().includes("ended");

  const ttl = isFinished ? CACHE_TTL_FINISHED
    : data.match_status?.includes("Half") || data.match_status?.includes("progress") || data.match_status === "LIVE" ? CACHE_TTL_LIVE
    : CACHE_TTL_PREMATCH;

  if (age > ttl) {
    return { data: data.data, status: 'stale' };
  }
  
  return { data: data.data, status: 'fresh' };
}

async function acquireLockDB(fixtureId: string, staleData: any, matchStatus: string, supabase: any) {
  const lockPayload = { _isProcessing: true, _lockedAt: Date.now(), _staleData: staleData };
  const { error } = await supabase
    .from('ai_predictions_cache')
    .upsert({
      fixture_id: fixtureId,
      data: lockPayload,
      match_status: matchStatus,
      updated_at: new Date().toISOString()
    }, { onConflict: 'fixture_id' });
    
  if (error) console.error("Error acquiring lock in DB:", error);
}

async function setCachedPredictionDB(fixtureId: string, predictionData: any, matchStatus: string, supabase: any) {
  const { error } = await supabase
    .from('ai_predictions_cache')
    .upsert({
      fixture_id: fixtureId,
      data: predictionData,
      match_status: matchStatus,
      updated_at: new Date().toISOString()
    }, { onConflict: 'fixture_id' });
    
  if (error) console.error("Error caching prediction in DB:", error);
}

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

async function fetchWithCache(
  supabase: any,
  apiKey: string,
  endpoint: string,
  params: Record<string, string>
): Promise<any> {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const cacheKey = `${endpoint}?${sortedParams}`;
  const ttlMs = getTtlForEndpoint(endpoint, params);

  try {
    const { data: cached, error } = await supabase
      .from("api_football_cache")
      .select("data, expires_at")
      .eq("key", cacheKey)
      .single();

    if (!error && cached) {
      const expiresAt = new Date(cached.expires_at).getTime();
      if (Date.now() <= expiresAt) {
        console.log(`[ai-prediction] DB CACHE HIT for: ${cacheKey}`);
        return cached.data;
      }
    }
  } catch (err) {
    console.error(`[ai-prediction] DB Cache read error:`, err);
  }

  // Cache miss - Fetch from API-Football
  const queryParams = new URLSearchParams(params).toString();
  const url = `https://v3.football.api-sports.io/${endpoint}${queryParams ? `?${queryParams}` : ""}`;
  
  console.log(`[ai-prediction] DB CACHE MISS → Upstream: ${url}`);
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": "v3.football.api-sports.io",
    },
  });

  const data = await res.json();

  if (res.status === 200 && data && (!data.errors || (Array.isArray(data.errors) && data.errors.length === 0) || Object.keys(data.errors).length === 0)) {
    try {
      await supabase.from("api_football_cache").upsert({
        key: cacheKey,
        data,
        expires_at: new Date(Date.now() + ttlMs).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });
    } catch (err) {
      console.error(`[ai-prediction] DB Cache write error:`, err);
    }
  }

  return data;
}

function buildPrompt(
  homeTeam: string, 
  awayTeam: string, 
  leagueName: string, 
  predictionData: any, 
  h2hData: any[], 
  fixtureDetail: any,
  oddsData: any,
  injuriesData: any[],
  standingsData: any[],
  weatherData: any
) {
  const matchStatus = fixtureDetail?.fixture?.status?.long || 'Not Started';
  const currentMinute = fixtureDetail?.fixture?.status?.elapsed || 0;
  const currentScore = `${fixtureDetail?.goals?.home ?? 0}-${fixtureDetail?.goals?.away ?? 0}`;
  const referee = fixtureDetail?.fixture?.referee || "Inconnu";

  return `
📊 DATA (Contexte Injecté)

# MATCH CONTEXT
${homeTeam} vs ${awayTeam} (${leagueName})
Date: ${fixtureDetail?.fixture?.date ? new Date(fixtureDetail.fixture.date).toLocaleString() : 'N/A'}
Stade: ${fixtureDetail?.fixture?.venue?.name || 'Inconnu'}
Statut: ${matchStatus}
Minute Actuelle: ${currentMinute}
Score Actuel: ${currentScore}

# POISSON MODEL
Probabilités: Home ${predictionData?.predictions?.percent?.home || '?'} | Draw ${predictionData?.predictions?.percent?.draw || '?'} | Away ${predictionData?.predictions?.percent?.away || '?'}
Goals Predicted: Home ${predictionData?.predictions?.goals?.home || '?'} | Away ${predictionData?.predictions?.goals?.away || '?'}
Advice: ${predictionData?.predictions?.advice || 'N/A'}
Winner: ${predictionData?.predictions?.winner?.name || '?'} (${predictionData?.predictions?.winner?.comment || ''})

# TEAM STATS
HOME: Forme ${predictionData?.comparison?.form?.home || '?'} | Attaque ${predictionData?.comparison?.att?.home || '?'} | Défense ${predictionData?.comparison?.def?.home || '?'} | Poisson ${predictionData?.comparison?.poisson_distribution?.home || '?'} | Total ${predictionData?.comparison?.total?.home || '?'}
AWAY: Forme ${predictionData?.comparison?.form?.away || '?'} | Attaque ${predictionData?.comparison?.att?.away || '?'} | Défense ${predictionData?.comparison?.def?.away || '?'} | Poisson ${predictionData?.comparison?.poisson_distribution?.away || '?'} | Total ${predictionData?.comparison?.total?.away || '?'}

# TEAM DETAILS
HOME Last 5: ${predictionData?.teams?.home?.last_5?.form || '?'} | Goals Avg ${predictionData?.teams?.home?.last_5?.goals?.for?.average || '?'} scored / ${predictionData?.teams?.home?.last_5?.goals?.against?.average || '?'} conceded
AWAY Last 5: ${predictionData?.teams?.away?.last_5?.form || '?'} | Goals Avg ${predictionData?.teams?.away?.last_5?.goals?.for?.average || '?'} scored / ${predictionData?.teams?.away?.last_5?.goals?.against?.average || '?'} conceded

# STANDINGS & H2H
H2H (Derniers 5 matchs):
${h2hData.map((m: any) => `- ${m.teams.home.name} ${m.goals.home}-${m.goals.away} ${m.teams.away.name}`).join('\\n')}

CLASSEMENT :
${standingsData.map((s: any) => `- Pos ${s.rank}: ${s.team.name} | Pts: ${s.points} | Form: ${s.form}`).join('\\n')}

# MARKET (ODDS)
${oddsData ? JSON.stringify(oddsData) : 'Cotes non disponibles'}

# HUMAN & ENVIRONMENT
Referee: ${referee}
Weather: ${weatherData ? `${weatherData.temperature}°C, ${weatherData.condition}` : 'Inconnu'}
Injuries:
${injuriesData.length > 0 ? injuriesData.map((i: any) => `- ${i.team.name}: ${i.player.name} (${i.type})`).join('\\n') : 'Aucune absence majeure signalée'}

---

# TASK

Génère une analyse précise en tenant compte :
1. Du STATUT DU MATCH (Crucial : adapte tout le JSON si le match est en cours ou terminé).
2. Du Modèle Poisson (prioritaire en pré-match).
3. De la Forme, des stats, blessures et H2H.
4. De la comparaison avec les cotes pour extraire un value bet (si pertinent).

---

# OUTPUT (JSON STRICT)

{
  "matchState": "Pré-match|En direct|Terminé",
  "analysis": "4 phrases max, style expert ultra-précis. Adapter le temps (futur, présent ou passé) selon le matchState.",
  "reasoning": "3 insights clés basés sur la data (inclure xG, forme ELO, et impact du score actuel si en direct)",
  "predictedScore": "X-Y",
  "confidence": 0.85,
  "confidenceStars": 4,
  "keyFactor": "facteur décisif le plus impactant",
  
  "homeWinProb": 55,
  "drawProb": 22,
  "awayWinProb": 23,
  
  "xgHome": 1.5,
  "xgAway": 1.1,
  
  "valueBet": "pari sous-côté précis ou null",
  "valueBetOdds": "cote attendue ou null",
  
  "predictions": {
    "winner": "1|X|2",
    "winnerConfidence": 0.78,
    "btts": "Oui|Non",
    "bttsConfidence": 0.75,
    "overUnder25": "Over|Under",
    "overUnder25Confidence": 0.80,
    "overUnder35": "Over|Under",
    "overUnder15": "Over|Under",
    "doubleChance": "1X|X2|12",
    "doubleChanceConfidence": 0.88,
    "exactScore": "X-Y",
    "exactScoreConfidence": 0.15,
    "corners": "Over 9.5|Under 9.5",
    "cornersConfidence": 0.65,
    "cards": "Over 3.5|Under 3.5",
    "cardsConfidence": 0.60,
    "possession": "XX%-XX%",
    "firstScorer": "nom du joueur ou Inconnu",
    "anytimeScorer": "nom du joueur ou Inconnu",
    "penalty": "Oui|Non",
    "var": "Oui|Non",
    "cleanSheet": "Home|Away|None",
    "cleanSheetConfidence": 0.55,
    "timingFirstGoal": "0-15|16-30|31-45|46-60|61-75|76-90",
    "highestScoringHalf": "1st|2nd|Equal",
    "winningMargin": "Draw|1|2|3+"
  }
}

IMPORTANT: En direct, utilise le score actuel comme point de départ. Si le score est 2-0 à la 70e, le score prédit DOIT être au moins 2-0. Estime les probabilités de buts supplémentaires basées sur le momentum.`;
}

const MODEL_FALLBACK_CHAIN = [
  "google/gemini-2.5-flash-preview",
  "google/gemini-2.0-flash-001",
  "anthropic/claude-3-haiku",
];

async function callOpenRouter(prompt: string, apiKey: string): Promise<string> {
  let lastError: Error | null = null;

  for (const model of MODEL_FALLBACK_CHAIN) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 28000);

    try {
      console.log(`Trying model: ${model}`);
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://www.livefoot.fun",
          "X-Title": "LiveFoot AnalystePro V4"
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 2000,
        }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(`OpenRouter [${model}]: ${data.error?.message || res.status}`);
      }
      const content = data.choices[0].message.content;
      console.log(`Success with model: ${model}`);
      return content;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed: ${err.message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error("Tous les modèles IA ont échoué");
}



function safeParseJSON(text: string): any {
  try { 
    return JSON.parse(text); 
  } catch {
    // Nettoyage agressif des balises Markdown (ex: ```json ... ```)
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json/, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```/, "");
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();
    
    try {
      return JSON.parse(cleanedText);
    } catch {
      // Fallback ultime avec Regex
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error("Impossible de parser la réponse IA. Format invalide.");
    }
  }
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  try {
    // 1. Vérification des variables d'environnement
    const missing = REQUIRED_ENV.filter(k => !Deno.env.get(k));
    if (missing.length) {
      throw new Error(`Variables d'environnement manquantes : ${missing.join(", ")}`);
    }

    // 2. Rate Limiting
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    if (!checkRateLimit(clientIp)) {
      return new Response(JSON.stringify({ error: "Trop de requêtes. Réessaie dans une minute." }), {
        status: 429, headers: { ...corsHeaders, "Retry-After": "60", "Content-Type": "application/json" }
      });
    }

    const { fixtureId, homeTeam, awayTeam, leagueName } = await req.json();
    if (!fixtureId) throw new Error("Fixture ID requis");

    const supabase = getSupabaseClient();

    // Check DB cache first
    const cacheResult = await getCachedPredictionDB(fixtureId, supabase);
    
    // 1. FRESH: Return immediately
    if (cacheResult.status === 'fresh' && cacheResult.data) {
      return new Response(JSON.stringify({ ...cacheResult.data, _cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. PROCESSING: A worker is already computing it
    if (cacheResult.status === 'processing') {
      if (cacheResult.data) {
        // Stale-While-Revalidate: Return stale data to user immediately
        return new Response(JSON.stringify({ ...cacheResult.data, _cached: true, _stale: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // First ever request is processing, tell client to wait
        return new Response(JSON.stringify({ status: "processing", message: "Analyse IA en cours d'initialisation..." }), {
          status: 202, // Accepted
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 3. MISSING or STALE: We become the Leader and compute
    // Fire-and-forget: Acquire the lock immediately before calling external APIs
    const currentMatchStatus = "Unknown"; // Will be updated later, lock is temporary
    await acquireLockDB(fixtureId, cacheResult.data, currentMatchStatus, supabase);

    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
    const apiFootballKey = Deno.env.get("API_FOOTBALL_KEY");

    if (!apiFootballKey) throw new Error("API_FOOTBALL_KEY non configurée");
    if (!openRouterKey) throw new Error("OPENROUTER_API_KEY non configurée");

    const headers = { "x-apisports-key": apiFootballKey };

    // Fetch prediction data and fixture details in parallel using DB cache
    const [statsData, fixtureDataRaw] = await Promise.all([
      fetchWithCache(supabase, apiFootballKey, "predictions", { fixture: String(fixtureId) }),
      fetchWithCache(supabase, apiFootballKey, "fixtures", { id: String(fixtureId) }),
    ]);
    
    // Gestion stricte des erreurs d'API (Quota, Auth, etc.)
    if (statsData.errors && Object.keys(statsData.errors).length > 0) {
      console.error("API-Football Error (Predictions):", statsData.errors);
      throw new Error("Erreur API-Football (Prédictions indisponibles ou Quota atteint)");
    }
    if (fixtureDataRaw.errors && Object.keys(fixtureDataRaw.errors).length > 0) {
      console.error("API-Football Error (Fixtures):", fixtureDataRaw.errors);
      throw new Error("Erreur API-Football (Détails du match indisponibles)");
    }

    const predictionData = statsData.response?.[0];
    const fixtureDetail = fixtureDataRaw.response?.[0];

    // Fetch H2H only if we have team IDs
    let h2hData: any[] = [];
    if (fixtureDetail?.teams?.home?.id && fixtureDetail?.teams?.away?.id) {
      const h2hJson = await fetchWithCache(supabase, apiFootballKey, "fixtures/headtohead", {
        h2h: `${fixtureDetail.teams.home.id}-${fixtureDetail.teams.away.id}`,
        last: "5"
      });
      h2hData = h2hJson.response || [];
    }

    // V4: Fetch extra context with DB cache
    const [oddsJson, injuriesJson, standingsJson] = await Promise.all([
      fetchWithCache(supabase, apiFootballKey, "odds", { fixture: String(fixtureId) }),
      fetchWithCache(supabase, apiFootballKey, "injuries", { fixture: String(fixtureId) }),
      fetchWithCache(supabase, apiFootballKey, "standings", {
        league: String(fixtureDetail?.league?.id || ""),
        season: String(fixtureDetail?.league?.season || "")
      }),
    ]);

    const oddsData = oddsJson.response?.[0]?.bookmakers?.[0]?.bets?.find((b: any) => b.name === "Match Winner");
    const injuriesData = injuriesJson.response || [];
    const leagueStandings = standingsJson.response?.[0]?.league?.standings?.[0] || [];
    const teamStandings = leagueStandings.filter((s: any) => 
      s.team.id === fixtureDetail?.teams?.home?.id || s.team.id === fixtureDetail?.teams?.away?.id
    );

    // Weather: Open-Meteo (Free)
    let weatherData = null;
    if (fixtureDetail?.fixture?.venue?.city) {
      try {
        const city = fixtureDetail.fixture.venue.city;
        const weatherRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const cityData = await weatherRes.json();
        if (cityData.results?.[0]) {
          const { latitude, longitude } = cityData.results[0];
          const forecastRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
          const forecastData = await forecastRes.json();
          const wCode = forecastData.current_weather?.weathercode ?? 0;
          const wCondition = wCode === 0 ? "Ciel dégagé" :
            wCode <= 3 ? "Nuageux" :
            wCode <= 67 ? "Pluie" :
            wCode <= 77 ? "Neige" :
            wCode <= 82 ? "Averses" :
            wCode <= 99 ? "Orage" : "Variable";
          weatherData = {
            temperature: forecastData.current_weather.temperature,
            condition: wCondition,
          };
        }
      } catch (e) {
        console.warn("Weather fetch failed", e);
      }
    }

    const prompt = buildPrompt(
      homeTeam, 
      awayTeam, 
      leagueName, 
      predictionData, 
      h2hData, 
      fixtureDetail,
      oddsData,
      injuriesData,
      teamStandings,
      weatherData
    );

    let content: string;
    let provider = "openrouter";
    
    if (!openRouterKey) throw new Error("Pas de clé OpenRouter");
    content = await callOpenRouter(prompt, openRouterKey);

    const aiPrediction = safeParseJSON(content);
    const result = { ...aiPrediction, _provider: provider };

    // Cache the result in DB
    const matchStatus = fixtureDetail?.fixture?.status?.long || "Not Started";
    // Fire and forget caching to not block response
    setCachedPredictionDB(fixtureId, result, matchStatus, supabase).catch(console.error);

    // V4: Store in history if match is finished
    if (matchStatus === "Match Finished" || fixtureDetail?.fixture?.status?.short === "FT") {
      const homeScore = fixtureDetail?.goals?.home ?? 0;
      const awayScore = fixtureDetail?.goals?.away ?? 0;
      const actualResult = homeScore > awayScore ? "1" : homeScore < awayScore ? "2" : "X";
      const predictedResult = result.predictions?.winner;
      
      supabase.from("ai_predictions_history").upsert({
        fixture_id: fixtureId,
        home_team: homeTeam,
        away_team: awayTeam,
        predicted_score: result.predictedScore,
        actual_score: `${homeScore}-${awayScore}`,
        is_correct: result.predictedScore === `${homeScore}-${awayScore}`,
        market_1x2_correct: predictedResult === actualResult,
        prediction_data: result
      }, { onConflict: 'fixture_id' }).catch(console.error);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-prediction error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
