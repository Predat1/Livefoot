import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_INSTRUCTION = `Tu es l'expert ultime en pronostics football de "LiveFoot". Réponds UNIQUEMENT en JSON strict valide.`;

function buildPrompt(homeTeam: string, awayTeam: string, leagueName: string, predictionData: any, h2hData: any[], fixtureDetail: any) {
  return `
MATCH : ${homeTeam} vs ${awayTeam} (${leagueName})

DONNÉES DE PRÉDICTION OFFICIELLES :
- Conseil : ${predictionData?.predictions?.advice || 'N/A'}
- Comparaison Forme : ${predictionData?.comparison?.form?.home || '?'} vs ${predictionData?.comparison?.form?.away || '?'}
- Comparaison Attaque : ${predictionData?.comparison?.att?.home || '?'} vs ${predictionData?.comparison?.att?.away || '?'}
- Comparaison Défense : ${predictionData?.comparison?.def?.home || '?'} vs ${predictionData?.comparison?.def?.away || '?'}
- Probabilités : Victoire ${homeTeam} ${predictionData?.predictions?.percent?.home || '?'}, Nul ${predictionData?.predictions?.percent?.draw || '?'}, Victoire ${awayTeam} ${predictionData?.predictions?.percent?.away || '?'}

HISTORIQUE H2H (Derniers 5 matchs) :
${h2hData.map((m: any) => `- ${m.teams.home.name} ${m.goals.home}-${m.goals.away} ${m.teams.away.name} (${new Date(m.fixture.date).toLocaleDateString()})`).join('\n')}

DÉTAILS DU MATCH :
- Statut : ${fixtureDetail?.fixture?.status?.long || 'N/A'}
- Stade : ${fixtureDetail?.fixture?.venue?.name || 'Inconnu'}
- Arbitre : ${fixtureDetail?.fixture?.referee || 'Inconnu'}

Réponds UNIQUEMENT au format JSON strict suivant :
{
  "analysis": "analyse captivante 3-4 phrases en français",
  "predictedScore": "X-Y",
  "confidence": 0.85,
  "keyFactor": "facteur clé du match",
  "predictions": {
    "winner": "1, X ou 2",
    "btts": "Oui/Non",
    "overUnder25": "Over/Under",
    "doubleChance": "1X, X2 ou 12",
    "corners": "ex: 8-10",
    "cards": "ex: 3-5",
    "possession": "ex: 55%-45%",
    "firstScorer": "joueur probable",
    "anytimeScorer": "joueur probable",
    "penalty": "Faible/Moyenne/Haute",
    "var": "Faible/Moyenne/Haute",
    "cleanSheet": "Équipe ou Aucune",
    "timingFirstGoal": "ex: 15-30 min",
    "highestScoringHalf": "1ère ou 2ème",
    "winningMargin": "ex: 1 but"
  }
}`;
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
      model: "google/gemini-2.5-flash",
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
      model: "google/gemini-2.5-flash",
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
