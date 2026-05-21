import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────────
// broadcast-promo-push Edge Function
//
// PURPOSE: Admin-triggered endpoint that fetches all push
//   subscriptions and sends a promotional VIP notification.
//   Uses the Web Push Protocol with VAPID signing.
//
// Requires Supabase secrets:
//   VAPID_PUBLIC_KEY  — public key (base64url)
//   VAPID_PRIVATE_KEY — private key (base64url)
//   VAPID_SUBJECT     — mailto: or https: URL
// ─────────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── VAPID helpers ──────────────────────────────────────────────────

function base64UrlToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

function uint8ArrayToBase64Url(uint8Array: Uint8Array): string {
  let str = "";
  uint8Array.forEach((c) => (str += String.fromCharCode(c)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function importVapidKeys(publicKeyB64: string, privateKeyB64: string) {
  const publicKeyRaw = base64UrlToUint8Array(publicKeyB64);
  const privateKeyRaw = base64UrlToUint8Array(privateKeyB64);

  // Reconstruct ECDH key pair from raw bytes
  const publicKey = await crypto.subtle.importKey(
    "raw",
    publicKeyRaw,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    buildPkcs8(privateKeyRaw),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"]
  );

  return { publicKey, publicKeyRaw, privateKey };
}

function buildPkcs8(privateKeyRaw: Uint8Array): ArrayBuffer {
  // DER-encoded PKCS#8 wrapper for P-256 private key
  const header = new Uint8Array([
    0x30, 0x41, // SEQUENCE (65 bytes)
    0x02, 0x01, 0x00, // INTEGER version = 0
    0x30, 0x13, // SEQUENCE (19 bytes)
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, // OID ecPublicKey
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, // OID P-256
    0x04, 0x27, // OCTET STRING (39 bytes)
    0x30, 0x25, // SEQUENCE (37 bytes)
    0x02, 0x01, 0x01, // INTEGER version = 1
    0x04, 0x20, // OCTET STRING (32 bytes — private key)
  ]);
  const combined = new Uint8Array(header.length + privateKeyRaw.length);
  combined.set(header);
  combined.set(privateKeyRaw, header.length);
  return combined.buffer;
}

async function signVapidJwt(audience: string, subject: string, privateKeyRaw: Uint8Array): Promise<string> {
  // Import signing key (ECDSA P-256)
  const pkcs8 = buildPkcs8(privateKeyRaw);
  const signingKey = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const now = Math.floor(Date.now() / 1000);
  const header = { typ: "JWT", alg: "ES256" };
  const payload = { aud: audience, exp: now + 12 * 3600, sub: subject };

  const encode = (obj: object) =>
    uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(obj)));

  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    signingKey,
    new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${uint8ArrayToBase64Url(new Uint8Array(signature))}`;
}

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKeyRaw: Uint8Array,
  vapidSubject: string
): Promise<{ ok: boolean; status: number; endpoint: string }> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const jwt = await signVapidJwt(audience, vapidSubject, vapidPrivateKeyRaw);
  const authHeader = `vapid t=${jwt},k=${vapidPublicKey}`;

  const payloadBytes = new TextEncoder().encode(payload);

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/octet-stream",
      "Content-Length": payloadBytes.length.toString(),
      TTL: "86400",
    },
    body: payloadBytes,
  });

  return { ok: response.ok, status: response.status, endpoint: subscription.endpoint };
}

// ── Main handler ───────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // ── Auth check: must be admin ────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Accès refusé — admin requis" }), {
        status: 403, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // ── Parse notification payload ───────────────────────────────
    const body = await req.json();
    const title = body.title || "🌟 Offre VIP Exclusive LiveFoot";
    const message = body.message || "Profitez de 30 jours VIP gratuits — accédez à toutes les prédictions IA !";
    const url = body.url || "/pricing";

    const notifPayload = JSON.stringify({ title, body: message, url, tag: "promo-vip" });

    // ── Fetch VAPID keys ─────────────────────────────────────────
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "BJthRQ5myDgc7OSXzPCMftGw-n16F7zQBEN7EHM6kbnEzyQYk_6K518C1D-HqT9t9T-gXoM2Y3J9r2X-hO-9Xxw";
    const vapidPrivateKeyB64 = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@livefoot.fun";

    if (!vapidPrivateKeyB64) {
      return new Response(
        JSON.stringify({ error: "VAPID_PRIVATE_KEY non configuré dans les secrets Supabase" }),
        { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const vapidPrivateKeyRaw = base64UrlToUint8Array(vapidPrivateKeyB64);

    // ── Fetch all subscriptions ──────────────────────────────────
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth");

    if (subError) {
      throw new Error(`Erreur de lecture des abonnements: ${subError.message}`);
    }

    const total = subscriptions?.length || 0;
    if (total === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, failed: 0, total: 0, message: "Aucun abonné" }),
        { headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // ── Send to all subscribers ──────────────────────────────────
    const results = await Promise.allSettled(
      (subscriptions || []).map((sub) =>
        sendPushNotification(sub, notifPayload, vapidPublicKey, vapidPrivateKeyRaw, vapidSubject)
      )
    );

    let sent = 0;
    let failed = 0;
    const failedEndpoints: string[] = [];

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.ok) {
        sent++;
      } else {
        failed++;
        if (result.status === "fulfilled") {
          failedEndpoints.push(result.value.endpoint.substring(0, 60));
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
        total,
        failed_endpoints: failedEndpoints.slice(0, 5),
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("broadcast-promo-push error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
