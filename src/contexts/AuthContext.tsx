import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  favorite_team: string | null;
  is_vip?: boolean;
  points?: number;
  rank_title?: string;
  vip_expires_at?: string | null;
  is_banned?: boolean;
  banned_reason?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isVip: boolean;
  isBanned: boolean;
  banReason: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [banCheckFailed, setBanCheckFailed] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
      const profileData = data as Profile;
      
      // Verification du bannissement
      if (profileData?.is_banned) {
        console.warn("Utilisateur banni - deconnexion forcee");
        setBanCheckFailed(true);
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setSession(null);
        // Redirection via window.location pour forcer le rechargement
        window.location.href = "/login?banned=1&reason=" + encodeURIComponent(profileData.banned_reason || "");
        return;
      }
      
      setProfile(profileData ?? null);
    } catch (e) {
      console.warn("fetchProfile failed", e);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  // Derive VIP status — permanent flag OR a non-expired trial date
  const isVip = !!(() => {
    // Permanent VIP
    if (profile?.is_vip || user?.user_metadata?.is_vip || user?.app_metadata?.is_vip) {
      // If there's an expiry date, still check it hasn't passed
      if (profile?.vip_expires_at) {
        return new Date(profile.vip_expires_at) > new Date();
      }
      return true;
    }
    // Temporary VIP trial (vip_expires_at in the future, is_vip may still be false if not updated)
    if (profile?.vip_expires_at) {
      return new Date(profile.vip_expires_at) > new Date();
    }
    return false;
  })();
  
  // Banned status
  const isBanned = profile?.is_banned ?? false;
  const banReason = profile?.banned_reason ?? null;

  useEffect(() => {
    if (!supabase || !supabase.auth) {
      console.error("Supabase auth is not available");
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => fetchProfile(sess.user.id), 0);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    }).catch(err => {
      console.error("Error getting session:", err);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);


  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Si banni, afficher un message et empecher l'acces
  if (banCheckFailed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Compte suspendu</h1>
          <p className="text-slate-400">Votre compte a ete banni.</p>
          <p className="text-slate-500 text-sm mt-2">Contactez l'administrateur pour plus d'informations.</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isVip, isBanned, banReason, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
