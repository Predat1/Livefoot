import { useState, useEffect } from "react";
import { Download, Check, Smartphone, Share, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import livefootLogo from "@/assets/livefoot-logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 sm:py-12">
        <div className="mx-auto max-w-2xl text-center">
          {/* Hero */}
          <div className="mb-8 flex justify-center">
            <div className="relative flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-3xl overflow-hidden shadow-2xl shadow-primary/40">
              <img src={livefootLogo} alt="LiveFoot logo" className="h-full w-full object-cover" />
            </div>
          </div>

          <h1 className="mb-4 text-3xl sm:text-4xl font-black text-foreground">
            Install LiveFoot
          </h1>
          
          <p className="mb-8 text-base sm:text-lg text-muted-foreground">
            Get the best football experience. Install our app for instant access to live scores, 
            news, and more - even offline!
          </p>

          {isInstalled ? (
            <div className="mb-8 flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-semibold text-primary">App Installed!</p>
              <p className="text-sm text-muted-foreground">
                You can now access LiveFoot from your home screen.
              </p>
            </div>
          ) : (
            <>
              {/* Android / Chrome install button */}
              {deferredPrompt && (
                <Button
                  onClick={handleInstall}
                  size="lg"
                  className="mb-8 h-14 rounded-2xl gradient-primary px-8 text-lg font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
                >
                  <Download className="mr-3 h-6 w-6" />
                  Install App
                </Button>
              )}

              {/* iOS Instructions */}
              {isIOS && !deferredPrompt && (
                <div className="mb-8 rounded-2xl border border-border bg-card p-6 text-left">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                    <Smartphone className="h-5 w-5 text-primary" />
                    Install on iPhone/iPad
                  </h3>
                  <ol className="space-y-4 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                      <span>Tap the <Share className="inline h-4 w-4 mx-1" /> Share button in Safari</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                      <span>Scroll down and tap <Plus className="inline h-4 w-4 mx-1" /> "Add to Home Screen"</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                      <span>Tap "Add" to install</span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Android fallback instructions */}
              {isAndroid && !deferredPrompt && (
                <div className="mb-8 rounded-2xl border border-border bg-card p-6 text-left">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                    <Smartphone className="h-5 w-5 text-primary" />
                    Install on Android
                  </h3>
                  <ol className="space-y-4 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                      <span>Tap the <MoreVertical className="inline h-4 w-4 mx-1" /> menu in Chrome</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                      <span>Tap "Install app" or "Add to Home screen"</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                      <span>Confirm by tapping "Install"</span>
                    </li>
                  </ol>
                </div>
              )}
            </>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              { icon: "⚡", title: "Fast", desc: "Instant loading speeds" },
              { icon: "📱", title: "Native Feel", desc: "Works like a real app" },
              { icon: "🔔", title: "Offline", desc: "Access without internet" },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-4 text-center"
              >
                <span className="text-2xl">{feature.icon}</span>
                <h4 className="mt-2 font-semibold text-foreground">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Install;
