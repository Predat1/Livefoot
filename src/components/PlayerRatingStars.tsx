import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

interface PlayerRatingProps {
  fixtureId: string;
  playerId: string;
  playerName: string;
  teamId: string;
}

const PlayerRatingStars = ({ fixtureId, playerId, playerName, teamId }: PlayerRatingProps) => {
  const { user } = useAuth();
  const [userRating, setUserRating] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRatings();
  }, [fixtureId, playerId]);

  const fetchRatings = async () => {
    // Aggregated stats via RPC (no individual user data exposed)
    const { data: stats } = await supabase.rpc("get_player_rating_stats", {
      _fixture_id: fixtureId,
      _player_id: playerId,
    });
    if (stats) {
      const s = stats as { avg: number; count: number };
      setAvgRating(Number(s.avg) || 0);
      setTotalVotes(Number(s.count) || 0);
    }

    // User's own rating
    if (user) {
      const { data: myRating } = await supabase
        .from("player_ratings")
        .select("rating")
        .eq("fixture_id", fixtureId)
        .eq("player_id", playerId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (myRating) setUserRating(myRating.rating);
    }
  };

  const handleRate = async (rating: number) => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("player_ratings")
        .upsert(
          {
            user_id: user.id,
            fixture_id: fixtureId,
            player_id: playerId,
            player_name: playerName,
            team_id: teamId,
            rating,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,fixture_id,player_id" }
        );

      if (!error) {
        setUserRating(rating);
        fetchRatings();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredStar || userRating || 0;

  return (
    <div className="flex items-center gap-1.5">
      {/* Stars */}
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHoveredStar(0)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = displayRating >= star * 2;
          const halfFilled = !filled && displayRating >= star * 2 - 1;
          return (
            <motion.button
              key={star}
              whileTap={{ scale: 1.3 }}
              onClick={() => handleRate(star * 2)}
              onMouseEnter={() => setHoveredStar(star * 2)}
              disabled={!user}
              className={cn(
                "p-0 transition-colors",
                user ? "cursor-pointer hover:scale-110" : "cursor-default opacity-60"
              )}
              title={user ? `Noter ${star * 2}/10` : "Connectez-vous pour noter"}
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5 transition-colors",
                  filled
                    ? "fill-amber-400 text-amber-400"
                    : halfFilled
                    ? "fill-amber-400/50 text-amber-400"
                    : "text-muted-foreground/40"
                )}
              />
            </motion.button>
          );
        })}
      </div>
      {/* Avg rating */}
      {avgRating !== null && (
        <span className="text-[10px] text-muted-foreground ml-0.5">
          {avgRating.toFixed(1)} <span className="opacity-60">({totalVotes})</span>
        </span>
      )}
    </div>
  );
};

export default PlayerRatingStars;
