import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

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
      navigate("/");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: signupName },
      },
    });
    if (error) {
      livefootToast.error("Inscription échouée", error.message);
    } else {
      livefootToast.success("Compte créé !", "Vérifiez votre e-mail pour confirmer votre compte.");
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
          
          <Tabs defaultValue="login">
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
        </div>
      </div>
    </div>
  );
};

export default Auth;
