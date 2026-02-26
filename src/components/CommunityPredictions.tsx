import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Users, Send, Loader2, Trophy, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface CommunityPredictionsProps {
  fixtureId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeLogo?: string;
  awayLogo?: string;
}

interface Prediction {
  id: string;
  user_id: string;
  home_score: number;
  away_score: number;
}

const CommunityPredictions = ({ fixtureId, homeTeamName, awayTeamName, homeLogo, awayLogo }: CommunityPredictionsProps) => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [myHome, setMyHome] = useState(0);
  const [myAway, setMyAway] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    loadPredictions();
  }, [fixtureId]);

  const loadPredictions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("match_predictions")
      .select("id, user_id, home_score, away_score")
      .eq("fixture_id", fixtureId);

    const preds = (data || []) as Prediction[];
    setPredictions(preds);

    if (user) {
      const mine = preds.find((p) => p.user_id === user.id);
      if (mine) {
        setMyHome(mine.home_score);
        setMyAway(mine.away_score);
        setHasSubmitted(true);
      }
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    if (hasSubmitted) {
      await supabase
        .from("match_predictions")
        .update({ home_score: myHome, away_score: myAway })
        .eq("user_id", user.id)
        .eq("fixture_id", fixtureId);
    } else {
      await supabase
        .from("match_predictions")
        .insert({ user_id: user.id, fixture_id: fixtureId, home_score: myHome, away_score: myAway });
    }

    setHasSubmitted(true);
    await loadPredictions();
    setSubmitting(false);
  };

  // Stats
  const total = predictions.length;
  const homeWins = predictions.filter((p) => p.home_score > p.away_score).length;
  const draws = predictions.filter((p) => p.home_score === p.away_score).length;
  const awayWins = total - homeWins - draws;
  const avgHome = total > 0 ? (predictions.reduce((s, p) => s + p.home_score, 0) / total).toFixed(1) : "0";
  const avgAway = total > 0 ? (predictions.reduce((s, p) => s + p.away_score, 0) / total).toFixed(1) : "0";

  // Most popular score
  const scoreMap = new Map<string, number>();
  predictions.forEach((p) => {
    const key = `${p.home_score}-${p.away_score}`;
    scoreMap.set(key, (scoreMap.get(key) || 0) + 1);
  });
  const popularScore = [...scoreMap.entries()].sort((a, b) => b[1] - a[1])[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-xs">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* My prediction */}
      <div className="rounded-xl bg-muted/20 border border-border/50 p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          {user ? "Mon pronostic" : "Connectez-vous pour pronostiquer"}
        </h4>
        {user ? (
          <div className="flex items-center gap-3 justify-center">
            <div className="flex items-center gap-2">
              {homeLogo && <img src={homeLogo} alt="" className="h-6 w-6 object-contain" />}
              <span className="text-xs font-medium text-foreground hidden sm:inline">{homeTeamName}</span>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => setMyHome(Math.max(0, myHome - 1))} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                <Minus className="h-3 w-3 text-foreground" />
              </button>
              <span className="w-10 text-center text-xl font-black text-foreground">{myHome}</span>
              <button onClick={() => setMyHome(myHome + 1)} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                <Plus className="h-3 w-3 text-foreground" />
              </button>
            </div>

            <span className="text-lg font-bold text-muted-foreground">-</span>

            <div className="flex items-center gap-1">
              <button onClick={() => setMyAway(Math.max(0, myAway - 1))} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                <Minus className="h-3 w-3 text-foreground" />
              </button>
              <span className="w-10 text-center text-xl font-black text-foreground">{myAway}</span>
              <button onClick={() => setMyAway(myAway + 1)} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                <Plus className="h-3 w-3 text-foreground" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground hidden sm:inline">{awayTeamName}</span>
              {awayLogo && <img src={awayLogo} alt="" className="h-6 w-6 object-contain" />}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="ml-2 rounded-lg gradient-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <Link to="/auth" className="text-sm text-primary hover:underline">Se connecter</Link>
          </div>
        )}
        {hasSubmitted && <p className="text-center text-[10px] text-muted-foreground mt-2">✓ Pronostic enregistré — vous pouvez le modifier</p>}
      </div>

      {/* Community stats */}
      {total > 0 && (
        <>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">
              <Users className="h-3 w-3 inline mr-1" />
              {total} pronostic{total > 1 ? "s" : ""} de la communauté
            </p>
          </div>

          {/* Distribution */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-primary/10 p-3">
              <p className="text-2xl font-black text-primary">{total > 0 ? Math.round((homeWins / total) * 100) : 0}%</p>
              <p className="text-[10px] text-muted-foreground mt-1">{homeTeamName}</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-3">
              <p className="text-2xl font-black text-muted-foreground">{total > 0 ? Math.round((draws / total) * 100) : 0}%</p>
              <p className="text-[10px] text-muted-foreground mt-1">Nul</p>
            </div>
            <div className="rounded-xl bg-primary/10 p-3">
              <p className="text-2xl font-black text-primary">{total > 0 ? Math.round((awayWins / total) * 100) : 0}%</p>
              <p className="text-[10px] text-muted-foreground mt-1">{awayTeamName}</p>
            </div>
          </div>

          {/* Average & popular score */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/30 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Score moyen</p>
              <p className="text-xl font-black text-foreground">{avgHome} - {avgAway}</p>
            </div>
            {popularScore && (
              <div className="rounded-xl bg-muted/30 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Score populaire</p>
                <p className="text-xl font-black text-foreground">{popularScore[0]}</p>
                <p className="text-[10px] text-muted-foreground">{popularScore[1]} vote{popularScore[1] > 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        </>
      )}

      {total === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">Soyez le premier à pronostiquer !</p>
        </div>
      )}
    </div>
  );
};

export default CommunityPredictions;
