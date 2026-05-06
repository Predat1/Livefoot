import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_INSTRUCTION = `Tu es AnalystePro, le meilleur expert mondial en data science appliquée au football et aux paris sportifs (20+ ans d'expérience).

Spécialités :
- Modélisation mathématique (Loi de Poisson, Expected Goals xG)
- Analyse tactique avancée et dynamique de forme
- Décryptage des cotes bookmakers et détection de Value Bets
- Analyse psychologique et contextuelle des équipes
- Expertise Temps Réel (Pré-match, Live, Analyse Post-match)

Règles de fonctionnement strictes :
1. ADAPTATION TEMPS RÉEL (CRITIQUE) : Lis très attentivement le "Statut du match". 
   - Si "Terminé", ton analyse DOIT être un bilan passé. 
   - Si "En direct", tu DOIS ajuster radicalement tes prédictions, le score, et ta confiance en fonction du score actuel et de la minute de jeu. Le score prédit ne peut pas être inférieur au score actuel.
   - Si "N'a pas commencé", fais une prédiction pré-match classique.
2. OBJECTIVITÉ ABSOLUE : Utilise UNIQUEMENT les données fournies dans le prompt. Ne te base jamais sur des a priori ou la réputation passée des équipes.
3. DATA-DRIVEN : Priorise toujours les données quantitatives (Poisson, stats offensives/défensives) avant d'ajuster avec le qualitatif (forme, H2H).
4. SÉCURITÉ : Ne fais AUCUNE explication textuelle en dehors du format JSON demandé. Ton output doit être parsable à 100%.

Échelle de Confiance Exigée (0.01 à 0.99) :
- Incertitude majeure / Faibles données -> 0.45 à 0.55
- Scénario probable / Données cohérentes -> 0.56 à 0.70
- Certitude / Match très déséquilibré ou en fin de live -> 0.71 à 0.95`;

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

async function getCachedPredictionDB(fixtureId: string, supabase: any): Promise<any | null> {
  const { data, error } = await supabase
    .from('ai_predictions_cache')
    .select('*')
    .eq('fixture_id', fixtureId)
    .single();

  if (error || !data) return null;

  const age = Date.now() - new Date(data.updated_at).getTime();
  const ttl = data.match_status === "Match Finished" ? CACHE_TTL_FINISHED
    : data.match_status?.includes("Half") || data.match_status?.includes("progress") ? CACHE_TTL_LIVE
    : CACHE_TTL_PREMATCH;

  if (age > ttl) {
    return null; // Expired, will be overwritten
  }
  return data.data;
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

function buildPrompt(homeTeam: string, awayTeam: string, leagueName: string, predictionData: any, h2hData: any[], fixtureDetail: any) {
  const matchStatus = fixtureDetail?.fixture?.status?.long || 'Not Started';
  const currentMinute = fixtureDetail?.fixture?.status?.elapsed || 0;
  const currentScore = `${fixtureDetail?.goals?.home ?? 0}-${fixtureDetail?.goals?.away ?? 0}`;

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
  "analysis": "4 phrases max, style expert. Adapter le temps (futur, présent ou passé) selon le matchState.",
  "reasoning": "2 insights clés (inclure l'impact de la minute/score si en direct)",
  "predictedScore": "X-Y",
  "confidence": 0.85,
  "confidenceStars": 4,
  "keyFactor": "facteur décisif",
  
  "xgHome": 1.5,
  "xgAway": 1.1,
  
  "valueBet": "pari sous-côté précis ou null",
  
  "predictions": {
    "winner": "1|X|2",
    "btts": "Oui|Non",
    "bttsConfidence": 0.75,
    "overUnder25": "Over|Under",
    "overUnder25Confidence": 0.80,
    "overUnder35": "Over|Under",
    "doubleChance": "1X|X2|12",
    "corners": "ex: 8-10",
    "cards": "ex: 3-5",
    "possession": "XX%-XX%",
    "firstScorerTeam": "home|away|none",
    "anytimeScorer": "nom ou Inconnu",
    "penalty": "Faible|Moyenne|Haute",
    "var": "Faible|Moyenne|Haute",
    "cleanSheet": "Home|Away|None",
    "timingFirstGoal": "1-30|31-45|46-60|61-90|Already Scored",
    "highestScoringHalf": "1st|2nd|Equal",
    "winningMargin": "Draw|1|2|3+"
  },
  
  "vipClub": "Bientôt disponible"
}`;
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
    const cached = await getCachedPredictionDB(fixtureId, supabase);
    if (cached) {
      return new Response(JSON.stringify({ ...cached, _cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const prompt = buildPrompt(homeTeam, awayTeam, leagueName, predictionData, h2hData, fixtureDetail);

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
