import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import { initSentry } from "./integrations/sentry";
import ErrorBoundary from "./components/ErrorBoundary";

// Initialisation de Sentry avec sécurité
try {
  initSentry();
} catch (e) {
  console.warn("Sentry init failed", e);
}

// ── Service Worker Registration (PWA) ──────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('[PWA] Service Worker enregistré:', registration.scope);

      // Listen for messages from the SW (e.g. SW_UPDATED)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SW_UPDATED') {
          console.log('[PWA] Nouvelle version disponible:', event.data.version);
          // Dispatch custom event so any React component can show a toast
          window.dispatchEvent(
            new CustomEvent('pwa-update-available', { detail: { version: event.data.version } })
          );
        }
      });
    } catch (err) {
      console.warn('[PWA] Service Worker registration failed:', err);
    }
  });
}

const rootElement = document.getElementById("root");
const loadingElement = document.getElementById("root-loading");

// Handler d'erreur global amélioré
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Critical crash detected:", message, source, lineno, colno, error);
  const displayElement = document.getElementById("root") || document.body;
  const stackInfo = error?.stack || `${source}:${lineno}:${colno}`;
  
  // Si on crash, on affiche une UI d'urgence stylée inline
  displayElement.innerHTML = `
    <div style="background: #0c0f1d; color: white; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; font-family: sans-serif; text-align: center;">
      <div style="font-size: 60px; margin-bottom: 20px;">⚽</div>
      <div style="color: #ef4444; font-weight: bold; font-size: 20px; margin-bottom: 10px;">Oups ! Une erreur est survenue</div>
      <div style="font-size: 0.8rem; color: #94a3b8; max-width: 600px; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2); word-break: break-word;">
        <div style="margin-bottom: 8px;">${message}</div>
        <details style="margin-top: 10px; text-align: left;">
          <summary style="cursor: pointer; color: #f59e0b; font-size: 0.7rem;">Détails techniques (clique pour voir)</summary>
          <pre style="font-size: 0.65rem; color: #64748b; white-space: pre-wrap; margin-top: 8px; max-height: 200px; overflow: auto;">${stackInfo}</pre>
        </details>
      </div>
      <button onclick="window.location.reload()" style="margin-top: 30px; padding: 12px 24px; background: #22c55e; border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.4);">
        Recharger LiveFoot
      </button>
    </div>
  `;
  return false;
};

// Catch unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  );
  
  // Nettoyage intelligent de l'indicateur de chargement
  if (loadingElement) {
    setTimeout(() => {
      loadingElement.style.opacity = "0";
      setTimeout(() => {
        if (loadingElement.parentNode) {
          loadingElement.remove();
        }
      }, 500);
    }, 800);
  }
} else {
  console.error("Root element not found!");
}
