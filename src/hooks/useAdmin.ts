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

// ═══════════════════════════════════════════════════════════════
// PHASE 2 : Monétisation & VIP
// ═══════════════════════════════════════════════════════════════

export interface RevenueStats {
  total_revenue_eur: number;
  revenue_7d_eur: number;
  revenue_30d_eur: number;
  partner_revenue_eur: number;
  total_clicks: number;
  total_conversions: number;
  transactions_count: number;
  transactions_7d: number;
  pending_count: number;
  failed_count: number;
  stripe_revenue: number;
  paypal_revenue: number;
  crypto_revenue: number;
  chariow_revenue: number;
  arpu_eur: number;
}

export function useAdminRevenueStats() {
  return useQuery({
    queryKey: ["admin-revenue-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_revenue_stats" as any);
      if (error) throw error;
      return data as RevenueStats;
    },
    staleTime: 60 * 1000,
  });
}

export interface Transaction {
  id: string;
  user_id: string;
  user_email: string;
  type: string;
  amount_eur: number;
  currency: string;
  status: string;
  payment_method: string;
  external_id: string | null;
  metadata: Record<string, any> | null;
  partner_name: string | null;
  created_at: string;
}

export function useAdminTransactions(limit = 50, status: string | null = null, type: string | null = null) {
  return useQuery({
    queryKey: ["admin-transactions", limit, status, type],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_transactions_list" as any, {
        p_limit: limit,
        p_offset: 0,
        p_status: status,
        p_type: type,
      });
      if (error) throw error;
      return (data || []) as Transaction[];
    },
    staleTime: 60 * 1000,
  });
}

export interface Partner {
  id: string;
  name: string;
  type: string;
  logo_url: string | null;
  website_url: string | null;
  commission_rate: number | null;
  flat_amount_eur: number | null;
  tracking_code: string;
  is_active: boolean;
  click_count: number;
  conversion_count: number;
  revenue_eur: number;
  contract_start: string | null;
  contract_end: string | null;
  contact_email: string | null;
  contact_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useAdminPartners() {
  return useQuery({
    queryKey: ["admin-partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Partner[];
    },
    staleTime: 60 * 1000,
  });
}

export function useCreatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      type,
      websiteUrl,
      commissionRate,
      flatAmount,
      trackingCode,
      contactEmail,
      contactName,
      contractStart,
      contractEnd,
      notes,
    }: {
      name: string;
      type: string;
      websiteUrl?: string;
      commissionRate?: number;
      flatAmount?: number;
      trackingCode?: string;
      contactEmail?: string;
      contactName?: string;
      contractStart?: string;
      contractEnd?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase.rpc("admin_partner_create" as any, {
        p_name: name,
        p_type: type,
        p_website_url: websiteUrl,
        p_commission_rate: commissionRate,
        p_flat_amount_eur: flatAmount,
        p_tracking_code: trackingCode,
        p_contact_email: contactEmail,
        p_contact_name: contactName,
        p_contract_start: contractStart,
        p_contract_end: contractEnd,
        p_notes: notes,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-partners"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export function useUpdatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      partnerId,
      ...updates
    }: {
      partnerId: string;
      name?: string;
      type?: string;
      websiteUrl?: string;
      commissionRate?: number;
      flatAmount?: number;
      isActive?: boolean;
      contactEmail?: string;
      contactName?: string;
      contractEnd?: string;
      notes?: string;
    }) => {
      const { error } = await supabase.rpc("admin_partner_update" as any, {
        p_partner_id: partnerId,
        p_name: updates.name,
        p_type: updates.type,
        p_website_url: updates.websiteUrl,
        p_commission_rate: updates.commissionRate,
        p_flat_amount_eur: updates.flatAmount,
        p_is_active: updates.isActive,
        p_contact_email: updates.contactEmail,
        p_contact_name: updates.contactName,
        p_contract_end: updates.contractEnd,
        p_notes: updates.notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-partners"] });
    },
  });
}

export function useDeletePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (partnerId: string) => {
      const { error } = await supabase.rpc("admin_partner_delete" as any, {
        p_partner_id: partnerId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-partners"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// PHASE 3 : Analytics hybride
// ═══════════════════════════════════════════════════════════════

export interface AnalyticsStats {
  internal_visitors: number;
  internal_pageviews: number;
  internal_avg_duration: number;
  top_pages: { path: string; views: number }[];
  top_countries: { country_code: string; visitors: number }[];
  device_breakdown: Record<string, number>;
  plausible_visitors: number;
  plausible_pageviews: number;
  plausible_avg_bounce: number;
  plausible_sources: { source: string; visitors: number }[];
  total_conversions: number;
  conversion_value_eur: number;
  period_days: number;
}

export function useAdminAnalyticsStats(days = 30) {
  return useQuery({
    queryKey: ["admin-analytics-stats", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_analytics_stats" as any, {
        p_days: days,
      });
      if (error) throw error;
      return data as AnalyticsStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export interface PlausibleRow {
  date: string;
  visitors: number;
  pageviews: number;
  bounce_rate: number;
  avg_duration: number;
  source?: string;
  medium?: string;
  country?: string;
  device_type?: string;
  page_path?: string;
}

export function useImportPlausible() {
  return useMutation({
    mutationFn: async (data: PlausibleRow[]) => {
      const { data: result, error } = await supabase.rpc("admin_import_plausible" as any, {
        p_data: JSON.stringify(data),
      });
      if (error) throw error;
      return result as number;
    },
  });
}

export function useLogPageView() {
  return useMutation({
    mutationFn: async ({
      sessionId,
      path,
      referrer,
      countryCode,
      deviceType,
      browser,
      os,
      lang,
    }: {
      sessionId: string;
      path: string;
      referrer?: string;
      countryCode?: string;
      deviceType?: string;
      browser?: string;
      os?: string;
      lang?: string;
    }) => {
      const { error } = await supabase.rpc("log_page_view" as any, {
        p_session_id: sessionId,
        p_path: path,
        p_referrer: referrer,
        p_country_code: countryCode,
        p_device_type: deviceType,
        p_browser: browser,
        p_os: os,
        p_lang: lang,
      });
      if (error) throw error;
    },
  });
}

export function useLogConversion() {
  return useMutation({
    mutationFn: async ({
      goalName,
      sessionId,
      userId,
      valueEur,
      metadata,
    }: {
      goalName: string;
      sessionId: string;
      userId?: string;
      valueEur?: number;
      metadata?: Record<string, any>;
    }) => {
      const { error } = await supabase.rpc("log_conversion" as any, {
        p_goal_name: goalName,
        p_session_id: sessionId,
        p_user_id: userId,
        p_value_eur: valueEur,
        p_metadata: metadata,
      });
      if (error) throw error;
    },
  });
}
