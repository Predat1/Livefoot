import { ChevronDown, Star } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MatchCard from "./MatchCard";
import LeagueLogo from "./LeagueLogo";
import CountryFlag from "./CountryFlag";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";

interface Team {
  name: string;
  logo?: string;
  score?: number;
}

interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  time: string;
  status: "scheduled" | "live" | "finished";
  minute?: number;
}

interface League {
  id: string;
  name: string;
  country: string;
  countryFlag?: string;
  flag?: string;
  logo?: string;
  matches: Match[];
}

interface LeagueSectionProps {
  league: League;
  index?: number;
}

const LeagueSection = ({ league, index = 0 }: LeagueSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites();

  const hasLiveMatch = league.matches.some((m) => m.status === "live");
  const isLeagueFavorite = isFavorite("competitions", league.id);

  return (
    <motion.div
      className="mb-3 sm:mb-6 overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] bg-card/60 backdrop-blur-xl shadow-sm border border-border/50 group/section"
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      }}
      whileHover={{
        y: -4,
        boxShadow: "0 20px 40px -10px hsl(var(--primary) / 0.15)",
      }}
    >
      {/* League Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between bg-muted/30 px-4 sm:px-6 py-4 sm:py-5 transition-all hover:bg-muted/50 group cursor-pointer border-b border-border/50"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <motion.div
            className="flex items-center gap-1.5"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 + 0.15, duration: 0.3 }}
          >
            {league.flag ? (
              <img src={league.flag} alt={league.country} className="h-5 w-7 rounded-sm object-cover shadow-sm" />
            ) : (
              <CountryFlag country={league.country} size="md" />
            )}
            {league.logo ? (
              <img src={league.logo} alt={league.name} className="h-6 w-6 sm:h-8 sm:w-8 object-contain" />
            ) : (
              <LeagueLogo leagueId={league.id} leagueName={league.name} size="sm" />
            )}
          </motion.div>
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm sm:text-base font-bold uppercase tracking-wide text-foreground truncate max-w-[150px] sm:max-w-none">
              {league.name}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
              {league.matches.length} {league.matches.length > 1 ? "matchs" : "match"}
            </span>
          </div>
          {hasLiveMatch && (
            <motion.div
              className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-live/10 px-2 py-0.5 sm:py-1 flex-shrink-0"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15, delay: index * 0.08 + 0.2 }}
            >
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-live live-pulse" />
              <span className="text-[9px] sm:text-[10px] font-bold text-live uppercase">Live</span>
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <motion.button
            className="hover:text-primary transition-colors p-1"
            onClick={(e) => { e.stopPropagation(); toggleFavorite("competitions", league.id, league.name); }}
            whileHover={{ scale: 1.25, rotate: 15 }}
            whileTap={{ scale: 0.85 }}
          >
            <Star className={cn("h-4 w-4 transition-colors", isLeagueFavorite ? "fill-primary text-primary" : "text-muted-foreground/40")} />
          </motion.button>
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </motion.div>
        </div>
      </div>

      {/* Matches */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
            className="overflow-hidden"
          >
            {league.matches.map((match, matchIndex) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: matchIndex * 0.04,
                  duration: 0.25,
                  ease: "easeOut",
                }}
              >
                <MatchCard match={match} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LeagueSection;
