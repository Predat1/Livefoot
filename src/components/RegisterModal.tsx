import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Mail, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function RegisterModal() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // If user is logged in, do not trigger
    if (user) return;

    // If on the auth page, do not trigger
    if (location.pathname === "/auth" || location.pathname === "/login") return;

    // If already shown in this session, do not trigger again
    const alreadyShown = sessionStorage.getItem("livefoot_register_prompt_shown");
    if (alreadyShown) return;

    const showModal = () => {
      setIsOpen(true);
      sessionStorage.setItem("livefoot_register_prompt_shown", "true");
    };

    // Check Trigger 1: Arrived on AI prediction page
    const pathname = location.pathname;
    const isPredictionPage =
      pathname === "/daily-picks" ||
      pathname === "/predictions" ||
      pathname === "/vip" ||
      pathname.startsWith("/match/");

    if (isPredictionPage) {
      // Delay slightly (e.g., 2 seconds) for a smoother entry
      const timer = setTimeout(showModal, 2000);
      return () => clearTimeout(timer);
    }

    // Check Trigger 2: 1 minute (60 seconds) elapsed on the site
    const globalTimer = setTimeout(showModal, 60000);

    return () => clearTimeout(globalTimer);
  }, [user, location.pathname]);

  const handleAction = (tab?: "signup" | "login") => {
    setIsOpen(false);
    const redirectParam = encodeURIComponent(location.pathname);
    let targetPath = `/auth?redirect=${redirectParam}`;
    navigate(targetPath);
  };

  const handleSocialSignUp = async (provider: "google") => {
    setIsOpen(false);
    try {
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth?redirect=${encodeURIComponent(location.pathname)}`,
        },
      });
    } catch (err) {
      console.error("OAuth error:", err);
    }
  };

  if (location.pathname === "/auth" || location.pathname === "/login") {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md bg-[#0a0d14] border border-white/10 text-white rounded-3xl p-6 sm:p-8">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-amber-500 opacity-50" />
        
        <DialogHeader className="text-center flex flex-col items-center">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <Gift className="h-7 w-7 text-amber-400 animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-black text-white leading-tight">
            🎁 50 Points Gratuits Offerts !
          </DialogTitle>
          <DialogDescription className="text-white/60 text-sm mt-2 max-w-sm">
            Rejoignez la communauté LiveFoot AI. Créez votre compte gratuit en 10 secondes pour récupérer vos points de bienvenue, sauvegarder vos favoris et débloquer des pronostics VIP exclusifs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <Button
            onClick={() => handleAction("signup")}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:to-amber-500 text-black font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Mail className="h-4 w-4" />
            Créer mon compte gratuitement
          </Button>

          {/* Social Logins */}
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => handleSocialSignUp("google")}
              className="w-full h-11 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 flex items-center justify-center gap-2 text-xs font-bold transition-all hover:text-white"
            >
              <svg className="h-4 w-4 mr-1 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              S'inscrire avec Google
            </Button>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => handleAction("login")}
              className="text-xs text-amber-500 hover:text-amber-400 font-bold flex items-center justify-center gap-1 mx-auto"
            >
              Déjà inscrit ? Se connecter <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
