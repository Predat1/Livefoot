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

    // Get the user from the authorization header
    const authHeader = req.headers.get("Authorization")!;
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Vous devez être connecté pour effectuer un achat." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { product_id } = await req.json();
    if (!product_id) {
      return new Response(JSON.stringify({ error: "Product ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the Chariow secret key
    const chariowKey = Deno.env.get("CHARIOW_SECRET_KEY");
    if (!chariowKey) {
      throw new Error("CHARIOW_SECRET_KEY not configured");
    }

    // Extract user info for checkout
    const email = user.email || "";
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "";
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || "Client";
    const lastName = nameParts.slice(1).join(" ") || "LiveFoot";

    // Call Chariow Checkout API
    const checkoutResponse = await fetch("https://api.chariow.com/v1/checkout", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${chariowKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id,
        email,
        first_name: firstName,
        last_name: lastName,
        redirect_url: `https://livefoot.vercel.app/pricing?checkout=success&sale={sale_id}`,
        custom_metadata: {
          user_id: user.id,
          source: "livefoot_pricing",
        },
      }),
    });

    const result = await checkoutResponse.json();

    if (!checkoutResponse.ok) {
      console.error("Chariow checkout error:", result);
      return new Response(JSON.stringify({ 
        error: result.message || "Erreur lors de la création du checkout." 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle different checkout steps
    const step = result.data?.step;

    if (step === "payment") {
      return new Response(JSON.stringify({
        success: true,
        step: "payment",
        checkout_url: result.data.payment.checkout_url,
        sale_id: result.data.purchase?.id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (step === "completed") {
      // Free product - activate immediately
      await supabaseClient
        .from("profiles")
        .update({ is_vip: true })
        .eq("id", user.id);

      return new Response(JSON.stringify({
        success: true,
        step: "completed",
        message: "Accès VIP activé avec succès !",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (step === "already_purchased") {
      return new Response(JSON.stringify({
        success: true,
        step: "already_purchased",
        message: result.data.message || "Vous avez déjà acheté ce produit.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Unknown step
    return new Response(JSON.stringify({
      success: true,
      step: step,
      data: result.data,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("create-checkout error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
