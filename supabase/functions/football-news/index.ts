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
    const apiKey = Deno.env.get('API_FOOTBALL_KEY')
    
    // News endpoint on API-Sports
    const url = "https://v3.football.api-sports.io/news?league=1" // Default to world news or league 1
    
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': apiKey!,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
    })

    const data = await response.json()
    
    // Transform to our NewsArticle interface if needed
    // For now, return as is
    return new Response(JSON.stringify(data), {
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
