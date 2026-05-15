import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MIN_PAYOUT_EUR = 30;

// Convert EUR to FCFA
function eurToFcfa(eur: number): number {
  return Math.round(eur * 655.957 * 100) / 100;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client with auth
    const authHeader = req.headers.get("authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: { persistSession: false },
        global: { headers: { Authorization: authHeader } }
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const { amount, paymentMethod, paymentDetails } = await req.json();

    // Validate inputs
    if (!amount || !paymentMethod || !paymentDetails) {
      return new Response(
        JSON.stringify({ error: "amount, paymentMethod, and paymentDetails are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate payment details
    const { operator, phoneNumber, fullName, country, city } = paymentDetails;
    if (!operator || !phoneNumber || !fullName || !country || !city) {
      return new Response(
        JSON.stringify({ error: "All payment details required: operator, phoneNumber, fullName, country, city" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check minimum payout
    if (amount < MIN_PAYOUT_EUR) {
      return new Response(
        JSON.stringify({ error: `Minimum payout is ${MIN_PAYOUT_EUR}€` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has partner profile
    const { data: partnerProfile, error: profileError } = await supabase
      .from("partner_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: "Error checking partner profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!partnerProfile) {
      return new Response(
        JSON.stringify({ 
          error: "Partner profile required",
          message: "Please complete your partner profile before requesting a payout"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if WhatsApp number is provided
    if (!partnerProfile.whatsapp_number || partnerProfile.whatsapp_number.length < 8) {
      return new Response(
        JSON.stringify({ 
          error: "WhatsApp number required",
          message: "Please add your WhatsApp number in your partner profile. It is required for communication."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check available balance
    const { data: balance, error: balanceError } = await supabase
      .from("referral_balance")
      .select("available_balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (balanceError) {
      return new Response(
        JSON.stringify({ error: "Error checking balance" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const availableBalance = balance?.available_balance ?? 0;

    if (availableBalance < amount) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient balance",
          available: availableBalance,
          requested: amount
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing pending payout
    const { data: existingPayout, error: existingError } = await supabase
      .from("referral_payouts")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing payout:", existingError);
    }

    if (existingPayout) {
      return new Response(
        JSON.stringify({ 
          error: "Payout already pending",
          message: "You already have a pending payout request. Please wait for it to be processed."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert to FCFA
    const amountFcfa = eurToFcfa(amount);

    // Create payout request
    const { data: payout, error: payoutError } = await supabase
      .from("referral_payouts")
      .insert({
        user_id: userId,
        amount: amount,
        amount_fcfa: amountFcfa,
        status: "pending",
        payment_method: paymentMethod,
        payment_details: {
          operator,
          phone_number: phoneNumber,
          full_name: fullName,
          country,
          city
        }
      })
      .select()
      .single();

    if (payoutError) {
      console.error("Error creating payout:", payoutError);
      return new Response(
        JSON.stringify({ error: payoutError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Move available balance to pending (conceptually - we'll track via payout status)
    // The balance remains in available until admin approves, then we subtract

    console.log(`Payout request created for user ${userId}: ${amount}€ (${amountFcfa} FCFA)`);

    return new Response(
      JSON.stringify({
        success: true,
        payout_id: payout.id,
        amount_eur: amount,
        amount_fcfa: amountFcfa,
        status: "pending",
        message: "Payout request submitted successfully. You will be paid on the next Tuesday."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Partner request payout error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
