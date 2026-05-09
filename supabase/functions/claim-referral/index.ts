import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REFERRAL_THRESHOLD = 10;
const VIP_HOURS = 48;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { referral_code, referred_user_id } = await req.json();

    if (!referral_code || !referred_user_id) {
      return new Response(JSON.stringify({ error: "referral_code et referred_user_id requis" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // 1. Trouver le parrain via son code
    const { data: referrerProfile, error: profileErr } = await supabase
      .from("profiles")
      .select("id, user_id, referral_vip_granted_at, is_vip")
      .eq("referral_code", referral_code)
      .maybeSingle();

    if (profileErr || !referrerProfile) {
      return new Response(JSON.stringify({ error: "Code de parrainage invalide" }), {
        status: 404, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // 2. Éviter l'auto-parrainage
    if (referrerProfile.user_id === referred_user_id) {
      return new Response(JSON.stringify({ error: "Auto-parrainage non autorisé" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // 3. Éviter les doublons
    const { data: existing } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_id", referred_user_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ message: "Parrainage déjà enregistré" }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // 4. Enregistrer le parrainage
    await supabase.from("referrals").insert({
      referrer_id: referrerProfile.user_id,
      referred_id: referred_user_id,
      referral_code,
      status: "accepted",
    });

    // 5. Compter le total de parrainages acceptés
    const { count } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", referrerProfile.user_id);

    const totalReferrals = count ?? 0;

    // 6. Activer VIP 48h si seuil atteint et pas encore accordé
    if (totalReferrals >= REFERRAL_THRESHOLD && !referrerProfile.referral_vip_granted_at) {
      const vipExpires = new Date(Date.now() + VIP_HOURS * 60 * 60 * 1000).toISOString();
      await supabase
        .from("profiles")
        .update({
          is_vip: true,
          vip_expires_at: vipExpires,
          referral_vip_granted_at: new Date().toISOString(),
        } as any)
        .eq("user_id", referrerProfile.user_id);

      return new Response(JSON.stringify({
        message: "Parrainage enregistré — VIP 48h activé pour le parrain !",
        vip_activated: true,
        total_referrals: totalReferrals,
      }), { headers: { ...CORS, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      message: "Parrainage enregistré",
      vip_activated: false,
      total_referrals: totalReferrals,
      remaining: Math.max(0, REFERRAL_THRESHOLD - totalReferrals),
    }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
