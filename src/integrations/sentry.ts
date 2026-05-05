import * as Sentry from "@sentry/react";

// DSN doit être configuré via variable d'environnement VITE_SENTRY_DSN
// Si absent ou placeholder → Sentry reste désactivé (pas d'erreur réseau parasite)
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN ?? "";

const isValidDsn = (dsn: string): boolean => {
  if (!dsn) return false;
  if (dsn.includes("placeholder") || dsn.includes("123456")) return false;
  try {
    const url = new URL(dsn);
    return url.protocol === "https:" && url.hostname.includes("sentry.io");
  } catch {
    return false;
  }
};

export const initSentry = () => {
  if (import.meta.env.PROD && SENTRY_DSN && isValidDsn(SENTRY_DSN)) {
    Sentry.init({
      dsn: SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE,
      beforeSend(event) {
        return event;
      },
    });
    console.log("[Sentry] Initialized for production.");
  }
};

export const captureError = (error: Error, context?: Record<string, unknown>) => {
  console.error("[captureError]", error.message, context);
  if (import.meta.env.PROD && isValidDsn(SENTRY_DSN)) {
    Sentry.captureException(error, { extra: context });
  }
};
