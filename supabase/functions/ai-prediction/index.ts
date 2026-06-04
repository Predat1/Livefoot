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

const SYSTEM_INSTRUCTION = `Tu es AnalystePro V5, un moteur professionnel de pronostics football. Ta priorité n'est pas de produire une réponse séduisante, mais une analyse utile, calibrée et vérifiable à partir des données injectées.

## PRINCIPES NON NÉGOCIABLES
1. Ne jamais inventer une donnée absente. Si une information manque, indique son absence dans dataQuality.missing et réduis la confiance.
2. Chaque conclusion doit venir d'au moins un signal concret: forme récente, classement, xG attendu, H2H, score live, événements, blessures, météo, cotes ou dynamique de marché.
3. Interdiction du générique: pas de phrases comme "les deux équipes sont motivées" sans preuve chiffrée ou contexte exact.
4. La précision vient de la calibration, pas de la surconfiance. Aucun match n'est certain.
5. Les marchés à forte variance comme score exact, premier buteur, VAR et penalty doivent avoir une confiance prudente sauf donnée directe forte.

## MÉTHODOLOGIE OBLIGATOIRE

### 1. Qualité des données
- Évalue d'abord les données disponibles: API-Football predictions, fixture detail, forme 5 matchs, H2H, classement, cotes, blessures, météo, live stats/events.
- dataQuality.level = "high" si au moins 5 blocs utiles sont présents, "medium" si 3-4, "low" si moins de 3.
- Si dataQuality.level = low, confidence maximum 0.58 et valueBet doit être null sauf edge bookmaker extrêmement clair.

### 2. Modèle buts et score
- Utilise les probabilités API-Football comme base, mais recalcule mentalement une ligne xG cohérente avec attaque/défense, forme et domicile/extérieur.
- Construis un scénario de buts: rythme attendu, probabilité BTTS, seuil Over/Under 1.5/2.5/3.5, et score modal.
- En live, pars du score actuel et de la minute: le score prédit ne peut jamais être inférieur au score déjà acquis.
- Après 70e minute, réduis fortement la probabilité de gros retournement sauf rouge, domination statistique ou événement majeur.

### 3. Forme et contexte compétitif
- Pondère les 5 derniers matchs avec plus de poids aux 2 plus récents.
- Sépare forme domicile de l'équipe home et forme extérieure de l'équipe away quand les données le permettent.
- Utilise le classement pour mesurer l'enjeu: titre, qualification, maintien, barrage, match amical, coupe ou faible enjeu.

### 4. Marché et value bet
- Convertis les cotes disponibles en probabilité implicite approximative.
- Value bet seulement si ton estimation dépasse le marché d'au moins 8 points et que les données sont medium/high.
- Si les cotes sont absentes ou incohérentes, valueBet = null.
- Signale aussi les marchés à éviter dans avoidMarkets quand la variance est trop forte.

### 5. Calibration confiance
- confidence est un nombre entre 0 et 1.
- 0.35-0.50: données faibles, match instable ou signaux contradictoires.
- 0.51-0.64: lecture exploitable mais fragile.
- 0.65-0.76: bons signaux convergents.
- 0.77-0.86: très forte convergence entre modèle, forme, contexte et marché.
- Maximum absolu 0.88, sauf match terminé où l'analyse est post-match.
- confidenceStars = arrondi de confidence * 5.

## FORMAT ET STYLE
- JSON strict uniquement, aucun Markdown, aucun texte hors JSON.
- analysis: 3 à 5 phrases concrètes, citant les signaux dominants.
- reasoning: synthèse dense en 3 points séparés par " | ".
- keyFactor: un facteur spécifique, pas un intitulé générique.
- Toutes les prédictions doivent rester cohérentes entre elles: winner, doubleChance, exactScore, xG, BTTS et Over/Under ne doivent pas se contredire.
- Si une donnée de joueur manque, firstScorer et anytimeScorer doivent être "Inconnu".`;

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
      "x-apisports-key": apiKey,
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
  weatherData: any,
  homeRecentMatches: any[],
  awayRecentMatches: any[],
  liveStats: any,
  liveEvents: any[],
  topStandings: any[],
  bottomStandings: any[]
) {
  const matchStatus = fixtureDetail?.fixture?.status?.long || 'Not Started';
  const currentMinute = fixtureDetail?.fixture?.status?.elapsed || 0;
  const currentScore = `${fixtureDetail?.goals?.home ?? 0}-${fixtureDetail?.goals?.away ?? 0}`;
  const referee = fixtureDetail?.fixture?.referee || "Inconnu";

  const formatRecentMatches = (matches: any[], teamId: number) => {
    if (!matches || matches.length === 0) return 'Non disponible';
    return matches.map((m: any) => {
      const date = m.fixture?.date ? new Date(m.fixture.date).toLocaleDateString("fr-FR") : '';
      const home = m.teams?.home?.name || '';
      const away = m.teams?.away?.name || '';
      const homeScore = m.goals?.home ?? 0;
      const awayScore = m.goals?.away ?? 0;
      const isHome = m.teams?.home?.id === teamId;
      const outcome = (homeScore === awayScore) ? "Nul" 
        : ((homeScore > awayScore && isHome) || (awayScore > homeScore && !isHome)) ? "Victoire" : "Défaite";
      return `- ${date} : ${home} ${homeScore}-${awayScore} ${away} (${outcome})`;
    }).join('\n');
  };

  const formatLiveStats = (stats: any) => {
    if (!stats || stats.length === 0) return 'Pas de statistiques en direct disponibles.';
    return stats.map((teamStats: any) => {
      const teamName = teamStats.team?.name || '';
      const statLines = (teamStats.statistics || []).map((s: any) => `  - ${s.type}: ${s.value ?? 0}`).join('\n');
      return `### ${teamName}\n${statLines}`;
    }).join('\n\n');
  };

  const formatLiveEvents = (events: any[]) => {
    if (!events || events.length === 0) return 'Aucun événement notable (buts, cartons) pour le moment.';
    return events.map((e: any) => {
      const min = e.time?.elapsed + (e.time?.extra ? `+${e.time.extra}` : '');
      const team = e.team?.name || '';
      const type = e.type || '';
      const detail = e.detail || '';
      const player = e.player?.name || '';
      const assist = e.assist?.name ? ` (assist: ${e.assist.name})` : '';
      return `- [${min}'] ${team} - ${type} (${detail}) par ${player}${assist}`;
    }).join('\n');
  };

  const formatStandingHeader = (standings: any[]) => {
    return standings.map((s: any) => `- Pos ${s.rank}: ${s.team.name} | Pts: ${s.points} | Matchs: ${s.all?.played} (G:${s.all?.win} N:${s.all?.draw} P:${s.all?.lose}) | Form: ${s.form || '?'}`).join('\n');
  };

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

# TEAM DETAILS & FORM
HOME Last 5 matches:
${formatRecentMatches(homeRecentMatches, fixtureDetail?.teams?.home?.id)}

AWAY Last 5 matches:
${formatRecentMatches(awayRecentMatches, fixtureDetail?.teams?.away?.id)}

# STANDINGS & H2H
H2H (Derniers 5 matchs):
${h2hData.map((m: any) => `- ${m.teams.home.name} ${m.goals.home}-${m.goals.away} ${m.teams.away.name}`).join('\n')}

CLASSEMENT GÉNÉRAL (TOP 5 / REFLÉGATIONS) :
**Top 5 :**
${formatStandingHeader(topStandings)}
**Bas de tableau :**
${formatStandingHeader(bottomStandings)}

**Position des équipes du match :**
${standingsData.map((s: any) => `- Pos ${s.rank}: ${s.team.name} | Pts: ${s.points} | Form: ${s.form}`).join('\n')}

# LIVE MATCH CONTEXT (Seulement si le match est en cours ou LIVE)
Statut du Match: ${matchStatus} (Minute: ${currentMinute})
Score en direct: ${currentScore}

## Statistiques en Direct :
${formatLiveStats(liveStats)}

## Événements en Direct :
${formatLiveEvents(liveEvents)}

# MARKET (ODDS)
${oddsData ? JSON.stringify(oddsData) : 'Cotes non disponibles'}

# HUMAN & ENVIRONMENT
Referee: ${referee}
Weather: ${weatherData ? `${weatherData.temperature}°C, ${weatherData.condition}` : 'Inconnu'}
Injuries:
${injuriesData.length > 0 ? injuriesData.map((i: any) => `- ${i.team.name}: ${i.player.name} (${i.type})`).join('\n') : 'Aucune absence majeure signalée'}

---

# TASK

Produis un pronostic professionnel, non générique, en suivant cet ordre:
1. Diagnostiquer la qualité de données disponible et lister ce qui manque.
2. Établir le scénario de match le plus probable avec xG, score modal, dynamique de forme, classement et contexte live si applicable.
3. Comparer ton scénario aux cotes disponibles. Déclarer un value bet uniquement si l'edge est défendable.
4. Séparer les marchés sûrs, les marchés moyens et les marchés à éviter.
5. Calibrer la confiance selon les données réellement disponibles, pas selon le nom des équipes.

Règles anti-générique:
- Cite au moins 3 signaux concrets dans analysis ou reasoning.
- Si les cotes, lineups, blessures ou stats live sont absentes, dis-le dans dataQuality.missing.
- Ne propose jamais firstScorer ou anytimeScorer avec un nom inventé.
- Ne force pas un pari: si le match est trop incertain, safestPick doit être une option prudente ou "Aucun pari fort".

---

# OUTPUT (JSON STRICT)

{
  "matchState": "Pré-match|En direct|Terminé",
  "dataQuality": {
    "level": "high|medium|low",
    "usableSignals": ["forme récente", "classement", "cotes"],
    "missing": ["lineups", "blessures", "stats live"]
  },
  "analysis": "3 à 5 phrases précises, sans généralités, avec les signaux chiffrés ou contextuels les plus importants.",
  "reasoning": "Signal 1 concret | Signal 2 concret | Signal 3 concret",
  "predictedScore": "X-Y",
  "confidence": 0.68,
  "confidenceStars": 4,
  "keyFactor": "facteur décisif le plus impactant",
  "riskLevel": "low|medium|high",
  
  "homeWinProb": 55,
  "drawProb": 22,
  "awayWinProb": 23,
  
  "xgHome": 1.5,
  "xgAway": 1.1,
  
  "valueBet": "pari sous-côté précis ou null",
  "valueBetOdds": "cote attendue ou null",
  "safestPick": "marché le plus robuste ou Aucun pari fort",
  "avoidMarkets": ["score exact", "premier buteur"],
  "marketEdges": [
    {
      "market": "1X2|BTTS|Over/Under|Double Chance",
      "pick": "sélection",
      "modelProb": 62,
      "bookmakerProb": 54,
      "edge": 8,
      "confidence": 0.64
    }
  ],
  
  "predictions": {
    "winner": "1|X|2",
    "btts": "Oui|Non",
    "overUnder05": "Over|Under",
    "overUnder15": "Over|Under",
    "overUnder25": "Over|Under",
    "overUnder35": "Over|Under",
    "overUnder45": "Over|Under",
    "doubleChance": "1X|X2|12",
    "exactScore": "X-Y",
    "corners": "Over 9.5|Under 9.5",
    "cards": "Over 3.5|Under 3.5",
    "possession": "XX%-XX%",
    "shots": "Plus de 8.5",
    "shotsOnTarget": "Plus de 4.5",
    "fouls": "Plus de 22.5",
    "offsides": "Moins de 4.5",
    "firstScorer": "nom ou Inconnu",
    "anytimeScorer": "nom ou Inconnu",
    "penalty": "Oui|Non",
    "var": "Oui|Non",
    "cleanSheet": "Home|Away|None",
    "timingFirstGoal": "0-15|16-30|31-45|46-60|61-75|76-90",
    "highestScoringHalf": "1st|2nd|Equal",
    "winningMargin": "Draw|1|2|3+",
    "htft": "1/1|X/1|2/1|...",
    "drawNoBet": "1|2"
  }
}

IMPORTANT:
- En direct, utilise le score actuel comme point de départ. Si le score est 2-0 à la 70e, le score prédit DOIT être au moins 2-0.
- Si les données sont faibles, ne masque pas l'incertitude: baisse confidence, remplis missing, et privilégie safestPick.
- Les pourcentages home/draw/away doivent totaliser environ 100.
- Les marchés de prediction doivent être cohérents entre eux.`;
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
          "X-Title": "LiveFoot AnalystePro V5"
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.12,
          top_p: 0.85,
          max_tokens: 2800,
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
    const topStandings = leagueStandings.slice(0, 5);
    const bottomStandings = leagueStandings.slice(-3);

    // Fetch last 5 fixtures for both teams (Home / Away) for deeper context
    let homeRecentMatches: any[] = [];
    let awayRecentMatches: any[] = [];
    
    if (fixtureDetail?.teams?.home?.id && fixtureDetail?.teams?.away?.id) {
      try {
        const [homeRecentJson, awayRecentJson] = await Promise.all([
          fetchWithCache(supabase, apiFootballKey, "fixtures", {
            team: String(fixtureDetail.teams.home.id),
            last: "5"
          }),
          fetchWithCache(supabase, apiFootballKey, "fixtures", {
            team: String(fixtureDetail.teams.away.id),
            last: "5"
          })
        ]);
        homeRecentMatches = homeRecentJson.response || [];
        awayRecentMatches = awayRecentJson.response || [];
      } catch (err) {
        console.error("Error fetching recent fixtures:", err);
      }
    }

    // Fetch live statistics and events if match is in progress
    let liveStats: any = null;
    let liveEvents: any[] = [];
    const isLive = ["1H", "2H", "HT", "ET", "P", "BT", "LIVE", "INT"].includes(fixtureDetail?.fixture?.status?.short || "");
    
    if (isLive) {
      try {
        const [liveStatsJson, liveEventsJson] = await Promise.all([
          fetchWithCache(supabase, apiFootballKey, "fixtures/statistics", { fixture: String(fixtureId) }),
          fetchWithCache(supabase, apiFootballKey, "fixtures/events", { fixture: String(fixtureId) })
        ]);
        liveStats = liveStatsJson.response;
        liveEvents = liveEventsJson.response || [];
      } catch (err) {
        console.error("Error fetching live details:", err);
      }
    }

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
      weatherData,
      homeRecentMatches,
      awayRecentMatches,
      liveStats,
      liveEvents,
      topStandings,
      bottomStandings
    );

    if (!openRouterKey) throw new Error("Pas de clé OpenRouter");
    const content: string = await callOpenRouter(prompt, openRouterKey);
    const provider = "openrouter";

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
