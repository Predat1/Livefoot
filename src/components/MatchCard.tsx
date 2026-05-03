import { Link } from "react-router-dom";
import { Star, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import TeamLogo from "./TeamLogo";

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

interface MatchCardProps {
  match: Match;
}

const MotionLink = motion.create(Link);

const MatchCard = ({ match }: MatchCardProps) => {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  return (
    <MotionLink
      to={`/match/${match.id}`}
      className="group relative flex items-center justify-between px-4 sm:px-8 py-5 sm:py-7 transition-all duration-300 hover:bg-muted/30 border-b border-border/50 last:border-b-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.01, x: 4 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Live indicator bar */}
      {isLive && (
        <motion.div
          className="absolute left-0 top-0 h-full w-1 bg-live rounded-r-full"
          layoutId={`live-${match.id}`}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
      )}

      {/* Favorite button - hidden on mobile */}
      <motion.button
        onClick={(e) => e.preventDefault()}
        className="mr-2 sm:mr-3 text-muted-foreground/40 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:text-primary"
        whileHover={{ scale: 1.3, rotate: 15 }}
        whileTap={{ scale: 0.8 }}
      >
        <Star className="h-4 w-4" />
      </motion.button>

      {/* Home Team */}
      <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-3 min-w-0">
        <span
          className={cn(
            "text-sm sm:text-lg font-black tracking-tighter transition-colors truncate text-right",
            isFinished && match.homeTeam.score! > match.awayTeam.score!
              ? "text-foreground"
              : isFinished
                ? "text-muted-foreground"
                : "text-foreground"
          )}
        >
          {match.homeTeam.name}
        </span>
        <motion.div
          className="flex-shrink-0"
          whileHover={{ scale: 1.15, rotate: -5 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          {match.homeTeam.logo?.startsWith("http") ? (
            <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="h-6 w-6 sm:h-8 sm:w-8 object-contain" />
          ) : (
            <TeamLogo teamName={match.homeTeam.name} size="sm" />
          )}
        </motion.div>
      </div>

      {/* Score / Time */}
      <div className="mx-3 sm:mx-6 flex min-w-[80px] sm:min-w-[110px] flex-col items-center flex-shrink-0">
        {isLive || isFinished ? (
          <motion.div
            className="flex items-center gap-1.5 sm:gap-2.5"
            initial={false}
            whileHover={{ scale: 1.08 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <motion.span
              key={`home-${match.homeTeam.score}`}
              initial={{ scale: 1.4, color: "hsl(var(--primary))" }}
              animate={{ scale: 1, color: undefined }}
              transition={{ duration: 0.5 }}
              className={cn(
                "min-w-[32px] sm:min-w-[44px] rounded-xl px-2 sm:px-4 py-1.5 sm:py-2.5 text-center text-lg sm:text-2xl font-black shadow-inner",
                isLive
                  ? "bg-live text-primary-foreground shadow-live/30 text-glow"
                  : "bg-score-bg text-primary-foreground"
              )}
            >
              {match.homeTeam.score}
            </motion.span>
            <span className="text-base sm:text-xl font-bold text-muted-foreground">-</span>
            <motion.span
              key={`away-${match.awayTeam.score}`}
              initial={{ scale: 1.4, color: "hsl(var(--primary))" }}
              animate={{ scale: 1, color: undefined }}
              transition={{ duration: 0.5 }}
              className={cn(
                "min-w-[32px] sm:min-w-[44px] rounded-xl px-2 sm:px-4 py-1.5 sm:py-2.5 text-center text-lg sm:text-2xl font-black shadow-inner",
                isLive
                  ? "bg-live text-primary-foreground shadow-live/30 text-glow"
                  : "bg-score-bg text-primary-foreground"
              )}
            >
              {match.awayTeam.score}
            </motion.span>
          </motion.div>
        ) : (
          <motion.div
            className="rounded-md sm:rounded-lg bg-primary/10 px-3 sm:px-5 py-1.5 sm:py-2"
            whileHover={{ scale: 1.1, backgroundColor: "hsl(var(--primary) / 0.2)" }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <span className="text-sm sm:text-lg font-bold text-primary">
              {match.time}
            </span>
          </motion.div>
        )}
        {isLive && match.minute && (
          <div className="mt-1 sm:mt-1.5 flex items-center gap-1">
            <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-live live-pulse" />
            <span className="text-[10px] sm:text-xs font-bold text-live">
              {match.minute}'
            </span>
          </div>
        )}
        {isFinished && (
          <span className="mt-0.5 sm:mt-1 text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            FT
          </span>
        )}
      </div>

      {/* Away Team */}
      <div className="flex flex-1 items-center gap-1.5 sm:gap-3 min-w-0">
        <motion.div
          className="flex-shrink-0"
          whileHover={{ scale: 1.15, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          {match.awayTeam.logo?.startsWith("http") ? (
            <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="h-6 w-6 sm:h-8 sm:w-8 object-contain" />
          ) : (
            <TeamLogo teamName={match.awayTeam.name} size="sm" />
          )}
        </motion.div>
        <span
          className={cn(
            "text-sm sm:text-lg font-black tracking-tighter transition-colors truncate",
            isFinished && match.awayTeam.score! > match.homeTeam.score!
              ? "text-foreground"
              : isFinished
                ? "text-muted-foreground"
                : "text-foreground"
          )}
        >
          {match.awayTeam.name}
        </span>
      </div>

      {/* Arrow - hidden on mobile */}
      <motion.div
        className="ml-2 sm:ml-3 text-muted-foreground/40 hidden sm:block opacity-0 group-hover:opacity-100 group-hover:text-primary"
        initial={false}
        whileHover={{ x: 3 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <ChevronRight className="h-5 w-5" />
      </motion.div>
    </MotionLink>
  );
};

export default MatchCard;
