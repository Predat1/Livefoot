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
    try {
      const savedVersion = localStorage.getItem(STORAGE_KEY);
      if (savedVersion !== APP_VERSION) {
        console.log(`Mise à jour de version détectée: ${savedVersion} -> ${APP_VERSION}`);
        localStorage.setItem(STORAGE_KEY, APP_VERSION);
        window.location.reload();
      }
    } catch (e) {
      console.warn("Erreur accès localStorage pour versioning:", e);
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
