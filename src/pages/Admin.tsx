import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin, useAdminStats, useAdminUsers } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Trophy, Star, Heart, TrendingUp, Shield, ArrowLeft, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const StatCard = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: number | string; sub?: string }) => (
  <Card className="border-border/50">
    <CardContent className="p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-black text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          {sub && <p className="text-[10px] text-muted-foreground/70">{sub}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: users, isLoading: usersLoading } = useAdminUsers();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!roleLoading && isAdmin === false) navigate("/");
  }, [roleLoading, isAdmin, navigate]);

  if (authLoading || roleLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) return null;

  return (
    <Layout>
      <SEOHead title="Admin Dashboard" description="LiveFoot administration panel" />
      <div className="container py-4 sm:py-8 max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">Dashboard Admin</h1>
            <p className="text-sm text-muted-foreground">Vue d'ensemble de votre application</p>
          </div>
        </div>

        {/* Stats grid */}
        {statsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <StatCard icon={Users} label="Utilisateurs" value={stats.total_users} sub={`+${stats.recent_signups_7d} cette semaine`} />
            <StatCard icon={UserPlus} label="Inscrits (30j)" value={stats.recent_signups_30d} />
            <StatCard icon={Trophy} label="Pronostics" value={stats.total_predictions} sub={`${stats.users_with_predictions} participants`} />
            <StatCard icon={Star} label="Notes joueurs" value={stats.total_ratings} sub={`${stats.users_with_ratings} votants`} />
            <StatCard icon={Heart} label="Favoris" value={stats.total_favorites} />
            <StatCard icon={TrendingUp} label="Engagement" value={stats.users_with_predictions + stats.users_with_ratings} sub="utilisateurs actifs" />
          </div>
        ) : null}

        {/* Users table */}
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
          <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-foreground">Derniers utilisateurs</h2>
            {users && <span className="ml-auto text-xs text-muted-foreground">{users.length} affichés</span>}
          </div>

          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Utilisateur</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Username</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Équipe</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Inscrit</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((u: any) => (
                    <tr key={u.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                            {(u.display_name || "?").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground truncate max-w-[150px]">
                            {u.display_name || "Sans nom"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {u.username ? `@${u.username}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {u.favorite_team || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {format(new Date(u.created_at), "dd/MM/yy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
