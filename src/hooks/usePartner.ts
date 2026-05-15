import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PartnerProfile {
  user_id: string;
  full_name: string;
  country: string;
  city: string;
  whatsapp_number: string;
  payment_methods: PaymentMethod[];
  is_partner_approved: boolean;
  created_at: string;
}

export interface PaymentMethod {
  operator: string;
  phone_number: string;
  is_default: boolean;
}

export interface ReferralStats {
  totalReferrals: number;
  paidReferrals: number;
  commissionRate: number;
  progressToNextTier: number;
  nextTierThreshold: number | null;
}

export function usePartner() {
  const { user } = useAuth();
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPartnerData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch partner profile
      const { data: profile, error: profileError } = await supabase
        .from("partner_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching partner profile:", profileError);
      }

      setPartnerProfile(profile);

      // Fetch referral stats
      const { count: totalReferrals, error: countError } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", user.id);

      if (countError) {
        console.error("Error counting referrals:", countError);
      }

      const count = totalReferrals ?? 0;

      // Calculate commission rate
      let commissionRate = 0;
      let nextTierThreshold: number | null = null;
      let progressToNextTier = 0;

      if (count >= 101) {
        commissionRate = 30;
        nextTierThreshold = null;
        progressToNextTier = 100;
      } else if (count >= 51) {
        commissionRate = 25;
        nextTierThreshold = 101;
        progressToNextTier = ((count - 51) / (101 - 51)) * 100;
      } else if (count >= 31) {
        commissionRate = 20;
        nextTierThreshold = 51;
        progressToNextTier = ((count - 31) / (51 - 31)) * 100;
      } else if (count >= 16) {
        commissionRate = 15;
        nextTierThreshold = 31;
        progressToNextTier = ((count - 16) / (31 - 16)) * 100;
      } else if (count >= 5) {
        commissionRate = 10;
        nextTierThreshold = 16;
        progressToNextTier = ((count - 5) / (16 - 5)) * 100;
      } else {
        commissionRate = 0;
        nextTierThreshold = 5;
        progressToNextTier = (count / 5) * 100;
      }

      const { count: paidCount, error: paidError } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", user.id)
        .not("converted_to_paid_at", "is", null);

      if (paidError) {
        console.error("Error counting paid referrals:", paidError);
      }

      setReferralStats({
        totalReferrals: count,
        paidReferrals: paidCount ?? 0,
        commissionRate,
        progressToNextTier: Math.round(progressToNextTier),
        nextTierThreshold
      });
    } catch (error) {
      console.error("Error fetching partner data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPartnerData();
  }, [fetchPartnerData]);

  const savePartnerProfile = async (data: Omit<PartnerProfile, "user_id" | "created_at" | "is_partner_approved">) => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("partner_profiles")
        .upsert({
          user_id: user.id,
          full_name: data.full_name,
          country: data.country,
          city: data.city,
          whatsapp_number: data.whatsapp_number,
          payment_methods: data.payment_methods,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });

      if (error) throw error;

      toast.success("Profil partenaire mis à jour !");
      await fetchPartnerData();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return {
    partnerProfile,
    referralStats,
    loading,
    saving,
    isPartner: referralStats?.commissionRate !== undefined && referralStats?.commissionRate > 0,
    canRequestPayout: (referralStats?.commissionRate ?? 0) > 0,
    savePartnerProfile,
    refresh: fetchPartnerData
  };
}
