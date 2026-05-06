import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Gamification Rules
const POINTS_EXACT_SCORE = 15;
const POINTS_CORRECT_OUTCOME = 5;
const POINTS_WRONG = 1; // 1 point just for participating

function determineOutcome(home: number, away: number) {
  if (home > away) return 'home';
  if (home < away) return 'away';
  return 'draw';
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const apiFootballKey = Deno.env.get("API_FOOTBALL_KEY");
    if (!apiFootballKey) throw new Error("API_FOOTBALL_KEY non configurée");

    // 1. Fetch all pending predictions
    const { data: pendingPreds, error: fetchErr } = await supabase
      .from('match_predictions')
      .select('*')
      .eq('status', 'pending');

    if (fetchErr) throw fetchErr;
    if (!pendingPreds || pendingPreds.length === 0) {
      return new Response(JSON.stringify({ message: "No pending predictions to evaluate" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Extract unique fixture IDs
    const fixtureIds = [...new Set(pendingPreds.map(p => p.fixture_id))];

    // 2. Fetch match statuses from API-Football
    // Note: If there are many fixtures, we might need to chunk the requests. API supports up to 20 IDs per request separated by dash.
    const chunks = [];
    for (let i = 0; i < fixtureIds.length; i += 20) {
      chunks.push(fixtureIds.slice(i, i + 20).join('-'));
    }

    const matchResults = new Map();
    for (const chunk of chunks) {
      const res = await fetch(`https://v3.football.api-sports.io/fixtures?ids=${chunk}`, {
        headers: { "x-apisports-key": apiFootballKey }
      });
      const data = await res.json();
      if (data.response) {
        for (const fixture of data.response) {
          matchResults.set(fixture.fixture.id.toString(), {
            status: fixture.fixture.status.long,
            homeScore: fixture.goals.home,
            awayScore: fixture.goals.away
          });
        }
      }
    }

    // 3. Evaluate predictions
    let evaluatedCount = 0;
    const userPointsDelta = new Map<string, number>();

    for (const pred of pendingPreds) {
      const result = matchResults.get(pred.fixture_id.toString());
      if (result && result.status === "Match Finished") {
        let earned = POINTS_WRONG;
        
        const predictedOutcome = determineOutcome(pred.home_score, pred.away_score);
        const actualOutcome = determineOutcome(result.homeScore, result.awayScore);

        if (pred.home_score === result.homeScore && pred.away_score === result.awayScore) {
          earned = POINTS_EXACT_SCORE;
        } else if (predictedOutcome === actualOutcome) {
          earned = POINTS_CORRECT_OUTCOME;
        }

        // Update prediction status
        await supabase
          .from('match_predictions')
          .update({ points_earned: earned, status: 'evaluated' })
          .eq('id', pred.id);

        userPointsDelta.set(pred.user_id, (userPointsDelta.get(pred.user_id) || 0) + earned);
        evaluatedCount++;
      }
    }

    // 4. Update user profiles points
    for (const [userId, pointsToAdd] of userPointsDelta.entries()) {
      // Fetch current points to add to them safely
      const { data: profile } = await supabase.from('profiles').select('points').eq('id', userId).single();
      const currentPoints = profile?.points || 0;
      
      await supabase
        .from('profiles')
        .update({ points: currentPoints + pointsToAdd })
        .eq('id', userId);
    }

    return new Response(JSON.stringify({ message: `Evaluated ${evaluatedCount} predictions.` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("evaluate-predictions error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
