import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin user IDs - should be set via environment variable
const ADMIN_USER_IDS = (Deno.env.get("ADMIN_USER_IDS") ?? "").split(",").filter(Boolean);

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

    // Check if user is admin
    const isAdmin = ADMIN_USER_IDS.includes(user.id) || 
                    user.email?.endsWith("@livefoot.fun") ||
                    user.app_metadata?.role === "admin";

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { payoutId, action, rejectionReason } = await req.json();

    if (!payoutId || !action || !["approve", "reject"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "payoutId and action (approve|reject) are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get payout details
    const { data: payout, error: payoutError } = await supabase
      .from("referral_payouts")
      .select("*")
      .eq("id", payoutId)
      .single();

    if (payoutError || !payout) {
      return new Response(
        JSON.stringify({ error: "Payout not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (payout.status !== "pending") {
      return new Response(
        JSON.stringify({ error: `Payout is already ${payout.status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminUserId = user.id;

    if (action === "approve") {
      // Create service role client for admin operations
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      // Check user's current balance
      const { data: balance } = await serviceClient
        .from("referral_balance")
        .select("available_balance")
        .eq("user_id", payout.user_id)
        .single();

      const availableBalance = balance?.available_balance ?? 0;

      if (availableBalance < payout.amount) {
        return new Response(
          JSON.stringify({ 
            error: "Insufficient balance", 
            available: availableBalance,
            requested: payout.amount
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Approve the payout
      const { error: updateError } = await serviceClient
        .from("referral_payouts")
        .update({
          status: "approved",
          processed_at: new Date().toISOString(),
          processed_by: adminUserId
        })
        .eq("id", payoutId);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update balance: subtract from available, add to total_paid
      const { error: balanceError } = await serviceClient.rpc("approve_payout", {
        payout_id: payoutId,
        admin_user_id: adminUserId
      });

      if (balanceError) {
        console.error("Error updating balance via RPC:", balanceError);
        // Try direct update as fallback
        await serviceClient
          .from("referral_balance")
          .update({
            available_balance: availableBalance - payout.amount,
            total_paid: (balance?.total_paid ?? 0) + payout.amount,
            last_paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("user_id", payout.user_id);
      }

      console.log(`Payout ${payoutId} approved by admin ${adminUserId}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Payout approved successfully",
          payout_id: payoutId,
          amount_eur: payout.amount,
          amount_fcfa: payout.amount_fcfa,
          user_id: payout.user_id
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "reject") {
      if (!rejectionReason) {
        return new Response(
          JSON.stringify({ error: "rejectionReason is required when rejecting" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: rejectError } = await supabase
        .from("referral_payouts")
        .update({
          status: "rejected",
          processed_at: new Date().toISOString(),
          processed_by: adminUserId,
          rejection_reason: rejectionReason
        })
        .eq("id", payoutId);

      if (rejectError) {
        return new Response(
          JSON.stringify({ error: rejectError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Payout ${payoutId} rejected by admin ${adminUserId}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Payout rejected",
          payout_id: payoutId,
          rejection_reason: rejectionReason
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Admin process payout error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
