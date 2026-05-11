import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminUserDetail,
  useAdminAuditLogForUser,
  useBanUser,
  useUnbanUser,
  useGrantVip,
  useRevokeVip,
  useDeleteUser,
  useAssignRole,
  useRemoveRole,
  type UserDetail,
  type AuditLogEntry,
} from "@/hooks/useAdmin";
import { useUserRoles, ROLE_CONFIG } from "@/pages/Admin/Users";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  User,
  Shield,
  ShieldCheck,
  Crown,
  Ban,
  Trash2,
  Calendar,
  Star,
  Trophy,
  Heart,
  Users,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";

interface UserDetailDrawerProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailDrawer({ userId, isOpen, onClose }: UserDetailDrawerProps) {
  const { data: user, isLoading } = useAdminUserDetail(userId);
  const { data: auditLog } = useAdminAuditLogForUser(userId, 20);
  const { data: allRoles } = useUserRoles();
  const { user: currentUser } = useAuth();

  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const grantVip = useGrantVip();
  const revokeVip = useRevokeVip();
  const deleteUser = useDeleteUser();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();

  const [banReason, setBanReason] = useState("");
  const [showBanForm, setShowBanForm] = useState(false);
  const [vipDuration, setVipDuration] = useState("30");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isHardDelete, setIsHardDelete] = useState(false);

  if (isLoading || !user) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg bg-slate-950 border-slate-800">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const userRoles = allRoles?.filter((r) => r.user_id === user.id) || [];
  const isSelf = user.id === currentUser?.id;

  const handleBan = async () => {
    if (!banReason.trim()) {
      toast.error("Veuillez indiquer un motif de bannissement");
      return;
    }
    try {
      await banUser.mutateAsync({ userId: user.id, reason: banReason });
      toast.success("Utilisateur banni avec succès");
      setBanReason("");
      setShowBanForm(false);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du bannissement");
    }
  };

  const handleUnban = async () => {
    try {
      await unbanUser.mutateAsync(user.id);
      toast.success("Bannissement levé avec succès");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du débannissement");
    }
  };

  const handleGrantVip = async () => {
    const days = parseInt(vipDuration);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    try {
      await grantVip.mutateAsync({
        userId: user.id,
        expiresAt: expiresAt.toISOString(),
      });
      toast.success(`VIP accordé pour ${days} jours`);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'attribution VIP");
    }
  };

  const handleRevokeVip = async () => {
    try {
      await revokeVip.mutateAsync(user.id);
      toast.success("VIP révoqué avec succès");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la révocation VIP");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser.mutateAsync({ userId: user.id, hardDelete: isHardDelete });
      toast.success(isHardDelete ? "Compte définitivement supprimé" : "Compte marqué comme supprimé");
      setShowDeleteConfirm(false);
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la suppression");
    }
  };

  const handleAssignRole = async (role: string) => {
    try {
      await assignRole.mutateAsync({ userId: user.id, role });
      toast.success(`Rôle ${role} attribué`);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'attribution du rôle");
    }
  };

  const handleRemoveRole = async (role: string) => {
    if (role === "admin" && isSelf) {
      toast.error("Vous ne pouvez pas retirer votre propre rôle admin");
      return;
    }
    try {
      await removeRole.mutateAsync({ userId: user.id, role });
      toast.success(`Rôle ${role} retiré`);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du retrait du rôle");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg bg-slate-950 border-slate-800 p-0">
        <SheetHeader className="px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-slate-700">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-slate-800 text-slate-400 font-bold">
                {(user.display_name || user.email).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg font-bold text-white truncate">
                {user.display_name || "Sans nom"}
              </SheetTitle>
              <SheetDescription className="text-slate-400 text-sm truncate">
                @{user.username || "pas de pseudo"}
              </SheetDescription>
            </div>
            <UserStatusBadge user={user} />
          </div>
        </SheetHeader>

        <Tabs defaultValue="profile" className="flex-1 flex flex-col">
          <TabsList className="mx-6 mt-4 bg-slate-900/50 p-1">
            <TabsTrigger value="profile" className="text-xs">Profil</TabsTrigger>
            <TabsTrigger value="roles" className="text-xs">Rôles</TabsTrigger>
            <TabsTrigger value="vip" className="text-xs">VIP</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">Activité</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">Audit</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6 py-4">
            <TabsContent value="profile" className="mt-0 space-y-4">
              <ProfileTab user={user} />
            </TabsContent>

            <TabsContent value="roles" className="mt-0 space-y-4">
              <RolesTab
                roles={userRoles.map((r) => r.role)}
                onAssign={handleAssignRole}
                onRemove={handleRemoveRole}
                isSelf={isSelf}
              />
            </TabsContent>

            <TabsContent value="vip" className="mt-0 space-y-4">
              <VipTab
                vip={user.vip}
                onGrant={handleGrantVip}
                onRevoke={handleRevokeVip}
                vipDuration={vipDuration}
                setVipDuration={setVipDuration}
              />
            </TabsContent>

            <TabsContent value="activity" className="mt-0 space-y-4">
              <ActivityTab stats={user.stats} />
            </TabsContent>

            <TabsContent value="audit" className="mt-0 space-y-4">
              <AuditTab auditLog={auditLog || []} />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="px-6 py-4 border-t border-slate-800 space-y-3">
          {showBanForm ? (
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Motif du bannissement</Label>
              <Input
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Spam, comportement inapproprié..."
                className="bg-slate-900 border-slate-700"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBan}
                  disabled={banUser.isPending}
                  className="flex-1"
                >
                  {banUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmer le bannissement"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowBanForm(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : showDeleteConfirm ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                {isHardDelete
                  ? "Suppression définitive - toutes les données seront perdues"
                  : "Soft delete - le compte sera marqué comme supprimé mais conservé"}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hardDelete"
                  checked={isHardDelete}
                  onChange={(e) => setIsHardDelete(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-900"
                />
                <Label htmlFor="hardDelete" className="text-xs text-slate-400">
                  Suppression définitive (hard delete)
                </Label>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteUser.isPending}
                  className="flex-1"
                >
                  {deleteUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmer la suppression"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              {user.is_banned ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnban}
                  disabled={unbanUser.isPending}
                  className="flex-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Débannir
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBanForm(true)}
                  disabled={isSelf}
                  className="flex-1 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Bannir
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSelf || deleteUser.isPending}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function UserStatusBadge({ user }: { user: UserDetail }) {
  if (user.is_banned) {
    return (
      <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400">
        <Ban className="h-3 w-3 mr-1" />
        Banni
      </Badge>
    );
  }
  if (user.vip.is_vip) {
    return (
      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400">
        <Crown className="h-3 w-3 mr-1" />
        VIP
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
      <CheckCircle className="h-3 w-3 mr-1" />
      Actif
    </Badge>
  );
}

function ProfileTab({ user }: { user: UserDetail }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <InfoCard icon={Mail} label="Email" value={user.email} />
        <InfoCard icon={Calendar} label="Inscription" value={format(new Date(user.created_at), "dd/MM/yyyy", { locale: fr })} />
        <InfoCard icon={LinkIcon} label="ID" value={user.id.slice(0, 8) + "..."} />
        <InfoCard icon={Activity} label="Dernière MAJ" value={format(new Date(user.updated_at), "dd/MM/yyyy", { locale: fr })} />
      </div>

      {user.bio && (
        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Bio</p>
          <p className="text-sm text-slate-200">{user.bio}</p>
        </div>
      )}

      {user.favorite_team && (
        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Équipe favorite</p>
          <p className="text-sm text-slate-200">{user.favorite_team}</p>
        </div>
      )}

      {user.is_banned && (
        <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-sm font-medium text-red-400">Compte banni</p>
          </div>
          <p className="text-xs text-slate-400">Motif : {user.banned_reason}</p>
          <p className="text-xs text-slate-500 mt-1">
            Depuis le {user.banned_at && format(new Date(user.banned_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
          </p>
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
        <p className="text-xs text-slate-500">{label}</p>
      </div>
      <p className="text-sm text-slate-200 font-medium truncate" title={value}>{value}</p>
    </div>
  );
}

function RolesTab({
  roles,
  onAssign,
  onRemove,
  isSelf,
}: {
  roles: string[];
  onAssign: (role: string) => void;
  onRemove: (role: string) => void;
  isSelf: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState("moderator");

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
        <p className="text-sm font-medium text-white mb-3">Rôles actuels</p>
        <div className="flex flex-wrap gap-2">
          {roles.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun rôle spécial</p>
          ) : (
            roles.map((role) => {
              const config = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.user;
              const Icon = config.icon;
              return (
                <Badge
                  key={role}
                  variant="outline"
                  className={cn("gap-1 pr-1", config.color)}
                >
                  <Icon className="h-3 w-3" />
                  {config.label}
                  <button
                    onClick={() => onRemove(role)}
                    disabled={role === "admin" && isSelf}
                    className="ml-1 hover:opacity-70 disabled:opacity-30"
                  >
                    <XCircle className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
        <p className="text-sm font-medium text-white mb-3">Attribuer un rôle</p>
        <div className="flex gap-2">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="flex-1 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Modérateur</SelectItem>
              <SelectItem value="user">Utilisateur</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => onAssign(selectedRole)} size="sm">
            Attribuer
          </Button>
        </div>
      </div>
    </div>
  );
}

function VipTab({
  vip,
  onGrant,
  onRevoke,
  vipDuration,
  setVipDuration,
}: {
  vip: UserDetail["vip"];
  onGrant: () => void;
  onRevoke: () => void;
  vipDuration: string;
  setVipDuration: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-white">Statut VIP</p>
          {vip.is_vip ? (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              <Crown className="h-3 w-3 mr-1" />
              Actif
            </Badge>
          ) : (
            <Badge variant="outline" className="text-slate-500">
              Inactif
            </Badge>
          )}
        </div>

        {vip.is_vip && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Expire le</span>
              <span className="text-slate-200">
                {vip.expires_at
                  ? format(new Date(vip.expires_at), "dd/MM/yyyy", { locale: fr })
                  : "Jamais"}
              </span>
            </div>
            {vip.license_key && (
              <div className="flex justify-between">
                <span className="text-slate-400">Clé de licence</span>
                <span className="text-slate-200 font-mono text-xs">{vip.license_key}</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onRevoke}
              className="w-full mt-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Révoquer le VIP
            </Button>
          </div>
        )}
      </div>

      {!vip.is_vip && (
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
          <p className="text-sm font-medium text-white mb-3">Accorder VIP</p>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-slate-400">Durée (jours)</Label>
              <Select value={vipDuration} onValueChange={setVipDuration}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="7">7 jours</SelectItem>
                  <SelectItem value="30">30 jours</SelectItem>
                  <SelectItem value="90">90 jours</SelectItem>
                  <SelectItem value="365">1 an</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={onGrant} className="w-full">
              <Crown className="h-4 w-4 mr-2" />
              Accorder VIP
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityTab({ stats }: { stats: UserDetail["stats"] }) {
  const items = [
    { icon: Heart, label: "Favoris", value: stats.favorites, color: "text-rose-400" },
    { icon: Trophy, label: "Pronostics", value: stats.predictions, color: "text-emerald-400" },
    { icon: Star, label: "Notes", value: stats.ratings, color: "text-amber-400" },
    { icon: Users, label: "Parrainages", value: stats.referrals, color: "text-blue-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.label} className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <item.icon className={cn("h-5 w-5", item.color)} />
            <p className="text-xs text-slate-400">{item.label}</p>
          </div>
          <p className="text-2xl font-black text-white">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function AuditTab({ auditLog }: { auditLog: AuditLogEntry[] }) {
  if (auditLog.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-8 w-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Aucune action administrative enregistrée</p>
      </div>
    );
  }

  const actionLabels: Record<string, string> = {
    ban: "Bannissement",
    unban: "Débannissement",
    grant_vip: "Attribution VIP",
    revoke_vip: "Révocation VIP",
    delete_user: "Suppression compte",
    assign_role: "Attribution rôle",
    remove_role: "Retrait rôle",
  };

  return (
    <div className="space-y-2">
      {auditLog.map((entry) => (
        <div
          key={entry.id}
          className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 text-sm"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-slate-200">{actionLabels[entry.action] || entry.action}</span>
            <span className="text-xs text-slate-500">
              {format(new Date(entry.created_at), "dd/MM HH:mm", { locale: fr })}
            </span>
          </div>
          <p className="text-xs text-slate-400">Par {entry.admin_email}</p>
          {entry.details && Object.keys(entry.details).length > 0 && (
            <pre className="mt-2 text-xs text-slate-500 bg-slate-950 rounded p-2 overflow-auto">
              {JSON.stringify(entry.details, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
