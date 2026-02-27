import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Users, Send, Loader2, Trophy, Minus, Plus, TrendingUp, BarChart3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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
  const [justSubmitted, setJustSubmitted] = useState(false);

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
    setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 2000);
    await loadPredictions();
    setSubmitting(false);
  };

  // Stats
  const stats = useMemo(() => {
    const total = predictions.length;
    if (total === 0) return null;
    const homeWins = predictions.filter((p) => p.home_score > p.away_score).length;
    const draws = predictions.filter((p) => p.home_score === p.away_score).length;
    const awayWins = total - homeWins - draws;
    const avgHome = (predictions.reduce((s, p) => s + p.home_score, 0) / total).toFixed(1);
    const avgAway = (predictions.reduce((s, p) => s + p.away_score, 0) / total).toFixed(1);

    // Confidence: how skewed the predictions are (higher = more consensus)
    const maxPct = Math.max(homeWins, draws, awayWins) / total;
    const confidence = Math.round(maxPct * 100);

    // Score distribution
    const scoreMap = new Map<string, number>();
    predictions.forEach((p) => {
      const key = `${p.home_score}-${p.away_score}`;
      scoreMap.set(key, (scoreMap.get(key) || 0) + 1);
    });
    const topScores = [...scoreMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

    return { total, homeWins, draws, awayWins, avgHome, avgAway, confidence, topScores };
  }, [predictions]);

  const ScoreButton = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => onChange(value + 1)}
        className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors active:scale-90"
      >
        <Plus className="h-3.5 w-3.5 text-primary" />
      </button>
      <motion.span
        key={value}
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-3xl font-black text-foreground tabular-nums w-10 text-center"
      >
        {value}
      </motion.span>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="h-8 w-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors active:scale-90"
      >
        <Minus className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-xs">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* My prediction - redesigned */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-card to-accent/5 border border-border/50 p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 relative">
          <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center">
            <Trophy className="h-4 w-4 text-primary-foreground" />
          </div>
          {user ? "Mon pronostic" : "Pronostiquez ce match"}
        </h4>

        {user ? (
          <div className="relative">
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              {/* Home team */}
              <div className="flex flex-col items-center gap-2 flex-1">
                {homeLogo && <img src={homeLogo} alt="" className="h-10 w-10 object-contain" />}
                <span className="text-[11px] font-semibold text-foreground text-center leading-tight line-clamp-2">{homeTeamName}</span>
              </div>

              <ScoreButton value={myHome} onChange={setMyHome} label="home" />
              
              <span className="text-xl font-bold text-muted-foreground/40">:</span>

              <ScoreButton value={myAway} onChange={setMyAway} label="away" />

              {/* Away team */}
              <div className="flex flex-col items-center gap-2 flex-1">
                {awayLogo && <img src={awayLogo} alt="" className="h-10 w-10 object-contain" />}
                <span className="text-[11px] font-semibold text-foreground text-center leading-tight line-clamp-2">{awayTeamName}</span>
              </div>
            </div>

            <motion.button
              onClick={handleSubmit}
              disabled={submitting}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "w-full mt-4 rounded-xl py-3 text-sm font-bold shadow-lg transition-all duration-300 flex items-center justify-center gap-2",
                justSubmitted
                  ? "bg-emerald-500 text-white shadow-emerald-500/20"
                  : "gradient-primary text-primary-foreground shadow-primary/20 hover:opacity-90"
              )}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : justSubmitted ? (
                <>✓ Enregistré</>
              ) : (
                <><Send className="h-4 w-4" /> {hasSubmitted ? "Modifier" : "Valider mon pronostic"}</>
              )}
            </motion.button>

            {hasSubmitted && !justSubmitted && (
              <p className="text-center text-[10px] text-muted-foreground mt-2">Vous pouvez modifier votre pronostic à tout moment</p>
            )}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground mb-3">Connectez-vous pour soumettre votre pronostic</p>
            <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-xl gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
              Se connecter
            </Link>
          </div>
        )}
      </div>

      {/* Community stats - enriched */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" />
              {stats.total} pronostic{stats.total > 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Confiance : {stats.confidence}%
            </div>
          </div>

          {/* Visual bar distribution */}
          <div className="rounded-xl bg-card border border-border/50 p-4">
            <div className="flex items-end justify-between gap-2 mb-3">
              <div className="text-center flex-1">
                <p className="text-2xl font-black text-primary">{Math.round((stats.homeWins / stats.total) * 100)}%</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{homeTeamName}</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-2xl font-black text-muted-foreground">{Math.round((stats.draws / stats.total) * 100)}%</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Nul</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-2xl font-black text-primary">{Math.round((stats.awayWins / stats.total) * 100)}%</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{awayTeamName}</p>
              </div>
            </div>
            {/* Animated bar */}
            <div className="flex h-2.5 rounded-full overflow-hidden bg-muted gap-0.5">
              <motion.div
                className="bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(stats.homeWins / stats.total) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              <motion.div
                className="bg-muted-foreground/40 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(stats.draws / stats.total) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              />
              <motion.div
                className="bg-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(stats.awayWins / stats.total) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              />
            </div>
          </div>

          {/* Score moyen + Top scores */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-card border border-border/50 p-4 text-center">
              <BarChart3 className="h-4 w-4 text-primary mx-auto mb-1.5" />
              <p className="text-[10px] text-muted-foreground mb-0.5">Score moyen prédit</p>
              <p className="text-xl font-black text-foreground">{stats.avgHome} - {stats.avgAway}</p>
            </div>
            <div className="rounded-xl bg-card border border-border/50 p-4 text-center">
              <TrendingUp className="h-4 w-4 text-amber-500 mx-auto mb-1.5" />
              <p className="text-[10px] text-muted-foreground mb-0.5">Score le + populaire</p>
              {stats.topScores[0] && (
                <>
                  <p className="text-xl font-black text-foreground">{stats.topScores[0][0]}</p>
                  <p className="text-[9px] text-muted-foreground">{Math.round((stats.topScores[0][1] / stats.total) * 100)}% des votes</p>
                </>
              )}
            </div>
          </div>

          {/* Top 3 scores chips */}
          {stats.topScores.length > 1 && (
            <div className="flex gap-2 justify-center">
              {stats.topScores.map(([score, count], i) => (
                <div
                  key={score}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-center border",
                    i === 0
                      ? "border-primary/30 bg-primary/10"
                      : "border-border/50 bg-card"
                  )}
                >
                  <span className="text-xs font-black text-foreground">{score}</span>
                  <span className="text-[9px] text-muted-foreground ml-1">{count}×</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {!stats && (
        <div className="text-center py-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">Soyez le premier à pronostiquer !</p>
          <p className="text-[10px] text-muted-foreground mt-1">Votre pronostic apparaîtra dans les statistiques de la communauté</p>
        </div>
      )}
    </div>
  );
};

export default CommunityPredictions;
