import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";
import CookieConsent from "@/components/CookieConsent";
import AnimatedRoutes from "@/components/AnimatedRoutes";
import OfflineNotification from "@/components/OfflineNotification";

import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Versioning pour forcer la purge finale du SW (PWA désactivé depuis v2.0.0)
const APP_VERSION = "2.0.0";
const STORAGE_KEY = "livefoot_version";

const App = () => {
  useEffect(() => {
    const savedVersion = localStorage.getItem(STORAGE_KEY);
    if (savedVersion !== APP_VERSION) {
      console.log(`Mise à jour de version détectée: ${savedVersion} -> ${APP_VERSION}`);
      
      // Dés-enregistre tous les Service Workers pour purger le cache
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (let registration of registrations) {
            registration.unregister();
          }
          // Efface tous les caches Workbox
          if ('caches' in window) {
            caches.keys().then(keys => {
              keys.forEach(key => caches.delete(key));
            });
          }
          // Sauvegarde la nouvelle version PUIS reload
          localStorage.setItem(STORAGE_KEY, APP_VERSION);
          window.location.reload();
        });
      } else {
        localStorage.setItem(STORAGE_KEY, APP_VERSION);
      }
    }
  }, []);

  return (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <OfflineNotification />
          <BrowserRouter>
            <ScrollToTop />
            <CookieConsent />
            <AnimatedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
