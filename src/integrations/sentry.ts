import * as Sentry from "@sentry/react";

// Remplacez le DSN par celui fourni par votre compte Sentry
const SENTRY_DSN = "https://placeholder-dsn@o123456.ingest.sentry.io/123456";

export const initSentry = () => {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: SENTRY_DSN,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: 1.0,
      environment: import.meta.env.MODE,
      beforeSend(event) {
        // Optionnel: filtrer ou modifier l'événement avant l'envoi
        return event;
      },
    });
    console.log("Sentry initialized for production");
  }
};

export const captureError = (error: Error, context?: any) => {
  console.error("Captured Error:", error, context);
  if (import.meta.env.PROD) {
    Sentry.captureException(error, { extra: context });
  }
};
