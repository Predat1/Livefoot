import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────────
// pre-signup-check Edge Function
//
// PURPOSE: Called from Auth.tsx BEFORE supabase.auth.signUp().
//   1. Reads the caller's IP.
//   2. Hashes it with SHA-256 + IP_SALT env secret.
//   3. Counts registrations from that IP within the promo window.
//   4. If < max_per_ip → writes a one-time authorization token to
//      pre_signup_authorizations and returns it.
//   5. The token is stored in the user's raw_user_meta_data on
//      signup; a DB trigger validates it before creating the user.
//      (Lightweight approach — we skip the BEFORE INSERT trigger
//       because Supabase Auth doesn't expose one easily; instead
//       the token is used for client-side enforcement + audit.)
// ─────────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256Hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // ── 1. Get client IP ──────────────────────────────────────────
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // ── 2. Hash IP for privacy ────────────────────────────────────
    const salt = Deno.env.get("IP_SALT") || "livefoot_default_salt_2026";
    const ipHash = await sha256Hex(`${clientIp}:${salt}`);

    // ── 3. Check promo settings ───────────────────────────────────
    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["promo_vip_enabled", "promo_vip_max_per_ip", "promo_vip_end_date"]);

    const settingsMap = Object.fromEntries(
      (settings || []).map((s: { key: string; value: string }) => [s.key, s.value])
    );

    const promoEnabled = settingsMap["promo_vip_enabled"] === "true";
    const maxPerIp = parseInt(settingsMap["promo_vip_max_per_ip"] || "3", 10);
    const endDateStr = settingsMap["promo_vip_end_date"];
    const endDate = endDateStr ? new Date(endDateStr) : null;
    const promoActive = promoEnabled && (!endDate || new Date() <= endDate);

    // ── 4. Count existing registrations for this IP ───────────────
    const { count: existingCount } = await supabase
      .from("registration_ip_logs")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash);

    const registrationCount = existingCount ?? 0;

    if (promoActive && registrationCount >= maxPerIp) {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: `Limite de ${maxPerIp} comptes par adresse IP atteinte pendant la promotion.`,
          registration_count: registrationCount,
        }),
        { status: 429, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // ── 5. Generate authorization token ──────────────────────────
    const token = crypto.randomUUID();

    await supabase.from("pre_signup_authorizations").insert({
      token,
      ip_hash: ipHash,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
    });

    return new Response(
      JSON.stringify({
        allowed: true,
        token,
        ip_hash: ipHash,
        registration_count: registrationCount,
        promo_active: promoActive,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("pre-signup-check error:", message);
    // On error we allow signup to avoid blocking legitimate users
    return new Response(
      JSON.stringify({ allowed: true, token: null, error: message }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
