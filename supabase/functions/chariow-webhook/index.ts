import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const payload = await req.json();
    console.log("Chariow Webhook Received:", payload);

    // Chariow Pulse event type for successful sale is 'successful.sale'
    // But we should be flexible with the event name
    const event = payload.event;
    const data = payload.data;

    if (event === "successful.sale" || event === "purchase.completed") {
      const userId = data.custom_metadata?.user_id || data.metadata?.user_id;
      const productId = data.product_id;
      const expiresAt = data.license?.expires_at || data.expires_at;

      if (!userId) {
        console.error("Missing user_id in Chariow metadata");
        return new Response(JSON.stringify({ error: "Missing user_id in metadata" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Activating VIP for user ${userId} (Product: ${productId})`);

      // Update the user profile to set is_vip to true
      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({
          is_vip: true,
          vip_expires_at: expiresAt,
          last_license_key: data.license?.key || null,
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw updateError;
      }

      return new Response(JSON.stringify({ success: true, message: "VIP status activated" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default response for other events
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
