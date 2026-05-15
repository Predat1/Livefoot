import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Calendar,
  Crown,
  Heart,
  LogOut,
  Mail,
  Save,
  Shield,
  Sparkles,
  Star,
  Trophy,
  UserCircle,
  Zap,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { NotificationsBell } from "@/components/NotificationsBell";
import LogoGenerator from "@/components/LogoGenerator";
import { mockTeams } from "@/data/teamsData";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";
import ReferralWidget from "@/components/ReferralWidget";
import { trackConversionEvent } from "@/lib/conversionTracking";

const Profile = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { totalFavorites } = useFavorites();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (profile) {
      setDisplayName(profile.display_name || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setFavoriteTeam(profile.favorite_team || "");
    }
  }, [user, profile, navigate]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        username: username.trim() || null,
        bio: bio.trim() || null,
        favorite_team: favoriteTeam || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    setSaving(false);

    if (error) {
      toast({
        title: "Profil non sauvegarde",
        description: "Impossible d'enregistrer vos modifications pour le moment.",
        variant: "destructive",
      });
    } else {
      await refreshProfile();
      toast({ title: "Profil sauvegarde", description: "Vos informations ont ete mises a jour." });
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Connectez-vous pour acceder a votre profil.</p>
          <Link to="/auth" className="mt-4 inline-block text-primary font-bold">
            Se connecter
          </Link>
        </div>
      </Layout>
    );
  }

  const profileName = displayName || profile?.display_name || "Mon profil";
  const initials = (profileName || user.email || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const isVip = Boolean(profile?.is_vip);
  const vipDaysLeft = profile?.vip_expires_at
    ? Math.max(0, differenceInDays(new Date(profile.vip_expires_at), new Date()))
    : null;
  const vipProgress = vipDaysLeft === null ? 100 : Math.max(8, Math.min(100, (vipDaysLeft / 30) * 100));
  const joinedAt = user.created_at ? format(new Date(user.created_at), "d MMM yyyy", { locale: fr }) : "Compte actif";

  const statCards = [
    {
      label: "Points",
      value: profile?.points || 0,
      helper: "Score communaute",
      icon: Zap,
      tone: "text-primary bg-primary/10 border-primary/20",
    },
    {
      label: "Rang",
      value: profile?.rank_title || "Debutant",
      helper: "Niveau actuel",
      icon: Trophy,
      tone: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Favoris",
      value: totalFavorites,
      helper: "Equipes et matchs suivis",
      icon: Heart,
      tone: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <Layout>
      <SEOHead title="Dashboard utilisateur" description="Gerez votre profil LiveFoot, vos alertes et votre statut VIP." />
      <div className="container max-w-6xl py-5 sm:py-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Retour aux matchs
          </Link>
          <Button asChild variant="outline" className="h-9 rounded-lg border-border/70 bg-background/60 text-xs font-bold">
            <Link to="/predictions">
              Mes pronos
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <section className="mb-6 overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="relative bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.26),transparent_34%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--muted)/0.45))] px-5 py-6 sm:px-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-primary/15 shadow-xl shadow-primary/10">
                  <div className="flex h-full w-full items-center justify-center text-2xl font-black text-primary">
                    {initials}
                  </div>
                  {isVip && (
                    <div className="absolute -right-1 -top-1 rounded-bl-lg bg-amber-400 p-1 text-black">
                      <Crown className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase", isVip ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-primary/25 bg-primary/10 text-primary")}>
                      {isVip ? <Crown className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                      {isVip ? "VIP Premium" : "Compte gratuit"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Depuis {joinedAt}
                    </span>
                  </div>
                  <h1 className="truncate text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                    {profileName}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {username && <span className="font-semibold text-primary">@{username}</span>}
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
                {statCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-lg border border-border/60 bg-background/70 p-3">
                      <div className={cn("mb-2 flex h-8 w-8 items-center justify-center rounded-lg border", item.tone)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="truncate text-lg font-black leading-tight text-foreground">{item.value}</p>
                      <p className="mt-1 text-[10px] font-black uppercase text-muted-foreground">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <main className="space-y-6">
            <section className={cn("relative overflow-hidden rounded-xl border p-5 sm:p-6", isVip ? "border-amber-500/25 bg-amber-500/10" : "border-border/60 bg-card")}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", isVip ? "bg-amber-500/20 text-amber-300" : "bg-primary/10 text-primary")}>
                    {isVip ? <BadgeCheck className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground">
                      {isVip ? "Votre acces VIP est actif" : "Debloquez le tableau de bord VIP"}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                      {isVip
                        ? "Vous profitez des pronostics IA avances, des value bets et des alertes premium."
                        : "Passez au VIP pour acceder aux analyses AnalystePro, aux scores exacts et aux signaux live."}
                    </p>
                  </div>
                </div>
                <Button asChild className={cn("rounded-lg font-black", isVip ? "bg-amber-400 text-black hover:bg-amber-300" : "gradient-primary")}>
                  <Link
                    to="/pricing"
                    onClick={() =>
                      trackConversionEvent({
                        goalName: "VIP CTA Click",
                        userId: user?.id,
                        metadata: { source: "profile", placement: "dashboard_status" },
                      })
                    }
                  >
                    {isVip ? "Gerer mon offre" : "Devenir VIP"}
                  </Link>
                </Button>
              </div>

              <div className="mt-5 rounded-lg border border-border/50 bg-background/60 p-4">
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-bold text-foreground">{isVip ? "Validite VIP" : "Progression du compte"}</span>
                  <span className="text-xs font-bold text-muted-foreground">
                    {isVip
                      ? profile?.vip_expires_at
                        ? `${vipDaysLeft} jour${vipDaysLeft === 1 ? "" : "s"} restant${vipDaysLeft === 1 ? "" : "s"}`
                        : "Illimite"
                      : "Pret a etre booste"}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${isVip ? vipProgress : 36}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className={cn("h-full rounded-full", isVip ? "bg-gradient-to-r from-amber-500 to-amber-300" : "bg-gradient-to-r from-primary to-emerald-400")}
                  />
                </div>
              </div>
            </section>

            <ReferralWidget />

            <section className="overflow-hidden rounded-xl border border-border/60 bg-card">
              <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-5 py-4">
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-primary" />
                  <h2 className="font-black text-foreground">Informations du profil</h2>
                </div>
                <span className="hidden text-xs font-semibold text-muted-foreground sm:inline">
                  Profil public LiveFoot
                </span>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nom affiche</Label>
                  <Input
                    id="displayName"
                    placeholder="Votre nom"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-11 rounded-lg border-border/60 bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Pseudo</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">@</span>
                    <Input
                      id="username"
                      placeholder="pseudo"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      className="h-11 rounded-lg border-border/60 bg-background pl-7"
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Votre style de jeu, vos championnats favoris, vos objectifs..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="rounded-lg border-border/60 bg-background resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Equipe favorite</Label>
                  <Select value={favoriteTeam} onValueChange={setFavoriteTeam}>
                    <SelectTrigger className="h-11 rounded-lg border-border/60 bg-background">
                      <SelectValue placeholder="Choisir une equipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockTeams.map((team) => (
                        <SelectItem key={team.id} value={team.name}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email || ""} disabled className="h-11 rounded-lg border-border/60 bg-muted/30 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">L'adresse email reste liee a votre connexion.</p>
                </div>

                <div className="sm:col-span-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className={cn("h-11 w-full rounded-lg gradient-primary font-black shadow-lg shadow-primary/20", saving && "opacity-70")}
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Sauvegarde..." : "Sauvegarder les modifications"}
                  </Button>
                </div>
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <section className="rounded-xl border border-border/60 bg-card p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-black text-foreground">Actions rapides</h2>
                  <p className="text-xs text-muted-foreground">Acces direct a vos outils</p>
                </div>
                <Star className="h-4 w-4 text-primary" />
              </div>
              <div className="grid gap-2">
                <QuickAction to="/favorites" icon={Heart} label="Mes favoris" value={`${totalFavorites} suivi${totalFavorites > 1 ? "s" : ""}`} />
                <QuickAction to="/predictions" icon={Trophy} label="Mes pronostics" value="Classement" />
                <QuickAction to="/daily-picks" icon={Sparkles} label="Pronos IA" value={isVip ? "Premium" : "A decouvrir"} />
              </div>
            </section>

            <section className="rounded-xl border border-border/60 bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <h2 className="font-black text-foreground">Notifications</h2>
                </div>
                <NotificationsBell />
              </div>
              <p className="text-sm text-muted-foreground">
                Activez les alertes pour suivre buts, cartons rouges et resultats des matchs importants.
              </p>
            </section>

            <LogoGenerator />

            <section className="rounded-xl border border-border/60 bg-card p-5">
              <h2 className="mb-3 font-black text-foreground">Compte</h2>
              <Button
                variant="outline"
                className="h-11 w-full rounded-lg border-destructive/30 font-bold text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
              >
                <LogOut className="h-4 w-4" />
                Se deconnecter
              </Button>
            </section>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

function QuickAction({
  to,
  icon: Icon,
  label,
  value,
}: {
  to: string;
  icon: typeof Heart;
  label: string;
  value: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/60 p-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-black text-foreground">{label}</span>
          <span className="block truncate text-xs text-muted-foreground">{value}</span>
        </span>
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
    </Link>
  );
}

export default Profile;
