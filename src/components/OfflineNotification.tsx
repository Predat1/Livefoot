import { useState, useEffect } from "react";
import { WifiOff, Wifi, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const OfflineNotification = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowBackOnline(true);
      setTimeout(() => setShowBackOnline(false), 5000);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setShowBackOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none flex flex-col items-center p-4">
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="pointer-events-auto bg-destructive text-destructive-foreground px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-md"
          >
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <WifiOff className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black uppercase tracking-tighter leading-none mb-0.5">Connexion perdue</p>
              <p className="text-[10px] opacity-80">Le site passera en mode lecture seule jusqu'au retour du réseau.</p>
            </div>
          </motion.div>
        )}

        {showBackOnline && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="pointer-events-auto bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-md"
          >
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <Wifi className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black uppercase tracking-tighter leading-none mb-0.5">Vous êtes en ligne !</p>
              <p className="text-[10px] opacity-80">Synchronisation des données en cours...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OfflineNotification;
