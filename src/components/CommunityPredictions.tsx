import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Users, Send, Loader2, Trophy, Minus, Plus, TrendingUp, BarChart3, Sparkles, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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

interface PredictionStats {
  total: number;
  home_wins: number;
  draws: number;
  away_wins: number;
  avg_home: number;
  avg_away: number;
  top_scores: { score: string; count: number }[];
}

const CommunityPredictions = ({ fixtureId, homeTeamName, awayTeamName, homeLogo, awayLogo }: CommunityPredictionsProps) => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [serverStats, setServerStats] = useState<PredictionStats | null>(null);
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

    // Load aggregated public stats via RPC
    const { data: statsData } = await supabase.rpc("get_prediction_stats", {
      _fixture_id: fixtureId,
    });
    if (statsData) setServerStats(statsData as unknown as PredictionStats);

    // Load only the current user's prediction (if any)
    if (user) {
      const { data } = await supabase
        .from("match_predictions")
        .select("id, user_id, home_score, away_score")
        .eq("fixture_id", fixtureId)
        .eq("user_id", user.id);

      const preds = (data || []) as Prediction[];
      setPredictions(preds);
      const mine = preds[0];
      if (mine) {
        setMyHome(mine.home_score);
        setMyAway(mine.away_score);
        setHasSubmitted(true);
      }
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Connectez-vous pour voter !");
      return;
    }
    setSubmitting(true);

    try {
      if (hasSubmitted) {
        await supabase
          .from("match_predictions")
          .update({ home_score: myHome, away_score: myAway })
          .eq("user_id", user.id)
          .eq("fixture_id", fixtureId);
        toast.success("Pronostic mis à jour !");
      } else {
        await supabase
          .from("match_predictions")
          .insert({ user_id: user.id, fixture_id: fixtureId, home_score: myHome, away_score: myAway });
        toast.success("Pronostic validé ! +1 pt de participation");
      }

      setHasSubmitted(true);
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 3000);
      await loadPredictions();
    } catch (err) {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    if (!serverStats || serverStats.total === 0) return null;
    const { total, home_wins, draws, away_wins, avg_home, avg_away, top_scores } = serverStats;
    const maxPct = Math.max(home_wins, draws, away_wins) / total;
    const confidence = Math.round(maxPct * 100);
    const topScores: [string, number][] = (top_scores || []).map((t) => [t.score, t.count]);
    return {
      total,
      homeWins: home_wins,
      draws,
      awayWins: away_wins,
      avgHome: Number(avg_home).toFixed(1),
      avgAway: Number(avg_away).toFixed(1),
      confidence,
      topScores,
    };
  }, [serverStats]);

  const ScoreSelector = ({ value, onChange, colorClass }: { value: number; onChange: (v: number) => void; colorClass: string }) => (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onChange(value + 1)}
        className={cn("h-12 w-12 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center transition-all shadow-lg", colorClass, "bg-opacity-20 border border-current")}
      >
        <Plus className="h-6 w-6 sm:h-5 sm:w-5" />
      </motion.button>
      
      <div className="relative group">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        <motion.span
          key={value}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl sm:text-5xl font-black text-foreground tabular-nums relative block min-w-[50px] sm:min-w-[60px] text-center"
        >
          {value}
        </motion.span>
      </div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onChange(Math.max(0, value - 1))}
        className="h-12 w-12 sm:h-10 sm:w-10 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center transition-all border border-border"
      >
        <Minus className="h-6 w-6 sm:h-5 sm:w-5 text-muted-foreground" />
      </motion.button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <Trophy className="absolute inset-0 m-auto h-5 w-5 text-primary/40" />
        </div>
        <p className="text-xs font-medium text-muted-foreground animate-pulse">Calcul des tendances...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Interactive Battle UI */}
      <div className="relative rounded-3xl bg-gradient-to-b from-card/50 to-card border border-border/50 p-5 sm:p-8 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
            <span className="px-3 py-1 rounded-full bg-primary/10 text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest whitespace-nowrap">Arène Communauté</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
          </div>

          <div className="flex flex-col xs:flex-row items-center justify-between gap-6 xs:gap-4">
            {/* Home Side */}
            <div className="flex-1 w-full flex flex-col items-center gap-3 sm:gap-4">
              <motion.div 
                whileHover={{ y: -5 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                {homeLogo ? (
                  <img src={homeLogo} alt="" className="h-14 w-14 sm:h-20 sm:w-20 object-contain relative" />
                ) : (
                  <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl bg-muted flex items-center justify-center text-xl sm:text-2xl font-bold">{homeTeamName[0]}</div>
                )}
              </motion.div>
              <h4 className="text-xs sm:text-sm font-black text-foreground text-center line-clamp-1 max-w-[100px] sm:max-w-[120px]">{homeTeamName}</h4>
              <ScoreSelector value={myHome} onChange={setMyHome} colorClass="text-primary" />
            </div>

            {/* VS Divider */}
            <div className="flex flex-row xs:flex-col items-center gap-4 xs:gap-2 w-full xs:w-auto">
              <div className="h-[1px] xs:h-12 w-full xs:w-[1px] bg-gradient-to-r xs:bg-gradient-to-b from-transparent via-border to-transparent" />
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-xl flex-shrink-0">
                <span className="text-[10px] sm:text-xs font-black text-muted-foreground italic">VS</span>
              </div>
              <div className="h-[1px] xs:h-12 w-full xs:w-[1px] bg-gradient-to-l xs:bg-gradient-to-t from-transparent via-border to-transparent" />
            </div>

            {/* Away Side */}
            <div className="flex-1 w-full flex flex-col items-center gap-3 sm:gap-4">
              <motion.div 
                whileHover={{ y: -5 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-accent/10 blur-2xl rounded-full" />
                {awayLogo ? (
                  <img src={awayLogo} alt="" className="h-14 w-14 sm:h-20 sm:w-20 object-contain relative" />
                ) : (
                  <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl bg-muted flex items-center justify-center text-xl sm:text-2xl font-bold">{awayTeamName[0]}</div>
                )}
              </motion.div>
              <h4 className="text-xs sm:text-sm font-black text-foreground text-center line-clamp-1 max-w-[100px] sm:max-w-[120px]">{awayTeamName}</h4>
              <ScoreSelector value={myAway} onChange={setMyAway} colorClass="text-accent" />
            </div>
          </div>

          <div className="mt-8 sm:mt-10 max-w-sm mx-auto">
            {!user ? (
              <div className="text-center space-y-4">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Rejoignez l'arène pour soumettre votre prono et gagner des points !</p>
                <Link to="/auth" className="flex items-center justify-center gap-2 w-full rounded-2xl gradient-primary py-3.5 sm:py-4 text-xs sm:text-sm font-black text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                  <Swords className="h-4 w-4" /> SE CONNECTER
                </Link>
              </div>
            ) : (
              <motion.button
                onClick={handleSubmit}
                disabled={submitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full rounded-2xl py-3.5 sm:py-4 text-xs sm:text-sm font-black shadow-2xl transition-all duration-500 flex items-center justify-center gap-3 overflow-hidden relative group",
                  justSubmitted
                    ? "bg-emerald-500 text-white shadow-emerald-500/20"
                    : "gradient-primary text-primary-foreground shadow-primary/30"
                )}
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : justSubmitted ? (
                  <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" /> PRONO ENREGISTRÉ !
                  </motion.div>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> 
                    {hasSubmitted ? "MODIFIER MON SCORE" : "VALIDER LE PRONOSTIC"}
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Community Trends */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-card border border-border/50 p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-black text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Tendances
              </h5>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black">
                <Sparkles className="h-3 w-3" /> {stats.confidence}% CONFIANCE
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-end justify-between px-2">
                <div className="text-center group">
                  <p className="text-3xl font-black text-primary group-hover:scale-110 transition-transform">{Math.round((stats.homeWins / stats.total) * 100)}%</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">DOMICILE</p>
                </div>
                <div className="text-center group">
                  <p className="text-2xl font-black text-muted-foreground group-hover:scale-110 transition-transform">{Math.round((stats.draws / stats.total) * 100)}%</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">NUL</p>
                </div>
                <div className="text-center group">
                  <p className="text-3xl font-black text-accent group-hover:scale-110 transition-transform">{Math.round((stats.awayWins / stats.total) * 100)}%</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">EXTÉRIEUR</p>
                </div>
              </div>

              <div className="flex h-3 rounded-full overflow-hidden bg-muted p-0.5 gap-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.homeWins / stats.total) * 100}%` }}
                  className="bg-primary rounded-l-full"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.draws / stats.total) * 100}%` }}
                  className="bg-muted-foreground/30"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.awayWins / stats.total) * 100}%` }}
                  className="bg-accent rounded-r-full"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl bg-card border border-border/50 p-6 flex flex-col items-center justify-center text-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Score moyen</p>
                <p className="text-2xl font-black text-foreground">{stats.avgHome} - {stats.avgAway}</p>
              </div>
            </div>

            <div className="rounded-3xl bg-card border border-border/50 p-6 flex flex-col items-center justify-center text-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Favori</p>
                <p className="text-2xl font-black text-foreground">{stats.topScores[0]?.[0] || "N/A"}</p>
              </div>
            </div>

            <div className="col-span-2 rounded-3xl bg-card border border-border/50 p-5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center mb-4">Top 3 Scores Pronostiqués</p>
              <div className="flex justify-around items-center">
                {stats.topScores.map(([score, count], i) => (
                  <div key={score} className="flex flex-col items-center gap-1">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center text-lg font-black border-2 shadow-lg",
                      i === 0 ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-foreground/70"
                    )}>
                      {score}
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">{count}× voix</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPredictions;
