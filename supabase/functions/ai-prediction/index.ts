import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { fixtureId, homeTeam, awayTeam, leagueName } = await req.json();

    if (!fixtureId) {
      throw new Error("Fixture ID is required");
    }

    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
    const apiFootballKey = Deno.env.get("API_FOOTBALL_KEY");

    if (!openRouterKey || !apiFootballKey) {
      throw new Error("API keys not configured");
    }

    // 1. Fetch comprehensive data from API Football
    const headers = { "x-apisports-key": apiFootballKey };
    
    // Fetch Predictions & Comparison
    const statsRes = await fetch(`https://v3.football.api-sports.io/predictions?fixture=${fixtureId}`, { headers });
    const statsData = await statsRes.json();
    const predictionData = statsData.response?.[0];

    // Fetch Fixture Details
    const fixtureRes = await fetch(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`, { headers });
    const fixtureDataRaw = await fixtureRes.json();
    const fixtureDetail = fixtureDataRaw.response?.[0];

    // Fetch H2H specifically
    let h2hData = [];
    if (fixtureDetail?.teams?.home?.id && fixtureDetail?.teams?.away?.id) {
      const h2hRes = await fetch(`https://v3.football.api-sports.io/fixtures/headtohead?h2h=${fixtureDetail.teams.home.id}-${fixtureDetail.teams.away.id}&last=5`, { headers });
      const h2hJson = await h2hRes.json();
      h2hData = h2hJson.response || [];
    }

    // 2. Build a very detailed AI Prompt
    const prompt = `
      Tu es l'expert ultime en pronostics football de "LiveFoot".
      Ton but est de fournir une analyse extrêmement précise basée sur des données réelles.

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

      CONSIGNES :
      1. Analyse les tendances récentes et l'historique.
      2. Rédige une analyse captivante de 3-4 phrases en français.
      3. Propose un score exact réaliste.
      4. Identifie le facteur clé.
      
      Réponds UNIQUEMENT au format JSON :
      {
        "analysis": "ton analyse ici",
        "predictedScore": "X-Y",
        "confidence": 0.85,
        "keyFactor": "le facteur clé du match"
      }
    `;

    // 3. Call OpenRouter (Modèle Gratuit Gemini 2.0 Flash Lite)
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://livefoot.com",
        "X-Title": "LiveFoot AI Expert"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-preview-02-05:free",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    const aiData = await aiRes.json();
    if (aiData.error) throw new Error(`OpenRouter Error: ${aiData.error.message}`);
    
    const aiPrediction = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify(aiPrediction), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

