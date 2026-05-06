import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_INSTRUCTION = `Tu es AnalystePro, expert en data football et paris sportifs (15+ ans).

Spécialités :
- Modélisation Poisson & xG
- Analyse tactique + forme
- Lecture des cotes bookmakers
- Détection de value bets
- Analyse en Temps Réel (Pré-match, Live, Post-match)

Règles strictes :
- ADAPTATION TEMPS RÉEL : Lis attentivement le "Statut du match". Si le match est "Terminé", ton analyse doit être un bilan. S'il est "En direct", ajuste radicalement tes prédictions et ta confiance en fonction du score actuel et de la minute. S'il "N'a pas commencé", fais une prédiction classique.
- Utilise UNIQUEMENT les données fournies.
- Priorise les données quantitatives (Poisson, stats).
- Ajuste avec contexte (forme, blessures, H2H).
- Si données faibles ou match en direct très avancé -> ajuste la confiance (baisse si incertain, monte si le résultat est presque acquis).
- Ne fais AUCUNE explication hors JSON.

Calibration confiance :
- Faible data / Forte incertitude -> 0.45-0.60
- Moyenne -> 0.55-0.75
- Forte / Match avancé avec score clair -> 0.65-0.95`;

function buildPrompt(homeTeam: string, awayTeam: string, leagueName: string, predictionData: any, h2hData: any[], fixtureDetail: any) {
  const matchStatus = fixtureDetail?.fixture?.status?.long || 'Not Started';
  const currentMinute = fixtureDetail?.fixture?.status?.elapsed || 0;
  const currentScore = \`\${fixtureDetail?.goals?.home ?? 0}-\${fixtureDetail?.goals?.away ?? 0}\`;
  
  return \`
📊 DATA (Contexte Injecté)

# MATCH CONTEXT
\${homeTeam} vs \${awayTeam} (\${leagueName})
Date: \${fixtureDetail?.fixture?.date ? new Date(fixtureDetail.fixture.date).toLocaleString() : 'N/A'}
Stade: \${fixtureDetail?.fixture?.venue?.name || 'Inconnu'}
Statut: \${matchStatus}
Minute Actuelle: \${currentMinute}
Score Actuel: \${currentScore}

# POISSON MODEL
Probabilités: Home \${predictionData?.predictions?.percent?.home || '?'} | Draw \${predictionData?.predictions?.percent?.draw || '?'} | Away \${predictionData?.predictions?.percent?.away || '?'}

# TEAM STATS
HOME: Forme \${predictionData?.comparison?.form?.home || '?'} | Attaque \${predictionData?.comparison?.att?.home || '?'} | Défense \${predictionData?.comparison?.def?.home || '?'}
AWAY: Forme \${predictionData?.comparison?.form?.away || '?'} | Attaque \${predictionData?.comparison?.att?.away || '?'} | Défense \${predictionData?.comparison?.def?.away || '?'}

# STANDINGS & H2H
H2H (Derniers 5 matchs):
\${h2hData.map((m: any) => \`- \${m.teams.home.name} \${m.goals.home}-\${m.goals.away} \${m.teams.away.name}\`).join('\\n')}

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
}\`;
}

async function callOpenRouter(prompt: string, apiKey: string): Promise<string> {
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
      response_format: { type: "json_object" }
    })
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`OpenRouter: ${data.error?.message || res.status}`);
  return data.choices[0].message.content;
}

async function callLovableAI(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: prompt }
      ],
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Lovable AI: ${res.status} ${JSON.stringify(data)}`);
  return data.choices[0].message.content;
}

function safeParseJSON(text: string): any {
  try { return JSON.parse(text); } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Impossible de parser la réponse IA");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { fixtureId, homeTeam, awayTeam, leagueName } = await req.json();
    if (!fixtureId) throw new Error("Fixture ID requis");

    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const apiFootballKey = Deno.env.get("API_FOOTBALL_KEY");

    if (!apiFootballKey) throw new Error("API_FOOTBALL_KEY non configurée");
    if (!openRouterKey && !lovableKey) throw new Error("Aucune clé IA configurée");

    const headers = { "x-apisports-key": apiFootballKey };

    const [statsRes, fixtureRes] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/predictions?fixture=${fixtureId}`, { headers }),
      fetch(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`, { headers }),
    ]);
    const statsData = await statsRes.json();
    const fixtureDataRaw = await fixtureRes.json();
    const predictionData = statsData.response?.[0];
    const fixtureDetail = fixtureDataRaw.response?.[0];

    let h2hData: any[] = [];
    if (fixtureDetail?.teams?.home?.id && fixtureDetail?.teams?.away?.id) {
      const h2hRes = await fetch(`https://v3.football.api-sports.io/fixtures/headtohead?h2h=${fixtureDetail.teams.home.id}-${fixtureDetail.teams.away.id}&last=5`, { headers });
      const h2hJson = await h2hRes.json();
      h2hData = h2hJson.response || [];
    }

    const prompt = buildPrompt(homeTeam, awayTeam, leagueName, predictionData, h2hData, fixtureDetail);

    let content: string;
    let provider = "openrouter";
    try {
      if (!openRouterKey) throw new Error("Pas de clé OpenRouter");
      content = await callOpenRouter(prompt, openRouterKey);
    } catch (err) {
      console.warn("OpenRouter échec, fallback Lovable AI:", (err as Error).message);
      if (!lovableKey) throw err;
      content = await callLovableAI(prompt, lovableKey);
      provider = "lovable";
    }

    const aiPrediction = safeParseJSON(content);
    return new Response(JSON.stringify({ ...aiPrediction, _provider: provider }), {
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
