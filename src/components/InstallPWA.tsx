import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
                        (window.navigator as any).standalone === true;
    
    // Check if user dismissed it recently
    const isDismissed = localStorage.getItem("pwa_banner_dismissed");
    
    if (isStandalone || isDismissed) {
      setIsVisible(false);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember dismissal for 7 days
    localStorage.setItem("pwa_banner_dismissed", "true");
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-[100] sm:bottom-6 sm:left-auto sm:right-6 sm:w-80"
      >
        <div className="bg-card border border-primary/20 rounded-2xl shadow-2xl p-4 shadow-primary/10 backdrop-blur-md">
          <button 
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-start gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
              <Smartphone className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Installer LiveFoot</h3>
              <p className="text-xs text-muted-foreground mt-1">Accédez aux scores et pronos IA en un clic depuis votre écran d'accueil.</p>
            </div>
          </div>
          
          <Button 
            onClick={handleInstallClick}
            className="w-full rounded-xl gradient-primary font-black gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
          >
            <Download className="h-4 w-4" />
            INSTALLER L'APPLI
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPWA;
