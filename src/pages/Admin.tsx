import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin, useAdminStats, useAdminUsers, useUserRoles, useAssignRole, useRemoveRole } from "@/hooks/useAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Users, Trophy, Star, Heart, TrendingUp, Shield, ArrowLeft, UserPlus,
  ShieldCheck, ShieldAlert, UserCog, Trash2, Plus
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

const ROLE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  admin: { label: "Admin", icon: ShieldAlert, color: "bg-destructive/10 text-destructive border-destructive/30" },
  moderator: { label: "Modérateur", icon: ShieldCheck, color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  user: { label: "Utilisateur", icon: UserCog, color: "bg-primary/10 text-primary border-primary/30" },
};

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: allRoles } = useUserRoles();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("moderator");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!roleLoading && isAdmin === false) navigate("/");
  }, [roleLoading, isAdmin, navigate]);

  const getUserRoles = (userId: string) => {
    return (allRoles || []).filter((r) => r.user_id === userId);
  };

  const handleAssign = async (userId: string) => {
    try {
      await assignRole.mutateAsync({ userId, role: selectedRole });
      toast({ title: "Rôle assigné !", description: `Le rôle ${selectedRole} a été attribué.` });
      setSelectedUserId(null);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message?.includes("duplicate") ? "Ce rôle est déjà assigné." : e.message, variant: "destructive" });
    }
  };

  const handleRemove = async (userId: string, role: string) => {
    if (userId === user?.id && role === "admin") {
      toast({ title: "Interdit", description: "Vous ne pouvez pas retirer votre propre rôle admin.", variant: "destructive" });
      return;
    }
    try {
      await removeRole.mutateAsync({ userId, role });
      toast({ title: "Rôle retiré", description: `Le rôle ${role} a été retiré.` });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

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

        {/* Users table with role management */}
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
          <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-foreground">Utilisateurs & Rôles</h2>
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
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Rôles</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Inscrit</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((u: any) => {
                    const roles = getUserRoles(u.user_id);
                    const isExpanded = selectedUserId === u.user_id;
                    return (
                      <tr key={u.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                              {(u.display_name || "?").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-medium text-foreground truncate block max-w-[120px]">
                                {u.display_name || "Sans nom"}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate block max-w-[120px]">
                                {u.favorite_team || ""}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {u.username ? `@${u.username}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {roles.length === 0 && (
                              <span className="text-xs text-muted-foreground/60">Aucun</span>
                            )}
                            {roles.map((r) => {
                              const cfg = ROLE_LABELS[r.role] || ROLE_LABELS.user;
                              const RoleIcon = cfg.icon;
                              return (
                                <span
                                  key={r.id}
                                  className={cn(
                                    "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border",
                                    cfg.color
                                  )}
                                >
                                  <RoleIcon className="h-3 w-3" />
                                  {cfg.label}
                                  <button
                                    onClick={() => handleRemove(u.user_id, r.role)}
                                    className="ml-0.5 hover:opacity-70 transition-opacity"
                                    title="Retirer ce rôle"
                                  >
                                    <Trash2 className="h-2.5 w-2.5" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                          {format(new Date(u.created_at), "dd/MM/yy")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isExpanded ? (
                            <div className="flex items-center gap-1.5 justify-end">
                              <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger className="h-7 w-[120px] text-xs rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="moderator">Modérateur</SelectItem>
                                  <SelectItem value="user">Utilisateur</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                className="h-7 text-xs rounded-lg px-2 gap-1"
                                onClick={() => handleAssign(u.user_id)}
                                disabled={assignRole.isPending}
                              >
                                {assignRole.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                                OK
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs rounded-lg px-2"
                                onClick={() => setSelectedUserId(null)}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs rounded-lg px-2 text-primary hover:bg-primary/10 gap-1"
                              onClick={() => setSelectedUserId(u.user_id)}
                            >
                              <Plus className="h-3 w-3" /> Rôle
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
