import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Target, TrendingUp, Medal, Users, Calendar, ArrowRight, Loader2, Crown, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BadgeGrid, { computeBadges, computePoints } from "@/components/PredictionBadges";

interface PredictionRow {
  id: string;
  user_id: string;
  fixture_id: string;
  home_score: number;
  away_score: number;
  created_at: string;
}

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total: number;
  points: number;
}

const PredictionsDashboard = () => {
  const { user } = useAuth();
  const [myPredictions, setMyPredictions] = useState<PredictionRow[]>([]);
  const [allPredictions, setAllPredictions] = useState<PredictionRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, { display_name: string; avatar_url: string | null }>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const { data: allPreds } = await supabase
      .from("match_predictions")
      .select("*")
      .order("created_at", { ascending: false });

    const preds = (allPreds || []) as PredictionRow[];
    setAllPredictions(preds);

    if (user) {
      setMyPredictions(preds.filter((p) => p.user_id === user.id));
    }

    const userIds = [...new Set(preds.map((p) => p.user_id))];
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const map = new Map<string, { display_name: string; avatar_url: string | null }>();
      (profilesData || []).forEach((p: any) => {
        map.set(p.user_id, { display_name: p.display_name || "Anonyme", avatar_url: p.avatar_url });
      });
      setProfiles(map);
    }
    setLoading(false);
  };

  // My stats & badges
  const myStats = useMemo(() => {
    const total = myPredictions.length;
    const homeWins = myPredictions.filter((p) => p.home_score > p.away_score).length;
    const draws = myPredictions.filter((p) => p.home_score === p.away_score).length;
    const awayWins = total - homeWins - draws;
    const avgGoals = total > 0
      ? ((myPredictions.reduce((s, p) => s + p.home_score + p.away_score, 0)) / total).toFixed(1)
      : "0";
    // Points: 1 pt per prediction (placeholder - real scoring would compare vs actual results)
    const points = computePoints({ exactScores: 0, correctResults: 0, totalPredictions: total });
    return { total, homeWins, draws, awayWins, avgGoals, points };
  }, [myPredictions]);

  const myBadges = useMemo(() => {
    return computeBadges({
      totalPredictions: myStats.total,
      exactScores: 0, // Would need actual match results to compute
      correctResults: 0,
      streak: 0,
    });
  }, [myStats.total]);

  // Leaderboard with points
  const leaderboard = useMemo(() => {
    const userMap = new Map<string, number>();
    for (const pred of allPredictions) {
      userMap.set(pred.user_id, (userMap.get(pred.user_id) || 0) + 1);
    }

    const entries: LeaderboardEntry[] = [];
    for (const [userId, total] of userMap) {
      const profile = profiles.get(userId);
      const points = computePoints({ exactScores: 0, correctResults: 0, totalPredictions: total });
      entries.push({
        user_id: userId,
        display_name: profile?.display_name || "Anonyme",
        avatar_url: profile?.avatar_url || null,
        total,
        points,
      });
    }
    return entries.sort((a, b) => b.points - a.points).slice(0, 20);
  }, [allPredictions, profiles]);

  const rankMedal = (i: number) => {
    if (i === 0) return <Crown className="h-5 w-5 text-amber-500" />;
    if (i === 1) return <Medal className="h-5 w-5 text-muted-foreground" />;
    if (i === 2) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="w-5 text-center text-xs font-bold text-muted-foreground">{i + 1}</span>;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-16 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead title="Pronostics - LiveFoot" description="Tableau de bord des pronostics, historique et classement des meilleurs pronostiqueurs." />
      <div className="container py-4 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 rounded-full gradient-primary" />
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-black text-foreground">Pronostics</h1>
        </div>

        <Tabs defaultValue={user ? "my" : "leaderboard"} className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-card border border-border/50 rounded-xl p-1 mb-6">
            <TabsTrigger value="my" className="rounded-lg text-[10px] sm:text-sm">Mes Pronos</TabsTrigger>
            <TabsTrigger value="badges" className="rounded-lg text-[10px] sm:text-sm">Badges</TabsTrigger>
            <TabsTrigger value="leaderboard" className="rounded-lg text-[10px] sm:text-sm">Classement</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-lg text-[10px] sm:text-sm">Stats</TabsTrigger>
          </TabsList>

          {/* My Predictions */}
          <TabsContent value="my" className="mt-0 space-y-4">
            {!user ? (
              <div className="rounded-2xl bg-card border border-border/50 p-8 text-center">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">Connectez-vous pour voir vos pronostics</p>
                <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                  Se connecter <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <>
                {/* Points & quick stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl bg-card border border-border/50 p-4 text-center col-span-2 sm:col-span-1">
                    <Flame className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-2xl font-black text-foreground">{myStats.points}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Points</p>
                  </div>
                  <div className="rounded-xl bg-card border border-border/50 p-4 text-center">
                    <Target className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-2xl font-black text-foreground">{myStats.total}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Pronostics</p>
                  </div>
                  <div className="rounded-xl bg-card border border-border/50 p-4 text-center">
                    <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-2xl font-black text-foreground">{myStats.avgGoals}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Buts moy.</p>
                  </div>
                  <div className="rounded-xl bg-card border border-border/50 p-4 text-center">
                    <p className="text-lg font-black text-foreground">{myStats.homeWins}V / {myStats.draws}N / {myStats.awayWins}D</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Distribution</p>
                  </div>
                </div>

                {/* Earned badges preview */}
                {myBadges.filter(b => b.earned).length > 0 && (
                  <div className="rounded-xl bg-card border border-border/50 p-4">
                    <p className="text-xs font-bold text-foreground mb-2">🏅 Badges débloqués</p>
                    <div className="flex gap-2 flex-wrap">
                      {myBadges.filter(b => b.earned).map(b => (
                        <span key={b.id} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold", b.bgColor, b.color)}>
                          {b.icon} {b.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prediction history */}
                <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                  <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-sm text-foreground">Historique</h3>
                    <span className="ml-auto text-[10px] text-muted-foreground">{myPredictions.length} pronostic{myPredictions.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="divide-y divide-border/30">
                    {myPredictions.length > 0 ? myPredictions.slice(0, 30).map((pred) => (
                      <Link key={pred.id} to={`/match/${pred.fixture_id}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground w-20">
                            {new Date(pred.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </span>
                          <span className="text-xs text-muted-foreground">Match #{pred.fixture_id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-foreground">{pred.home_score} - {pred.away_score}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </Link>
                    )) : (
                      <div className="p-8 text-center">
                        <p className="text-sm text-muted-foreground">Aucun pronostic encore — allez sur un match pour commencer !</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Badges */}
          <TabsContent value="badges" className="mt-0 space-y-4">
            {!user ? (
              <div className="rounded-2xl bg-card border border-border/50 p-8 text-center">
                <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">Connectez-vous pour voir vos badges</p>
                <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                  Se connecter <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <h3 className="font-bold text-sm text-foreground">Mes Badges</h3>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {myBadges.filter(b => b.earned).length}/{myBadges.length} débloqués
                  </span>
                </div>
                <div className="p-4 sm:p-6">
                  <BadgeGrid badges={myBadges} />
                </div>
              </div>
            )}
          </TabsContent>

          {/* Leaderboard */}
          <TabsContent value="leaderboard" className="mt-0">
            <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-4 py-2.5 border-b border-border flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <h3 className="font-bold text-sm text-foreground">Classement des pronostiqueurs</h3>
              </div>
              <div className="divide-y divide-border/30">
                {leaderboard.length > 0 ? leaderboard.map((entry, i) => {
                  const isMe = user && entry.user_id === user.id;
                  return (
                    <div key={entry.user_id} className={cn("flex items-center gap-3 px-4 py-3 transition-colors", isMe && "bg-primary/5", i < 3 && "bg-muted/20")}>
                      <div className="w-6 flex justify-center">{rankMedal(i)}</div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {entry.display_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className={cn("text-sm font-bold text-foreground truncate", isMe && "text-primary")}>
                            {entry.display_name} {isMe && <span className="text-[10px] font-normal text-muted-foreground">(vous)</span>}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{entry.total} pronostic{entry.total > 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-primary">{entry.points}</p>
                        <p className="text-[10px] text-muted-foreground">pts</p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">Aucun pronostic encore — soyez le premier !</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Global stats */}
          <TabsContent value="stats" className="mt-0 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-card border border-border/50 p-4 text-center">
                <p className="text-3xl font-black text-foreground">{allPredictions.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase mt-1">Total pronostics</p>
              </div>
              <div className="rounded-xl bg-card border border-border/50 p-4 text-center">
                <p className="text-3xl font-black text-foreground">{new Set(allPredictions.map((p) => p.user_id)).size}</p>
                <p className="text-[10px] text-muted-foreground uppercase mt-1">Pronostiqueurs</p>
              </div>
              <div className="rounded-xl bg-card border border-border/50 p-4 text-center">
                <p className="text-3xl font-black text-foreground">{new Set(allPredictions.map((p) => p.fixture_id)).size}</p>
                <p className="text-[10px] text-muted-foreground uppercase mt-1">Matchs couverts</p>
              </div>
            </div>

            <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-4 py-2.5 border-b border-border">
                <h3 className="font-bold text-sm text-foreground">Distribution des pronostics</h3>
              </div>
              <div className="p-4 sm:p-6">
                {(() => {
                  const total = allPredictions.length || 1;
                  const hw = allPredictions.filter((p) => p.home_score > p.away_score).length;
                  const dr = allPredictions.filter((p) => p.home_score === p.away_score).length;
                  const aw = total - hw - dr;
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-xl bg-primary/10 p-4">
                          <p className="text-2xl font-black text-primary">{Math.round((hw / total) * 100)}%</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Victoire domicile</p>
                        </div>
                        <div className="rounded-xl bg-muted/30 p-4">
                          <p className="text-2xl font-black text-muted-foreground">{Math.round((dr / total) * 100)}%</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Nul</p>
                        </div>
                        <div className="rounded-xl bg-primary/10 p-4">
                          <p className="text-2xl font-black text-primary">{Math.round((aw / total) * 100)}%</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Victoire extérieur</p>
                        </div>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                        <div className="bg-primary transition-all" style={{ width: `${(hw / total) * 100}%` }} />
                        <div className="bg-muted-foreground/40 transition-all" style={{ width: `${(dr / total) * 100}%` }} />
                        <div className="bg-accent transition-all" style={{ width: `${(aw / total) * 100}%` }} />
                      </div>
                      {(() => {
                        const scoreMap = new Map<string, number>();
                        allPredictions.forEach((p) => {
                          const key = `${p.home_score}-${p.away_score}`;
                          scoreMap.set(key, (scoreMap.get(key) || 0) + 1);
                        });
                        const topScores = [...scoreMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
                        if (topScores.length === 0) return null;
                        return (
                          <div>
                            <p className="text-xs font-bold text-foreground mb-2">Scores les plus populaires</p>
                            <div className="flex gap-2 flex-wrap">
                              {topScores.map(([score, count]) => (
                                <div key={score} className="rounded-lg bg-muted/30 px-3 py-2 text-center">
                                  <p className="text-sm font-black text-foreground">{score}</p>
                                  <p className="text-[10px] text-muted-foreground">{count}x</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Points system explanation */}
            <div className="rounded-xl bg-card border border-border/50 p-4">
              <h4 className="text-xs font-bold text-foreground mb-2">📊 Système de points</h4>
              <div className="space-y-1 text-[10px] text-muted-foreground">
                <p>• <span className="font-bold text-foreground">10 pts</span> — Score exact deviné</p>
                <p>• <span className="font-bold text-foreground">3 pts</span> — Bon résultat (1/N/2)</p>
                <p>• <span className="font-bold text-foreground">1 pt</span> — Participation</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PredictionsDashboard;
