import { useState, useCallback, useEffect } from "react";

interface Favorites {
  teams: string[];
  players: string[];
  competitions: string[];
}

const STORAGE_KEY = "livefoot_favorites";

const getStoredFavorites = (): Favorites => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { teams: [], players: [], competitions: [] };
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorites>(getStoredFavorites);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback(
    (type: keyof Favorites, id: string) => {
      setFavorites((prev) => {
        const list = prev[type];
        const next = list.includes(id) ? list.filter((i) => i !== id) : [...list, id];
        return { ...prev, [type]: next };
      });
    },
    []
  );

  const isFavorite = useCallback(
    (type: keyof Favorites, id: string) => favorites[type].includes(id),
    [favorites]
  );

  const totalFavorites = favorites.teams.length + favorites.players.length + favorites.competitions.length;

  return { favorites, toggleFavorite, isFavorite, totalFavorites };
};
