import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEOHead from "@/components/SEOHead";
import livefootLogo from "@/assets/livefoot-logo.png";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { livefootToast } from "@/components/ui/sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const redirectTo = searchParams.get("redirect") || "/";
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, authLoading, navigate, redirectTo]);


  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    if (error) {
      livefootToast.error("Connexion échouée", error.message);
    } else {
      livefootToast.success("Bienvenue !", "Vous êtes connecté.");
      navigate(redirectTo);
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // ── Step 1: Pre-signup IP check ─────────────────────────────────
    let preSignupToken: string | null = null;
    let registeredIpHash: string | null = null;
    try {
      const checkRes = await supabase.functions.invoke('pre-signup-check', {});
      if (checkRes.data) {
        if (checkRes.data.allowed === false) {
          livefootToast.error(
            "Inscription impossible",
            checkRes.data.reason || "Limite d'inscriptions atteinte pour cette adresse IP."
          );
          setLoading(false);
          return;
        }
        preSignupToken = checkRes.data.token || null;
        registeredIpHash = checkRes.data.ip_hash || null;
      }
    } catch (_preCheckErr) {
      // Non-blocking: allow signup even if check fails
    }

    // ── Step 2: Create account ─────────────────────────────────────
    const { data: signupData, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: signupName,
          pre_signup_token: preSignupToken,
        },
      },
    });
    if (error) {
      livefootToast.error("Inscription échouée", error.message);
    } else {
      livefootToast.success("Compte créé !", "Vérifiez votre e-mail pour confirmer votre compte.");
      // ── Step 3: Log IP hash for anti-abuse tracking (fire-and-forget)
      if (signupData?.user?.id && registeredIpHash) {
        supabase
          .from('registration_ip_logs')
          .insert({ user_id: signupData.user.id, ip_hash: registeredIpHash })
          .then(() => {})
          .catch(() => {});
      }
      // ── Step 4: Claim referral if present
      if (refCode && signupData?.user?.id) {
        try {
          await supabase.functions.invoke("claim-referral", {
            body: { referral_code: refCode, referred_user_id: signupData.user.id },
          });
        } catch (_) {
          // Silent — referral failure should not block signup
        }
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) {
      livefootToast.error("Connexion échouée", error.message);
    }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-[#06080c] relative flex items-center justify-center p-4 overflow-hidden">
      <SEOHead
        title={`${t("auth.login")} - LiveFoot VIP`}
        description={t("auth.subtitle")}
      />

      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0a0d14] to-[#121620] border border-white/10 shadow-[0_0_30px_rgba(245,158,11,0.15)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <img src="/logo.svg" alt="LiveFoot" className="h-10 w-10 brightness-0 invert" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-white tracking-tight">{t("auth.title").replace(" AI", "")}<span className="text-amber-400">AI</span></h1>
            <p className="text-sm text-white/50 mt-1">{t("auth.subtitle")}</p>
          </div>
        </div>

        {/* Auth card */}
        <div className="rounded-3xl bg-[#0a0d14] border border-white/10 shadow-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-amber-500 opacity-50" />
          
          {/* Referral welcome banner */}
          {refCode && (
            <div className="mb-6 flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-xl shrink-0 mt-0.5">🎁</span>
              <div>
                <p className="text-xs font-black text-white">Votre ami vous offre 50 points gratuits !</p>
                <p className="text-[10px] text-amber-400/80 mt-0.5">Créez votre compte en 10 secondes pour récupérer vos points et débloquer des pronostics VIP.</p>
              </div>
            </div>
          )}
          <Tabs defaultValue={refCode ? "signup" : "login"}>
            <TabsList className="w-full grid grid-cols-2 mb-8 bg-white/5 p-1 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 transition-all font-bold">{t("auth.login")}</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 transition-all font-bold">{t("auth.signup")}</TabsTrigger>
            </TabsList>

            {/* LOGIN */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-white/70 text-xs font-bold uppercase tracking-wider">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="vous@email.com"
                      className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-amber-500/50 rounded-xl"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-white/70 text-xs font-bold uppercase tracking-wider">{t("auth.password")}</Label>
                    <a href="#" className="text-xs font-medium text-amber-500 hover:text-amber-400">{t("auth.forgot_password")}</a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-amber-500/50 rounded-xl"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 mt-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black shadow-lg shadow-amber-500/20 text-sm transition-all" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : t("auth.submit_login")}
                </Button>
              </form>
            </TabsContent>

            {/* SIGNUP */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-white/70 text-xs font-bold uppercase tracking-wider">{t("auth.username")}</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Alexandre"
                      className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-amber-500/50 rounded-xl"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-white/70 text-xs font-bold uppercase tracking-wider">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="vous@email.com"
                      className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-amber-500/50 rounded-xl"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-white/70 text-xs font-bold uppercase tracking-wider">{t("auth.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-amber-500/50 rounded-xl"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>
                  <p className="text-[10px] text-white/40 mt-1.5 ml-1">{t("auth.min_chars")}</p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 mt-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:to-amber-500 text-black font-black shadow-lg shadow-amber-500/20 text-sm transition-all" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : t("auth.submit_signup")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Social Logins Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0a0d14] px-2 text-white/40 font-bold">Ou continuer avec</span>
            </div>
          </div>

          {/* Social Logins Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-11 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 flex items-center justify-center gap-2 text-xs font-bold transition-all hover:text-white"
            >
              <svg className="h-4 w-4 mr-1 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              Continuer avec Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
