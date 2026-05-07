import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import { initSentry } from "./integrations/sentry";
import ErrorBoundary from "./components/ErrorBoundary";

// Initialisation de Sentry pour le monitoring des erreurs
initSentry();

// Global error handling for production debugging
if (import.meta.env.PROD) {
  window.onerror = (message, source, lineno, colno, error) => {
    console.error("Global JS Error:", { message, source, lineno, colno, error });
    return false;
  };

  window.onunhandledrejection = (event) => {
    console.error("Unhandled Promise Rejection:", event.reason);
  };
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>
);
