import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ReferralCommission {
  id: string;
  referrer_id: string;
  referred_id: string;
  subscription_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: "pending" | "paid" | "cancelled";
  created_at: string;
  paid_at?: string;
  metadata?: {
    product_id?: string;
    is_renewal?: boolean;
    referral_count_at_time?: number;
  };
}

export function useCommissions() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<ReferralCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalPaid: 0,
    totalEarned: 0,
    thisMonth: 0
  });

  const fetchCommissions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("referral_commissions")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching commissions:", error);
        return;
      }

      setCommissions(data || []);

      // Calculate stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats = (data || []).reduce(
        (acc, commission) => {
          if (commission.status === "pending") {
            acc.totalPending += commission.commission_amount;
          } else if (commission.status === "paid") {
            acc.totalPaid += commission.commission_amount;
          }
          acc.totalEarned += commission.commission_amount;

          const commissionDate = new Date(commission.created_at);
          if (commissionDate >= startOfMonth) {
            acc.thisMonth += commission.commission_amount;
          }

          return acc;
        },
        { totalPending: 0, totalPaid: 0, totalEarned: 0, thisMonth: 0 }
      );

      setStats(stats);
    } catch (error) {
      console.error("Error fetching commissions:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  return {
    commissions,
    loading,
    stats,
    refresh: fetchCommissions
  };
}
