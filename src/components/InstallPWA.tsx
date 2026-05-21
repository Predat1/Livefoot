import { useState, useEffect } from "react";
import { Download, X, Smartphone, Share, MoreHorizontal, Plus, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type InstallMode = "android" | "ios" | "update" | null;

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [mode, setMode] = useState<InstallMode>(null);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);

  useEffect(() => {
    // Already installed in standalone mode → skip install banner
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    const isDismissed = localStorage.getItem("pwa_banner_dismissed_v2");

    // Listen for pwa-update-available event (fired by main.tsx via SW message)
    const handleSWUpdate = (e: Event) => {
      const version = (e as CustomEvent).detail?.version ?? "nouvelle";
      setUpdateVersion(version);
      setMode("update");
    };
    window.addEventListener("pwa-update-available", handleSWUpdate);

    if (isStandalone || isDismissed) {
      return () => window.removeEventListener("pwa-update-available", handleSWUpdate);
    }

    // Detect iOS
    const isIos =
      /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) &&
      !(window as any).MSStream;

    if (isIos) {
      // Show iOS manual instructions after a short delay
      setTimeout(() => setMode("ios"), 3000);
    }

    // Android / Chrome — wait for beforeinstallprompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setMode("android");
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("pwa-update-available", handleSWUpdate);
    };
  }, []);

  const handleDismiss = () => {
    setMode(null);
    if (mode !== "update") {
      localStorage.setItem("pwa_banner_dismissed_v2", Date.now().toString());
    }
  };

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      toast.success("LiveFoot installé ! 🎉");
    }
    setDeferredPrompt(null);
    setMode(null);
  };

  const handleApplyUpdate = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        setTimeout(() => window.location.reload(), 300);
      });
    } else {
      window.location.reload();
    }
    setMode(null);
  };

  if (!mode) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={mode}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-20 left-4 right-4 z-[100] sm:bottom-6 sm:left-auto sm:right-6 sm:w-88"
      >
        <div className="bg-card border border-primary/20 rounded-2xl shadow-2xl shadow-primary/10 backdrop-blur-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/5">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
              {mode === "update" ? (
                <RefreshCw className="h-5 w-5 text-primary-foreground" />
              ) : (
                <Smartphone className="h-5 w-5 text-primary-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-foreground leading-tight">
                {mode === "update"
                  ? "Mise à jour disponible"
                  : "Installer LiveFoot"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {mode === "update"
                  ? `Version ${updateVersion} — nouvelles fonctionnalités`
                  : "Accédez aux scores & pronos IA en un clic"}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-3">
            {/* Android install */}
            {mode === "android" && (
              <Button
                onClick={handleInstallAndroid}
                className="w-full rounded-xl gradient-primary font-black gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                <Download className="h-4 w-4" />
                INSTALLER L'APPLI
              </Button>
            )}

            {/* iOS manual instructions */}
            {mode === "ios" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  Sur iPhone/iPad, ajoutez LiveFoot à votre écran d'accueil :
                </p>
                <ol className="space-y-2">
                  {[
                    {
                      icon: <Share className="h-4 w-4 text-blue-400" />,
                      text: "Appuyez sur le bouton Partager (carré avec flèche) en bas",
                    },
                    {
                      icon: <Plus className="h-4 w-4 text-emerald-400" />,
                      text: 'Faites défiler et tapez "Sur l\'écran d\'accueil"',
                    },
                    {
                      icon: <Smartphone className="h-4 w-4 text-amber-400" />,
                      text: 'Confirmez en tapant "Ajouter" en haut à droite',
                    },
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                      <span className="flex-shrink-0 mt-0.5">{step.icon}</span>
                      <span>{step.text}</span>
                    </li>
                  ))}
                </ol>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  className="w-full mt-2 rounded-xl text-xs border-white/10 hover:bg-white/5"
                >
                  J'ai compris
                </Button>
              </div>
            )}

            {/* Update available */}
            {mode === "update" && (
              <div className="flex gap-2">
                <Button
                  onClick={handleApplyUpdate}
                  className="flex-1 rounded-xl gradient-primary font-black gap-2 shadow-lg shadow-primary/20"
                >
                  <RefreshCw className="h-4 w-4" />
                  Mettre à jour
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  className="rounded-xl border-white/10 hover:bg-white/5 px-3"
                >
                  Plus tard
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPWA;
