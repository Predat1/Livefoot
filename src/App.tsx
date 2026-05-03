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

import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

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

const App = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered");
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      toast("Une nouvelle version est disponible", {
        description: "Mise à jour automatique pour les meilleures performances.",
        action: {
          label: "Actualiser",
          onClick: () => updateServiceWorker(true),
        },
      });
      // Force update after 3 seconds if user doesn't click
      const timer = setTimeout(() => {
        updateServiceWorker(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [needRefresh, updateServiceWorker]);

  return (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
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
