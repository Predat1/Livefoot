import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fixtureId, homeTeam, awayTeam, leagueName } = await req.json()
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')

    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured')
    }

    const prompt = `En tant qu'expert analyste de football professionnel, analyse le match suivant :
Compétition : ${leagueName}
Match : ${homeTeam} vs ${awayTeam}

Fournis une analyse concise en français incluant :
1. Analyse tactique du match.
2. Score prédit (ex: 2-1).
3. Indice de confiance (0-100).
4. Le "Facteur Clé" du match.

Réponds UNIQUEMENT au format JSON strict suivant :
{
  "analysis": "ton analyse ici",
  "predictedScore": "x-y",
  "confidence": 85,
  "keyFactor": "le facteur clé ici"
}`

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-preview-02-05:free",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    })

    const aiData = await response.json()
    const content = aiData.choices[0].message.content
    const parsed = JSON.parse(content)

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
