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

// Suppression de l'indicateur de chargement initial une fois que le JS a démarré
const rootElement = document.getElementById("root");
const loadingElement = document.getElementById("root-loading");
const failsafeLog = document.getElementById("failsafe-log");

if (failsafeLog) failsafeLog.innerText += ' JS STARTED...';

// Handler d'erreur global pour attraper les crashs au démarrage
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global crash detected:", message, error);
  if (loadingElement) {
    loadingElement.innerHTML = `
      <div style="color: #ef4444; font-weight: bold; margin-bottom: 10px;">❌ Erreur critique</div>
      <div style="font-size: 0.8rem; color: #94a3b8; max-width: 300px;">${message}</div>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 8px 16px; background: #22c55e; border: none; border-radius: 4px; color: white; cursor: pointer;">Réessayer</button>
    `;
  }
  return false;
};

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  );
  
  // Nettoyage de l'indicateur de chargement
  if (loadingElement) {
    setTimeout(() => {
      loadingElement.style.opacity = "0";
      setTimeout(() => loadingElement.remove(), 500);
    }, 500);
  }
}
