import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL_CHAIN = [
  "google/gemini-2.0-flash-001",
  "anthropic/claude-3-haiku",
];

const SYSTEM_PROMPT = `Tu es AnalystePro V4, un expert en analyse de matchs de football. 
Tu utilises le modèle Double Poisson Dixon-Coles pour les probabilités et la pondération ELO pour la forme.
Réponds en français, de façon concise (3-5 phrases max), précise et professionnelle.
Appuie-toi sur les données du contexte fourni. Si une donnée manque, dis-le honnêtement.
Ne fabrique pas de statistiques. Utilise des chiffres précis quand disponibles.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) throw new Error("OPENROUTER_API_KEY manquant");

    const { context, messages, question } = await req.json();

    if (!question?.trim()) {
      return new Response(JSON.stringify({ error: "Question vide" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Build message array for OpenRouter
    const chatMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Contexte: ${context}` },
      ...((messages || []).slice(-6)), // last 6 messages for context window
      { role: "user", content: question },
    ];

    let response: string | null = null;

    for (const model of MODEL_CHAIN) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://livefoot.app",
            "X-Title": "LiveFoot AI Chat",
          },
          body: JSON.stringify({
            model,
            messages: chatMessages,
            max_tokens: 400,
            temperature: 0.3,
          }),
        });

        if (!res.ok) continue;
        const data = await res.json();
        response = data.choices?.[0]?.message?.content;
        if (response) break;
      } catch {
        continue;
      }
    }

    if (!response) throw new Error("Tous les modèles IA ont échoué");

    return new Response(JSON.stringify({ response }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
