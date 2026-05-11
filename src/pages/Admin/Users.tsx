import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAdminUsers,
  useUserRoles,
  useAdminStats,
  useExportUsersCsv,
} from "@/hooks/useAdmin";
import { UserDetailDrawer } from "@/components/Admin/UserDetailDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users,
  Search,
  Filter,
  Crown,
  Ban,
  CheckCircle,
  Loader2,
  Mail,
  Calendar,
  User,
  Eye,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Re-export pour compatibilité
export { useUserRoles } from "@/hooks/useAdmin";

// Import ROLE_CONFIG depuis utils partagé
import { ROLE_CONFIG } from "@/lib/adminUtils";
export { ROLE_CONFIG };

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: allRoles } = useUserRoles();
  const { data: stats } = useAdminStats();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const getUserRoles = (userId: string) => {
    return (allRoles || []).filter((r) => r.user_id === userId);
  };

  const getUserStatus = (user: any) => {
    if (user.is_banned) return "banned";
    if (user.is_vip) return "vip";
    return "active";
  };

  const filteredUsers = users?.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase());

    const userRoles = getUserRoles(u.user_id);
    const matchesRole =
      roleFilter === "all" || userRoles.some((r) => r.role === roleFilter);

    const status = getUserStatus(u);
    const matchesStatus =
      statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenUser = (userId: string) => {
    setSelectedUserId(userId);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedUserId(null), 300);
  };

  // Export CSV
  const exportUsers = useExportUsersCsv();
  const handleExport = async () => {
    try {
      const csvData = await exportUsers.mutateAsync();
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export CSV téléchargé');
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de l\'export');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total"
          value={stats?.total_users || 0}
          color="bg-blue-500"
        />
        <StatCard
          icon={CheckCircle}
          label="Actifs 7j"
          value={stats?.active_users_7d || 0}
          color="bg-emerald-500"
        />
        <StatCard
          icon={Crown}
          label="VIP"
          value={stats?.vip_users || 0}
          color="bg-amber-500"
        />
        <StatCard
          icon={Ban}
          label="Bannis"
          value={stats?.banned_users || 0}
          color="bg-red-500"
        />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Gestion Utilisateurs</h1>
          <p className="text-sm text-slate-400 mt-1">
            {filteredUsers?.length || 0} sur {users?.length || 0} utilisateurs
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exportUsers.isPending}>
          {exportUsers.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Rechercher par nom, email ou username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700 text-slate-200">
                  <SelectValue placeholder="Rôles" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Modérateur</SelectItem>
                  <SelectItem value="user">Sans rôle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700 text-slate-200">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="banned">Banni</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
        <CardHeader className="border-b border-slate-800">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Liste des Utilisateurs
            {filteredUsers && (
              <span className="text-sm font-normal text-slate-400">
                ({filteredUsers.length} résultat{filteredUsers.length > 1 ? "s" : ""})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                      Contact
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Rôles
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                      Inscription
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers?.map((user, index) => {
                    const roles = getUserRoles(user.user_id);
                    const status = getUserStatus(user);

                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onClick={() => handleOpenUser(user.user_id)}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                              {(user.display_name || user.email || "?")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-200 truncate max-w-[150px]">
                                {user.display_name || "Sans nom"}
                              </p>
                              <p className="text-xs text-slate-500 truncate max-w-[150px]">
                                @{user.username || "pas de pseudo"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[180px]">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {roles.length === 0 ? (
                              <span className="text-xs text-slate-500">-</span>
                            ) : (
                              roles.slice(0, 2).map((role) => {
                                const config =
                                  ROLE_CONFIG[role.role as keyof typeof ROLE_CONFIG] ||
                                  ROLE_CONFIG.user;
                                const Icon = config.icon;
                                return (
                                  <span
                                    key={role.id}
                                    className={cn(
                                      "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border",
                                      config.color
                                    )}
                                  >
                                    <Icon className="h-2.5 w-2.5" />
                                    {config.label}
                                  </span>
                                );
                              })
                            )}
                            {roles.length > 2 && (
                              <span className="text-xs text-slate-500">+{roles.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden sm:table-cell">
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Calendar className="h-3.5 w-3.5" />
                            {user.created_at
                              ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: fr })
                              : "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenUser(user.user_id);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4 text-slate-400" />
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <UserDetailDrawer
        userId={selectedUserId}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-lg font-black text-white">{value}</p>
          <p className="text-xs text-slate-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs = {
    active: {
      label: "Actif",
      icon: CheckCircle,
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    vip: {
      label: "VIP",
      icon: Crown,
      color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    banned: {
      label: "Banni",
      icon: Ban,
      color: "bg-red-500/10 text-red-400 border-red-500/30",
    },
  };

  const config = configs[status as keyof typeof configs] || configs.active;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("gap-1", config.color)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
