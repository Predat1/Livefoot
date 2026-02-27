import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CommunityPlayerRating {
  player_id: string;
  player_name: string;
  team_id: string;
  avg_rating: number;
  total_ratings: number;
  fixture_count: number;
}

export function useCommunityTopRated(period: "week" | "month" | "all" = "week") {
  return useQuery({
    queryKey: ["community-top-rated", period],
    queryFn: async () => {
      const since = period === "all"
        ? new Date("2020-01-01").toISOString()
        : period === "month"
          ? new Date(Date.now() - 30 * 86400000).toISOString()
          : new Date(Date.now() - 7 * 86400000).toISOString();

      const { data, error } = await supabase.rpc("top_rated_players", {
        since,
        lim: 50,
      });

      if (error) throw error;
      return (data || []) as CommunityPlayerRating[];
    },
    staleTime: 2 * 60 * 1000,
  });
}
