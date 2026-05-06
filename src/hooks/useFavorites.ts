import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Favorites {
  teams: string[];
  players: string[];
  competitions: string[];
}

const STORAGE_KEY = "livefoot_favorites_v2";

const getStoredFavorites = (): Favorites => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { teams: [], players: [], competitions: [] };
};

const saveStoredFavorites = (fav: Favorites) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fav));
  } catch {}
};

const TYPE_MAP: Record<keyof Favorites, string> = {
  teams: "team",
  players: "player",
  competitions: "competition",
};

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorites>(getStoredFavorites);
  const [loading, setLoading] = useState(false);
  const isMerged = useRef(false);

  // 1. Sync DB -> Local when user logs in
  useEffect(() => {
    if (!user) {
      isMerged.current = false;
      return;
    }

    const syncFavorites = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("favorites")
        .select("entity_id, entity_type")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error loading favorites:", error);
        setLoading(false);
        return;
      }

      const dbFavs: Favorites = { teams: [], players: [], competitions: [] };
      (data || []).forEach((row) => {
        if (row.entity_type === "team") dbFavs.teams.push(row.entity_id);
        else if (row.entity_type === "player") dbFavs.players.push(row.entity_id);
        else if (row.entity_type === "competition") dbFavs.competitions.push(row.entity_id);
      });

      // Merge local into DB on first login
      if (!isMerged.current) {
        const local = getStoredFavorites();
        const toInsert = [];
        
        for (const type of ["teams", "players", "competitions"] as (keyof Favorites)[]) {
          for (const id of local[type]) {
            if (!dbFavs[type].includes(id)) {
              dbFavs[type].push(id);
              toInsert.push({
                user_id: user.id,
                entity_id: id,
                entity_type: TYPE_MAP[type],
              });
            }
          }
        }

        if (toInsert.length > 0) {
          await supabase.from("favorites").insert(toInsert);
        }
        isMerged.current = true;
      }

      setFavorites(dbFavs);
      setLoading(false);
    };

    syncFavorites();
  }, [user]);

  // 2. Persist to LocalStorage (for guest users)
  useEffect(() => {
    if (!user) {
      saveStoredFavorites(favorites);
    }
  }, [favorites, user]);

  const toggleFavorite = useCallback(async (type: keyof Favorites, id: string, name?: string) => {
    const isCurrentlyFav = favorites[type].includes(id);
    const entityType = TYPE_MAP[type];

    // Optimistic Update
    setFavorites(prev => {
      const list = prev[type];
      const next = isCurrentlyFav ? list.filter(i => i !== id) : [...list, id];
      return { ...prev, [type]: next };
    });

    toast(isCurrentlyFav ? "Retiré des favoris" : "Ajouté aux favoris", {
      description: name || id
    });

    if (user) {
      if (isCurrentlyFav) {
        await supabase.from("favorites").delete().match({ user_id: user.id, entity_id: id, entity_type: entityType });
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, entity_id: id, entity_type: entityType, entity_name: name });
      }
    }
  }, [favorites, user]);

  const isFavorite = useCallback((type: keyof Favorites, id: string) => favorites[type].includes(id), [favorites]);

  const totalFavorites = favorites.teams.length + favorites.players.length + favorites.competitions.length;

  return { favorites, toggleFavorite, isFavorite, loading, totalFavorites };
};
