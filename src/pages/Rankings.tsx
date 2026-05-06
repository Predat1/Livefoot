import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Star, Users, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeaderboardUser {
  id: string;
  display_name: string;
  avatar_url: string;
  points: number;
  rank_title: string;
}

const Rankings = () => {
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, points, rank_title")
        .order("points", { ascending: false })
        .limit(20);
      
      if (!error && data) {
        setTopUsers(data as unknown as LeaderboardUser[]);
      }
      setLoading(false);
    };

    fetchRankings();
  }, []);

  return (
    <Layout>
      <main className="container py-8 px-4">
        <header className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-xl shadow-primary/20 mb-4 rotate-3">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-foreground mb-2 tracking-tighter uppercase">Classement des Pronostiqueurs</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Gagnez des points en participant aux pronostics et devenez la légende de LiveFoot !
          </p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Calcul du classement...</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-3 mb-10 items-end">
              {topUsers.slice(0, 3).map((user, i) => {
                const isFirst = i === 0;
                const order = i === 0 ? 2 : i === 1 ? 1 : 3;
                return (
                  <motion.div 
                    key={user.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-3xl border transition-all",
                      isFirst ? "bg-primary/10 border-primary/30 h-52" : "bg-card border-border h-44",
                      `order-${order}`
                    )}
                  >
                    <div className="relative">
                      <Avatar className={cn("border-4", isFirst ? "h-20 w-20 border-primary" : "h-16 w-16 border-muted")}>
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="text-xl font-bold">{user.display_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "absolute -bottom-2 -right-2 h-8 w-8 rounded-full flex items-center justify-center shadow-lg border-2 border-background",
                        i === 0 ? "bg-amber-400" : i === 1 ? "bg-slate-300" : "bg-amber-700"
                      )}>
                        <Medal className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="text-center min-w-0 w-full">
                      <p className="text-xs font-black truncate">{user.display_name || "Anonyme"}</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="text-sm font-black text-primary">{user.points} pts</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* List for the rest */}
            <div className="rounded-3xl bg-card border border-border/50 overflow-hidden shadow-sm">
              <div className="bg-muted/30 px-6 py-3 border-b border-border flex items-center justify-between">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Rang & Joueur</span>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Points</span>
              </div>
              <div className="divide-y divide-border/50">
                {topUsers.slice(3).map((user, i) => (
                  <motion.div 
                    key={user.id}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: (i + 3) * 0.05 }}
                    className="px-6 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-muted-foreground w-6">#{i + 4}</span>
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.display_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold text-foreground">{user.display_name || "Anonyme"}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">{user.rank_title || "Joueur"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-black text-primary">{user.points}</p>
                        <p className="text-[9px] text-muted-foreground uppercase">Points</p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-emerald-500 opacity-50" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="p-8 text-center bg-primary/5 rounded-3xl border border-primary/10 mt-8">
              <h3 className="text-lg font-black text-foreground mb-2">Comment gagner des points ?</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>✅ +10 pts pour chaque pronostic soumis</li>
                <li>🎯 +50 pts pour un score exact (bientôt !)</li>
                <li>🔥 +20 pts pour un résultat correct (1N2)</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
};

export default Rankings;
