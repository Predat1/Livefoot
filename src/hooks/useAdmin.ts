import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_stats" as any);
      if (error) throw error;
      return data as {
        total_users: number;
        banned_users: number;
        active_users_7d: number;
        vip_users: number;
        total_predictions: number;
        total_ratings: number;
        total_favorites: number;
        users_with_predictions: number;
        users_with_ratings: number;
        recent_signups_7d: number;
        recent_signups_30d: number;
      };
    },
    staleTime: 60 * 1000,
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });
}

export function useUserRoles() {
  return useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as { id: string; user_id: string; role: string; created_at: string }[];
    },
    staleTime: 60 * 1000,
  });
}

export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("user_roles" as any)
        .insert({ user_id: userId, role } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-user-roles"] });
    },
  });
}

export function useRemoveRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("user_roles" as any)
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-user-roles"] });
      qc.invalidateQueries({ queryKey: ["is-admin"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// PHASE 1 : Gestion utilisateurs avancée
// ═══════════════════════════════════════════════════════════════

export interface UserDetail {
  id: string;
  email: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  favorite_team: string | null;
  created_at: string;
  updated_at: string;
  is_banned: boolean;
  banned_at: string | null;
  banned_reason: string | null;
  roles: string[];
  stats: {
    favorites: number;
    predictions: number;
    ratings: number;
    referrals: number;
  };
  vip: {
    is_vip: boolean;
    expires_at: string | null;
    license_key: string | null;
  };
}

export function useAdminUserDetail(userId: string | null) {
  return useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.rpc("admin_user_detail" as any, {
        p_user_id: userId,
      });
      if (error) throw error;
      return data as UserDetail;
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useBanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { error } = await supabase.rpc("admin_ban_user" as any, {
        p_user_id: userId,
        p_reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-user-detail", userId] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export function useUnbanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("admin_unban_user" as any, {
        p_user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-user-detail", userId] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export function useGrantVip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      expiresAt,
      licenseKey,
    }: {
      userId: string;
      expiresAt: string;
      licenseKey?: string;
    }) => {
      const { error } = await supabase.rpc("admin_set_vip" as any, {
        p_user_id: userId,
        p_expires_at: expiresAt,
        p_license_key: licenseKey,
      });
      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-user-detail", userId] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export function useRevokeVip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("admin_revoke_vip" as any, {
        p_user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-user-detail", userId] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, hardDelete = false }: { userId: string; hardDelete?: boolean }) => {
      const { error } = await supabase.rpc("admin_delete_user" as any, {
        p_user_id: userId,
        p_hard_delete: hardDelete,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  details: Record<string, any>;
  created_at: string;
}

export function useAdminAuditLogForUser(userId: string | null, limit = 50) {
  return useQuery({
    queryKey: ["admin-audit-log", userId, limit],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc("admin_audit_log_for_user" as any, {
        p_target_id: userId,
        p_limit: limit,
      });
      if (error) throw error;
      return (data || []) as AuditLogEntry[];
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}
