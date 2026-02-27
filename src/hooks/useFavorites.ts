import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { livefootToast } from "@/components/ui/sonner";

export interface Favorites {
  teams: string[];
  players: string[];
  competitions: string[];
}

// Map from our Favorites key to entity_type stored in DB
const TYPE_MAP: Record<keyof Favorites, string> = {
  teams: "team",
  players: "player",
  competitions: "competition",
};

const STORAGE_KEY = "livefoot_favorites";

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

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorites>(getStoredFavorites);
  const [loading, setLoading] = useState(false);
  const mergedRef = useRef(false);

  // Load favorites from DB when user logs in
  useEffect(() => {
    if (!user) {
      mergedRef.current = false;
      return;
    }

    const loadFromDB = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("favorites")
        .select("entity_id, entity_type")
        .eq("user_id", user.id);

      if (error) {
        setLoading(false);
        return;
      }

      const dbFavs: Favorites = { teams: [], players: [], competitions: [] };
      (data || []).forEach((row) => {
        if (row.entity_type === "team") dbFavs.teams.push(row.entity_id);
        else if (row.entity_type === "player") dbFavs.players.push(row.entity_id);
        else if (row.entity_type === "competition") dbFavs.competitions.push(row.entity_id);
      });

      // Merge localStorage favorites into DB (only first login per session)
      if (!mergedRef.current) {
        mergedRef.current = true;
        const local = getStoredFavorites();
        const toInsert: { user_id: string; entity_id: string; entity_type: string; entity_name: string }[] = [];

        (["teams", "players", "competitions"] as (keyof Favorites)[]).forEach((key) => {
          local[key].forEach((id) => {
            if (!dbFavs[key].includes(id)) {
              dbFavs[key].push(id);
              toInsert.push({
                user_id: user.id,
                entity_id: id,
                entity_type: TYPE_MAP[key],
                entity_name: id, // fallback, id is descriptive enough
              });
            }
          });
        });

        if (toInsert.length > 0) {
          await supabase.from("favorites").insert(toInsert);
        }
        // Clear localStorage after merge
        saveStoredFavorites({ teams: [], players: [], competitions: [] });
      }

      setFavorites(dbFavs);
      setLoading(false);
    };

    loadFromDB();
  }, [user]);

  // Persist to localStorage when not logged in
  useEffect(() => {
    if (!user) {
      saveStoredFavorites(favorites);
    }
  }, [favorites, user]);

  const toggleFavorite = useCallback(
    async (type: keyof Favorites, id: string, name?: string) => {
      const entityType = TYPE_MAP[type];
      const isCurrentlyFavorite = favorites[type].includes(id);
      const displayName = name || id;

      // Optimistic update
      setFavorites((prev) => {
        const list = prev[type];
        const next = isCurrentlyFavorite
          ? list.filter((i) => i !== id)
          : [...list, id];
        return { ...prev, [type]: next };
      });

      // Toast notification
      livefootToast.favorite(displayName, !isCurrentlyFavorite);

      if (user) {
        if (isCurrentlyFavorite) {
          await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("entity_id", id)
            .eq("entity_type", entityType);
        } else {
          await supabase.from("favorites").insert({
            user_id: user.id,
            entity_id: id,
            entity_type: entityType,
            entity_name: name || id,
          });
        }
      }
    },
    [favorites, user]
  );

  const isFavorite = useCallback(
    (type: keyof Favorites, id: string) => favorites[type].includes(id),
    [favorites]
  );

  const totalFavorites =
    favorites.teams.length +
    favorites.players.length +
    favorites.competitions.length;

  return { favorites, toggleFavorite, isFavorite, totalFavorites, loading };
};
