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
import { UserCircle, Save, LogOut, Star, ArrowLeft, Shield, Crown, Zap, Calendar, TrendingUp, Bell } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { NotificationsBell } from "@/components/NotificationsBell";
import LogoGenerator from "@/components/LogoGenerator";
import { mockTeams } from "@/data/teamsData";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

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
      toast({ title: "Error", description: "Failed to save profile. Please try again.", variant: "destructive" });
    } else {
      await refreshProfile();
      toast({ title: "Profile saved!", description: "Your changes have been saved." });
    }
  };

  if (!user) return null;

  const initials = (displayName || user.email || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Layout>
      <SEOHead title="My Profile" description="Edit your LiveFoot profile." />
      <div className="container py-4 sm:py-8 max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* Avatar / Header */}
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden mb-6">
          <div className="gradient-primary p-6 sm:p-8 text-primary-foreground">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-white/20 text-2xl sm:text-3xl font-black shadow-lg">
                {initials}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-black">{displayName || "Your Profile"}</h1>
                <p className="text-primary-foreground/70 text-sm mt-1">{user.email}</p>
                {username && (
                  <p className="text-primary-foreground/80 text-sm font-medium">@{username}</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-2xl font-black text-foreground">{profile?.points || 0}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Points</p>
            </div>
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-black text-foreground truncate">{profile?.rank_title || "Débutant"}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Rang</p>
            </div>
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="text-2xl font-black text-foreground">{totalFavorites}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Favoris</p>
            </div>
          </div>
        </div>

        {/* VIP Status Card */}
        <div className={cn(
          "rounded-2xl border mb-6 p-5 sm:p-6 overflow-hidden relative",
          profile?.is_vip ? "bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border-amber-500/20" : "bg-card border-border/50"
        )}>
          {profile?.is_vip && <div className="absolute top-0 right-0 p-4 opacity-10"><Crown className="h-16 w-16 text-amber-500" /></div>}
          
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center",
                profile?.is_vip ? "bg-amber-500/20 text-amber-500" : "bg-primary/10 text-primary"
              )}>
                {profile?.is_vip ? <Crown className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="font-black text-foreground uppercase tracking-tight">
                  Statut {profile?.is_vip ? "VIP Premium" : "Utilisateur Gratuit"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {profile?.is_vip ? "Accès illimité à l'IA AnalystePro V3" : "Passez au VIP pour débloquer l'IA"}
                </p>
              </div>
            </div>
            {profile?.is_vip && (
              <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase">Actif</span>
            )}
          </div>

          {profile?.is_vip ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Expire le :</span>
                </div>
                <span className="font-bold text-foreground">
                  {profile.vip_expires_at 
                    ? format(new Date(profile.vip_expires_at), "d MMMM yyyy", { locale: fr })
                    : "Illimité"}
                </span>
              </div>
              
              {profile.vip_expires_at && (
                <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "65%" }} // Simulation, ideally calculated
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                  />
                </div>
              )}
              
              <Link to="/pricing" className="block text-center text-xs font-bold text-amber-500 hover:underline">
                Renouveler ou changer d'offre
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground italic bg-black/5 p-3 rounded-xl">
                "Débloquez les pronostics Score Exact, les Value Bets et les analyses en direct en devenant VIP."
              </p>
              <Button asChild className="w-full gradient-primary rounded-xl font-bold">
                <Link to="/pricing">DEVENIR VIP MAINTENANT</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Edit Form */}
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden mb-6">
          <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-foreground">Edit Profile</h2>
          </div>
          <div className="p-5 sm:p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="rounded-xl border-border/50 bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <Input
                    id="username"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="rounded-xl border-border/50 bg-background pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="rounded-xl border-border/50 bg-background resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Favourite Team</Label>
              <Select value={favoriteTeam} onValueChange={setFavoriteTeam}>
                <SelectTrigger className="rounded-xl border-border/50 bg-background">
                  <SelectValue placeholder="Select your favourite team" />
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
              <Input
                value={user.email || ""}
                disabled
                className="rounded-xl border-border/50 bg-muted/30 text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className={cn("w-full h-11 rounded-xl gradient-primary font-semibold shadow-lg shadow-primary/30 gap-2", saving && "opacity-70")}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Logo Generator */}
        <div className="mb-6">
          <LogoGenerator />
        </div>

        {/* Push Notifications */}
        <div className="rounded-2xl bg-card border border-border/50 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-foreground">Notifications</h3>
            </div>
            <NotificationsBell />
          </div>
          <p className="text-xs text-muted-foreground">
            Recevez des alertes en temps réel pour les buts, cartons rouges et résultats des matchs.
          </p>
        </div>

        {/* Sign out */}
        <div className="rounded-2xl bg-card border border-border/50 p-5">
          <h3 className="font-bold text-foreground mb-3">Account</h3>
          <Button
            variant="outline"
            className="w-full h-11 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10 gap-2 font-semibold"
            onClick={async () => { await signOut(); navigate("/"); }}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
