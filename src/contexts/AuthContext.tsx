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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isVip: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
      setProfile((data as Profile) ?? null);
    } catch (e) {
      console.warn("fetchProfile failed", e);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  // Derive VIP status from profile column or user metadata
  const isVip = !!(
    profile?.is_vip ||
    user?.user_metadata?.is_vip ||
    user?.app_metadata?.is_vip
  );

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

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isVip, signOut, refreshProfile }}>
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
