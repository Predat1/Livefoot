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

// Enregistrement du Service Worker pour les notifications Push
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw-goal-notifications.js')
      .then(reg => console.log('SW Registered!', reg))
      .catch(err => console.log('SW Register failed!', err));
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </ErrorBoundary>
);
