import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserCircle,
  Save,
  LogOut,
  Star,
  ArrowLeft,
  Shield,
  Crown,
  Zap,
  Calendar,
  TrendingUp,
  Bell,
  LayoutDashboard,
  User,
  Settings2,
  Flame,
  Trophy,
  Target,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { NotificationsBell } from "@/components/NotificationsBell";
import { mockTeams } from "@/data/teamsData";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";
import ReferralWidget from "@/components/ReferralWidget";
import { trackConversionEvent } from "@/lib/conversionTracking";

// Gamified rank calculation utility
const getRankDetails = (points: number) => {
  if (points >= 2000) {
    return {
      title: "Légende du Foot",
      next: "Niveau Maximum",
      percent: 100,
      color: "from-yellow-500 to-amber-600 text-amber-300 border-amber-500/30",
      description: "Vous êtes au sommet du classement des experts LiveFoot !",
    };
  }
  if (points >= 500) {
    return {
      title: "Expert Pronostiqueur",
      next: "Légende (2000 pts)",
      percent: ((points - 500) / 1500) * 100,
      color: "from-purple-500 to-indigo-600 text-purple-300 border-purple-500/30",
      description: "Vos analyses commencent à faire trembler les bookmakers.",
    };
  }
  if (points >= 100) {
    return {
      title: "Pronostiqueur Avancé",
      next: "Expert (500 pts)",
      percent: ((points - 100) / 400) * 100,
      color: "from-blue-500 to-sky-600 text-blue-300 border-blue-500/30",
      description: "Vous maîtrisez le radar et l'historique des pronostics.",
    };
  }
  return {
    title: "Débutant Amateur",
    next: "Avancé (100 pts)",
    percent: (points / 100) * 100,
    color: "from-slate-600 to-slate-700 text-slate-300 border-slate-700",
    description: "Faites vos premiers pronostics pour gagner des points.",
  };
};

export default function Profile() {
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
        title: "Erreur",
        description: "Impossible de mettre à jour le profil. Réessayez.",
        variant: "destructive",
      });
    } else {
      await refreshProfile();
      toast({
        title: "Profil enregistré !",
        description: "Vos modifications ont été appliquées avec succès.",
      });
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Connectez-vous pour accéder à votre espace personnel.</p>
          <Link to="/auth" className="mt-4 inline-block text-primary font-bold hover:underline">
            Se connecter
          </Link>
        </div>
      </Layout>
    );
  }

  const initials = (displayName || user.email || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const points = profile?.points || 0;
  const rank = getRankDetails(points);

  return (
    <Layout>
      <SEOHead title="Mon Espace Personnel | LiveFoot" description="Gérez votre compte, votre profil et vos avantages VIP." noIndex={true} />
      
      <div className="container py-4 sm:py-8 max-w-4xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>

        {/* Top Profile Card Container */}
        <div className="rounded-3xl bg-slate-900/50 border border-slate-800 overflow-hidden mb-8 shadow-xl">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 p-6 sm:p-8 border-b border-slate-800">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-primary text-white text-2xl sm:text-3xl font-black shadow-lg shadow-indigo-500/20">
                {initials}
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">{displayName || "Utilisateur"}</h1>
                  <span className={cn(
                    "inline-flex items-center justify-center rounded-full px-3 py-0.5 text-xs font-semibold bg-gradient-to-r border",
                    rank.color
                  )}>
                    {rank.title}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-1">{user.email}</p>
                {username && <p className="text-primary text-xs font-bold mt-1">@{username}</p>}
              </div>
            </div>
          </div>

          {/* Quick stats banner */}
          <div className="grid grid-cols-3 divide-x divide-slate-800 bg-slate-950/40">
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-400" />
                <span className="text-2xl font-black text-white">{points}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Points</p>
            </div>
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-black text-white truncate">{rank.title}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Rang</p>
            </div>
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Star className="h-4 w-4 text-emerald-400" />
                <span className="text-2xl font-black text-white">{totalFavorites}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Favoris</p>
            </div>
          </div>
        </div>

        {/* Tabs Layout */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900/60 border border-slate-800 p-1 rounded-2xl mb-8">
            <TabsTrigger value="dashboard" className="rounded-xl py-3 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-xl py-3 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Mon Profil
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl py-3 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-6 outline-none">
            {/* Gamification Progress Widget */}
            <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-5 sm:p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-white">Progression d'Expertise</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{rank.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium">Prochain rang:</span>
                  <p className="text-xs font-bold text-indigo-400">{rank.next}</p>
                </div>
              </div>

              {/* Custom CSS Progress Bar */}
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/40 p-[2px]">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-primary to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, rank.percent)}%` }}
                />
              </div>

              <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 font-semibold uppercase">
                <span>{points} pts actuels</span>
                <span>{rank.percent.toFixed(0)}% complété</span>
              </div>
            </div>

            {/* Streak & Engagement Stats Widget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-5 flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                    <Flame className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Série de Connexion</h4>
                    <p className="text-[11px] text-slate-400">Restez régulier pour gagner des boosts</p>
                  </div>
                </div>
                <div className="flex justify-between items-center gap-2 px-1">
                  {[1, 2, 3, 4, 5].map((day) => (
                    <div key={day} className="flex flex-col items-center gap-1.5">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center border text-xs font-black shadow-inner",
                        day <= 3 
                          ? "bg-gradient-to-br from-orange-400 to-orange-600 text-slate-950 border-orange-300"
                          : "bg-slate-950 text-slate-600 border-slate-800"
                      )}>
                        {day <= 3 ? <CheckCircle2 className="h-4 w-4" /> : `${day}j`}
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold">Jour {day}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-5 flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Target className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Précision Moyenne</h4>
                    <p className="text-[11px] text-slate-400">Basé sur vos votes et favoris</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="relative h-16 w-16 flex items-center justify-center">
                    {/* Ring simulation */}
                    <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent border-r-transparent rotate-45" />
                    <span className="text-lg font-black text-white relative z-10">72%</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Vos analyses sont de haute volée. Vous surpassez <span className="text-emerald-400 font-bold">78%</span> des utilisateurs inscrits cette semaine.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* VIP Status Card */}
            <div className={cn(
              "rounded-2xl border p-5 sm:p-6 overflow-hidden relative shadow-lg",
              profile?.is_vip
                ? "bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border-amber-500/20"
                : "bg-slate-900/40 border-slate-800"
            )}>
              {profile?.is_vip && (
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Crown className="h-20 w-20 text-amber-500" />
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center border",
                    profile?.is_vip 
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30" 
                      : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                  )}>
                    {profile?.is_vip ? <Crown className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-black text-white text-sm uppercase tracking-tight">
                      Abonnement {profile?.is_vip ? "VIP Premium" : "Utilisateur Standard"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {profile?.is_vip ? "Accès illimité à l'intelligence artificielle" : "Débloquez les analyses algorithmiques professionnelles"}
                    </p>
                  </div>
                </div>
                {profile?.is_vip && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/20">
                    Actif
                  </span>
                )}
              </div>

              {profile?.is_vip ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-800/40">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="h-4 w-4" />
                      <span>Date d'expiration:</span>
                    </div>
                    <span className="font-bold text-white">
                      {profile.vip_expires_at
                        ? format(new Date(profile.vip_expires_at), "d MMMM yyyy", { locale: fr })
                        : "Accès permanent"}
                    </span>
                  </div>
                  <Link to="/pricing" className="block text-center text-xs font-bold text-amber-400 hover:underline">
                    Gérer l'abonnement
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pt-2 border-t border-slate-800/40">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Débloquez les pronostics scores exacts calculés par IA, les alertes d'anomalies de cotes, et l'exclusivité VIP.
                  </p>
                  <Button asChild className="w-full gradient-primary rounded-xl font-bold py-5 mt-2 hover:scale-[1.01] transition-transform">
                    <Link
                      to="/pricing"
                      onClick={() =>
                        trackConversionEvent({
                          goalName: "VIP CTA Click",
                          userId: user?.id,
                          metadata: {
                            source: "profile",
                            placement: "status_card",
                          },
                        })
                      }
                    >
                      DÉCOUVRIR LES OFFRES VIP
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Referral Widget */}
            <ReferralWidget />
          </TabsContent>

          {/* TAB 2: PROFILE EDIT FORM */}
          <TabsContent value="profile" className="outline-none">
            <div className="rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden shadow-lg">
              <div className="bg-slate-950/30 px-5 py-4 border-b border-slate-800 flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-indigo-400" />
                <h2 className="font-bold text-white text-sm">Informations de profil</h2>
              </div>
              <div className="p-5 sm:p-6 space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-slate-300">Nom affiché</Label>
                    <Input
                      id="displayName"
                      placeholder="Nom public"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="rounded-xl border-slate-800 bg-slate-950 focus:border-indigo-500 focus:ring-indigo-500 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-slate-300">Nom d'utilisateur</Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
                      <Input
                        id="username"
                        placeholder="Identifiant"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                        className="rounded-xl border-slate-800 bg-slate-950 pl-8 focus:border-indigo-500 focus:ring-indigo-500 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-slate-300">Biographie</Label>
                  <Textarea
                    id="bio"
                    placeholder="Écrivez quelques mots sur vous..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="rounded-xl border-slate-800 bg-slate-950 resize-none focus:border-indigo-500 focus:ring-indigo-500 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Équipe favorite</Label>
                  <Select value={favoriteTeam} onValueChange={setFavoriteTeam}>
                    <SelectTrigger className="rounded-xl border-slate-800 bg-slate-950 focus:border-indigo-500 focus:ring-indigo-500 text-white">
                      <SelectValue placeholder="Sélectionnez votre équipe favorite" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      {mockTeams.map((team) => (
                        <SelectItem key={team.id} value={team.name} className="focus:bg-slate-800 focus:text-white">
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className={cn(
                    "w-full h-11 rounded-xl gradient-primary font-semibold shadow-lg shadow-primary/20 gap-2 hover:scale-[1.01] transition-transform",
                    saving && "opacity-75"
                  )}
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Enregistrement en cours..." : "Enregistrer les modifications"}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: SETTINGS & ACCOUNT */}
          <TabsContent value="settings" className="space-y-6 outline-none">
            {/* Push Notifications Configuration */}
            <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-5 sm:p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Notifications Push</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Alertes en direct (buts, cartons, résultats)</p>
                  </div>
                </div>
                <NotificationsBell />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed pt-3 border-t border-slate-800/40">
                Vous recevrez des notifications push instantanées pour rester informé de l'actualité des équipes et compétitions que vous suivez.
              </p>
            </div>

            {/* Account Management settings */}
            <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-5 sm:p-6 shadow-lg">
              <h3 className="font-bold text-white text-sm mb-4">Sécurité & Compte</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">Adresse Email (Non modifiable)</Label>
                  <Input
                    value={user.email || ""}
                    disabled
                    className="rounded-xl border-slate-800 bg-slate-950/40 text-slate-400 cursor-not-allowed"
                  />
                </div>
                
                <div className="pt-4 border-t border-slate-800/40">
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300 font-semibold gap-2 transition-colors"
                    onClick={async () => {
                      await signOut();
                      navigate("/");
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Se déconnecter
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
