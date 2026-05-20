import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { PredictionTicketProvider } from "@/contexts/PredictionTicketContext";
import ScrollToTop from "@/components/ScrollToTop";
import CookieConsent from "@/components/CookieConsent";
import AnimatedRoutes from "@/components/AnimatedRoutes";
import OfflineNotification from "@/components/OfflineNotification";
import PredictionTicketDrawer from "@/components/PredictionTicketDrawer";
import PredictionTicketButton from "@/components/PredictionTicketButton";

import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes stale time by default (reduces frequent calls)
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false, // Prevent aggressive refetching on focus shift to save API requests
      refetchOnReconnect: true,    // Refresh when network reconnects
    },
  },
});

// Versioning pour forcer la purge finale du SW (PWA désactivé depuis v2.0.0)
const APP_VERSION = "2.0.0";
const STORAGE_KEY = "livefoot_version";

const App = () => {
  useEffect(() => {
    // Versioning pour purger le cache après une mise à jour majeure
    // On utilise un verrou de session pour éviter les boucles infinies de reload
    try {
      const savedVersion = localStorage.getItem(STORAGE_KEY);
      const sessionReloadLock = sessionStorage.getItem("lf_reload_lock");

      if (savedVersion !== APP_VERSION && sessionReloadLock !== APP_VERSION) {
        console.log(`Mise à jour de version détectée: ${savedVersion || "aucune"} -> ${APP_VERSION}`);
        
        // On tente de marquer la version
        try {
          localStorage.setItem(STORAGE_KEY, APP_VERSION);
          // Verrou de session pour dire qu'on a déjà tenté de recharger pour cette version dans cet onglet
          sessionStorage.setItem("lf_reload_lock", APP_VERSION);
        } catch (e) {
          console.warn("Impossible de sauvegarder la version dans localStorage", e);
        }

        // Petit délai pour laisser le temps au storage de se synchroniser (certains navigateurs)
        setTimeout(() => window.location.reload(), 100);
      }
    } catch (e) {
      console.warn("Erreur accès Storage pour versioning:", e);
    }
  }, []);

  return (
  <ThemeProvider 
    attribute="class" 
    defaultTheme="dark" 
    enableSystem 
    storageKey="theme"
    disableTransitionOnChange={false}
  >
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <OfflineNotification />
          <BrowserRouter>
            <ScrollToTop />
            <CookieConsent />
            <PredictionTicketProvider>
              <AnimatedRoutes />
              <PredictionTicketDrawer />
              <PredictionTicketButton />
            </PredictionTicketProvider>
          </BrowserRouter>
          <Analytics />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
