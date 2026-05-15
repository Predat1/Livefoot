import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ReferralPayout {
  id: string;
  user_id: string;
  amount: number;
  amount_fcfa: number;
  status: "pending" | "approved" | "rejected" | "paid";
  payment_method: string;
  payment_details: {
    operator: string;
    phone_number: string;
    full_name: string;
    country: string;
    city: string;
  };
  requested_at: string;
  processed_at?: string;
  rejection_reason?: string;
}

export interface ReferralBalance {
  user_id: string;
  pending_balance: number;
  available_balance: number;
  total_earned: number;
  total_paid: number;
  last_paid_at?: string;
}

export function usePartnerPayouts() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<ReferralBalance | null>(null);
  const [payouts, setPayouts] = useState<ReferralPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch balance
      const { data: balanceData, error: balanceError } = await supabase
        .from("referral_balance")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (balanceError && balanceError.code !== "PGRST116") {
        console.error("Error fetching balance:", balanceError);
      }

      setBalance(balanceData);

      // Fetch payouts
      const { data: payoutsData, error: payoutsError } = await supabase
        .from("referral_payouts")
        .select("*")
        .eq("user_id", user.id)
        .order("requested_at", { ascending: false });

      if (payoutsError) {
        console.error("Error fetching payouts:", payoutsError);
      }

      setPayouts(payoutsData || []);
    } catch (error) {
      console.error("Error fetching payout data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const requestPayout = async (amount: number, paymentDetails: ReferralPayout["payment_details"]) => {
    if (!user) return;

    setRequesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("partner-request-payout", {
        body: {
          amount,
          paymentMethod: paymentDetails.operator,
          paymentDetails: {
            operator: paymentDetails.operator,
            phoneNumber: paymentDetails.phone_number,
            fullName: paymentDetails.full_name,
            country: paymentDetails.country,
            city: paymentDetails.city
          }
        }
      });

      if (error) throw error;

      toast.success(data.message || "Demande de retrait envoyée !");
      await fetchData();
      return data;
    } catch (error: any) {
      const message = error.message || "Erreur lors de la demande de retrait";
      toast.error(message);
      throw error;
    } finally {
      setRequesting(false);
    }
  };

  const canRequestPayout = (amount: number) => {
    return balance && balance.available_balance >= amount && amount >= 30;
  };

  const hasPendingPayout = payouts.some(p => p.status === "pending");

  return {
    balance,
    payouts,
    loading,
    requesting,
    requestPayout,
    canRequestPayout,
    hasPendingPayout,
    refresh: fetchData
  };
}
