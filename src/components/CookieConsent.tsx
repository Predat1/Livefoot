import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "livefoot-cookie-consent";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics: true, marketing: true, date: new Date().toISOString() }));
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics: false, marketing: false, date: new Date().toISOString() }));
    setVisible(false);
  };

  const handleCustomize = () => {
    setShowDetails(!showDetails);
  };

  if (!visible) return null;

  return (
    <div className={cn(
      "fixed z-[60] left-0 right-0 transition-all duration-500",
      "bottom-16 lg:bottom-0",
      "animate-fade-in"
    )}>
      <div className="container max-w-2xl pb-4 px-4">
        <div className="relative rounded-2xl bg-card border border-border shadow-2xl shadow-black/20 p-5">
          <button
            onClick={handleReject}
            className="absolute top-3 right-3 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-md shadow-primary/20 flex-shrink-0">
              <Cookie className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">Nous utilisons des cookies 🍪</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. 
                En continuant, vous acceptez notre <a href="/privacy" className="text-primary hover:underline">politique de confidentialité</a>.
              </p>
            </div>
          </div>

          {showDetails && (
            <div className="mb-4 space-y-2 rounded-xl bg-muted/50 p-3 text-xs animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Cookies essentiels</span>
                <span className="text-primary font-semibold">Toujours actifs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Cookies analytiques</span>
                <span className="text-muted-foreground">Optionnels</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Cookies marketing</span>
                <span className="text-muted-foreground">Optionnels</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleAccept}
              className="h-9 rounded-xl gradient-primary text-primary-foreground font-bold text-xs px-5 shadow-md shadow-primary/20"
            >
              Accepter tout
            </Button>
            <Button
              onClick={handleReject}
              variant="outline"
              className="h-9 rounded-xl font-bold text-xs px-5"
            >
              Refuser
            </Button>
            <Button
              onClick={handleCustomize}
              variant="ghost"
              className="h-9 rounded-xl font-medium text-xs px-4 text-muted-foreground"
            >
              Personnaliser
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
