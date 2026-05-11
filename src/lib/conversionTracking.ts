import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "livefoot_session_id";

function getSessionId() {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const sessionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(SESSION_KEY, sessionId);
    return sessionId;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export type ConversionGoalName =
  | "Abonnement VIP"
  | "VIP CTA Click"
  | "VIP Checkout Started"
  | "VIP Checkout Success"
  | "VIP Checkout Cancel"
  | "Affiliate CTA Click"
  | "Affiliate Promo Copied"
  | "Favoris ajouté";

export type ConversionMetadata = Record<string, string | number | boolean | null | undefined>;

export async function trackConversionEvent({
  goalName,
  userId,
  valueEur,
  metadata,
}: {
  goalName: ConversionGoalName;
  userId?: string | null;
  valueEur?: number;
  metadata?: ConversionMetadata;
}) {
  try {
    await supabase.rpc("log_conversion" as any, {
      p_goal_name: goalName,
      p_session_id: getSessionId(),
      p_user_id: userId || null,
      p_value_eur: valueEur ?? null,
      p_metadata: {
        path: typeof window !== "undefined" ? window.location.pathname : null,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        ...metadata,
      },
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Conversion tracking failed", error);
    }
  }
}
