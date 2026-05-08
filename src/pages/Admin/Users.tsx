import { useState } from "react";
import { useAdminUsers, useUserRoles, useAssignRole, useRemoveRole } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  UserCog,
  Trash2,
  Plus,
  Loader2,
  Mail,
  Calendar,
  Ban,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROLE_CONFIG = {
  admin: {
    label: "Admin",
    icon: Shield,
    color: "bg-destructive/10 text-destructive border-destructive/30",
  },
  moderator: {
    label: "Modérateur",
    icon: ShieldCheck,
    color: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  },
  user: {
    label: "Utilisateur",
    icon: UserCog,
    color: "bg-primary/10 text-primary border-primary/30",
  },
};

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: allRoles } = useUserRoles();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("moderator");

  const getUserRoles = (userId: string) => {
    return (allRoles || []).filter((r) => r.user_id === userId);
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

    return matchesSearch && matchesRole;
  });

  const handleAssign = async (userId: string) => {
    try {
      await assignRole.mutateAsync({ userId, role: selectedRole });
      toast.success(`Rôle ${selectedRole} attribué avec succès`);
      setSelectedUserId(null);
    } catch (e: any) {
      toast.error(
        e.message?.includes("duplicate")
          ? "Ce rôle est déjà assigné"
          : "Erreur lors de l'attribution du rôle"
      );
    }
  };

  const handleRemove = async (userId: string, role: string) => {
    if (userId === currentUser?.id && role === "admin") {
      toast.error("Vous ne pouvez pas retirer votre propre rôle admin");
      return;
    }
    try {
      await removeRole.mutateAsync({ userId, role });
      toast.success(`Rôle ${role} retiré avec succès`);
    } catch (e: any) {
      toast.error("Erreur lors du retrait du rôle");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Gestion Utilisateurs</h1>
          <p className="text-sm text-slate-400 mt-1">
            {users?.length || 0} utilisateurs inscrits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <Plus className="h-4 w-4 mr-2" />
            Inviter
          </Button>
        </div>
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
                <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700 text-slate-200">
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Modérateur</SelectItem>
                  <SelectItem value="user">Utilisateur</SelectItem>
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
                      Rôles
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                      Inscription
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers?.map((user, index) => {
                    const roles = getUserRoles(user.user_id);
                    const isExpanded = selectedUserId === user.user_id;

                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-slate-800/30 transition-colors"
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
                          <div className="flex flex-wrap gap-1.5">
                            {roles.length === 0 ? (
                              <span className="text-xs text-slate-500">Aucun rôle</span>
                            ) : (
                              roles.map((role) => {
                                const config =
                                  ROLE_CONFIG[role.role as keyof typeof ROLE_CONFIG] ||
                                  ROLE_CONFIG.user;
                                const Icon = config.icon;
                                return (
                                  <span
                                    key={role.id}
                                    className={cn(
                                      "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border",
                                      config.color
                                    )}
                                  >
                                    <Icon className="h-3 w-3" />
                                    {config.label}
                                    <button
                                      onClick={() => handleRemove(user.user_id, role.role)}
                                      className="ml-1 hover:opacity-70 transition-opacity"
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </button>
                                  </span>
                                );
                              })
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
                          {isExpanded ? (
                            <div className="flex items-center justify-end gap-2">
                              <Select
                                value={selectedRole}
                                onValueChange={setSelectedRole}
                              >
                                <SelectTrigger className="h-8 w-[130px] text-xs bg-slate-800 border-slate-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="moderator">Modérateur</SelectItem>
                                  <SelectItem value="user">Utilisateur</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => handleAssign(user.user_id)}
                                disabled={assignRole.isPending}
                              >
                                {assignRole.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Plus className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs"
                                onClick={() => setSelectedUserId(null)}
                              >
                                <XIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-slate-800 border-slate-700"
                              >
                                <DropdownMenuItem
                                  onClick={() => setSelectedUserId(user.user_id)}
                                  className="text-slate-200 focus:bg-slate-700 focus:text-slate-100"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Ajouter un rôle
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-300">
                                  <Ban className="h-4 w-4 mr-2" />
                                  Bannir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
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
    </motion.div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
