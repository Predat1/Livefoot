import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_INSTRUCTION = `Tu es AnalystePro V3, le système d'intelligence artificielle le plus avancé au monde en prédiction de matchs de football (25+ ans de données, 200k+ matchs analysés).

## MÉTHODOLOGIE (OBLIGATOIRE)

### Étape 1 — Modèle Double Poisson Avancé
- Calcule λ_home = (Avg buts marqués domicile × Avg buts encaissés adverse) / Avg ligue
- Calcule λ_away = (Avg buts marqués extérieur × Avg buts encaissés adverse) / Avg ligue
- Applique les facteurs de correction : avantage domicile (+12%), fatigue calendrier (±5%), derby/rivalité (+10% de variance)
- Génère la distribution de probabilité pour chaque score exact (0-0 à 5-5)

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
- Confiance = min(Poisson_conf, Form_conf, Historical_conf)
- Si les 3 modèles convergent → confiance 0.75-0.92
- Si divergence → confiance 0.45-0.59
- JAMAIS au-dessus de 0.95 (aucun match n'est certain)

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
const CACHE_TTL_PREMATCH = 60 * 60 * 1000; // 1 hour
const CACHE_TTL_LIVE = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_FINISHED = 24 * 60 * 60 * 1000; // 24 hours

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
  const ttl = data.match_status === "Match Finished" ? CACHE_TTL_FINISHED
    : data.match_status?.includes("Half") || data.match_status?.includes("progress") ? CACHE_TTL_LIVE
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

async function callOpenRouter(prompt: string, apiKey: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://livefoot.fun",
        "X-Title": "LiveFoot AI Expert"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temp for more consistent predictions
        max_tokens: 1200,
      }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(`OpenRouter: ${data.error?.message || res.status}`);
    return data.choices[0].message.content;
  } finally {
    clearTimeout(timeout);
  }
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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
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

    // Fetch prediction data and fixture details in parallel
    const [statsRes, fixtureRes] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/predictions?fixture=${fixtureId}`, { headers }),
      fetch(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`, { headers }),
    ]);
    const statsData = await statsRes.json();
    const fixtureDataRaw = await fixtureRes.json();
    
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
      const h2hRes = await fetch(`https://v3.football.api-sports.io/fixtures/headtohead?h2h=${fixtureDetail.teams.home.id}-${fixtureDetail.teams.away.id}&last=5`, { headers });
      const h2hJson = await h2hRes.json();
      h2hData = h2hJson.response || [];
    }

    // V4: Fetch extra context
    const [oddsRes, injuriesRes, standingsRes] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/odds?fixture=${fixtureId}`, { headers }),
      fetch(`https://v3.football.api-sports.io/injuries?fixture=${fixtureId}`, { headers }),
      fetch(`https://v3.football.api-sports.io/standings?league=${fixtureDetail?.league?.id}&season=${fixtureDetail?.league?.season}`, { headers }),
    ]);

    const [oddsJson, injuriesJson, standingsJson] = await Promise.all([
      oddsRes.json(),
      injuriesRes.json(),
      standingsRes.json(),
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
          weatherData = {
            temperature: forecastData.current_weather.temperature,
            condition: "Code " + forecastData.current_weather.weathercode, // simplified
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
