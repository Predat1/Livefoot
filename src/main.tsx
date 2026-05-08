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

// Enregistrement du Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .then(() => {
        if ('caches' in window) {
          return caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
        }
      })
      .catch(err => console.log('SW cleanup failed!', err));
  });
}

const rootElement = document.getElementById("root");
const loadingElement = document.getElementById("root-loading");

// Handler d'erreur global amélioré
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Critical crash detected:", message, error);
  const displayElement = document.getElementById("root") || document.body;
  
  // Si on crash, on affiche une UI d'urgence stylée inline
  displayElement.innerHTML = `
    <div style="background: #0c0f1d; color: white; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; font-family: sans-serif; text-align: center;">
      <div style="font-size: 60px; margin-bottom: 20px;">⚽</div>
      <div style="color: #ef4444; font-weight: bold; font-size: 20px; margin-bottom: 10px;">Oups ! Une erreur est survenue</div>
      <div style="font-size: 0.8rem; color: #94a3b8; max-width: 400px; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2); word-break: break-word;">
        ${message}
      </div>
      <button onclick="window.location.reload()" style="margin-top: 30px; padding: 12px 24px; background: #22c55e; border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.4);">
        Recharger LiveFoot
      </button>
    </div>
  `;
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
