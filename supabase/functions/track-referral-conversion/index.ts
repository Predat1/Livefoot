import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Commission tiers based on referral count
function getCommissionRate(referralCount: number): number {
  if (referralCount >= 101) return 30;
  if (referralCount >= 51) return 25;
  if (referralCount >= 31) return 20;
  if (referralCount >= 16) return 15;
  if (referralCount >= 5) return 10;
  return 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { userId, amount, productId, isRenewal = false } = await req.json();

    if (!userId || !amount) {
      return new Response(
        JSON.stringify({ error: "userId and amount are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing referral conversion for user ${userId}, amount: ${amount}€`);

    // 1. Find if this user was referred
    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .select("referrer_id, referred_id, converted_to_paid_at")
      .eq("referred_id", userId)
      .maybeSingle();

    if (referralError) {
      console.error("Error finding referral:", referralError);
      return new Response(
        JSON.stringify({ error: referralError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No referrer found - nothing to do
    if (!referral) {
      console.log(`No referrer found for user ${userId}`);
      return new Response(
        JSON.stringify({ message: "No referrer found", commission_created: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const referrerId = referral.referrer_id;
    console.log(`Found referrer ${referrerId} for user ${userId}`);

    // 2. Count total referrals for this referrer
    const { count: totalReferrals, error: countError } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", referrerId);

    if (countError) {
      console.error("Error counting referrals:", countError);
    }

    const referralCount = totalReferrals ?? 0;
    const commissionRate = getCommissionRate(referralCount);

    console.log(`Referrer ${referrerId} has ${referralCount} total referrals, rate: ${commissionRate}%`);

    // 3. Only create commission if rate > 0 (i.e., at least 5 referrals)
    if (commissionRate === 0) {
      // Still mark as converted for tracking, but no commission
      if (!referral.converted_to_paid_at || isRenewal) {
        await supabase
          .from("referrals")
          .update({
            converted_to_paid_at: new Date().toISOString(),
            total_commissions_earned: 0
          })
          .eq("referred_id", userId);
      }

      console.log(`Commission rate is 0% (only ${referralCount} referrals, need 5+)`);
      return new Response(
        JSON.stringify({
          message: "Conversion tracked but no commission (need 5+ referrals for commission)",
          commission_created: false,
          referral_count: referralCount
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Calculate commission
    const commissionAmount = Number((amount * (commissionRate / 100)).toFixed(2));

    // 5. Create commission record
    const { data: commission, error: commissionError } = await supabase
      .from("referral_commissions")
      .insert({
        referrer_id: referrerId,
        referred_id: userId,
        subscription_amount: amount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        status: "pending",
        metadata: {
          product_id: productId,
          is_renewal: isRenewal,
          referral_count_at_time: referralCount
        }
      })
      .select()
      .single();

    if (commissionError) {
      console.error("Error creating commission:", commissionError);
      return new Response(
        JSON.stringify({ error: commissionError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Update referral record
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("total_commissions_earned")
      .eq("referred_id", userId)
      .single();

    const currentTotal = existingReferral?.total_commissions_earned ?? 0;

    await supabase
      .from("referrals")
      .update({
        converted_to_paid_at: new Date().toISOString(),
        total_commissions_earned: currentTotal + commissionAmount
      })
      .eq("referred_id", userId);

    // 7. Activate partner status if not already
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_partner, partner_activated_at")
      .eq("user_id", referrerId)
      .single();

    if (!profile?.is_partner && referralCount >= 5) {
      await supabase
        .from("profiles")
        .update({
          is_partner: true,
          partner_activated_at: new Date().toISOString()
        })
        .eq("user_id", referrerId);
      console.log(`Activated partner status for user ${referrerId}`);
    }

    console.log(`Commission created: ${commissionAmount}€ (${commissionRate}%) for referrer ${referrerId}`);

    return new Response(
      JSON.stringify({
        success: true,
        commission_created: true,
        commission_id: commission.id,
        commission_amount: commissionAmount,
        commission_rate: commissionRate,
        referral_count: referralCount,
        message: `Commission of ${commissionAmount}€ (${commissionRate}%) created for referrer`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Track referral conversion error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
