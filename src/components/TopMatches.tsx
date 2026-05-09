import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildEntitySlug } from "@/utils/slugify";
import type { LeagueData, MatchData } from "@/hooks/useApiFootball";

// IDs of top competitions to consider for "top matches"
const TOP_LEAGUE_IDS = new Set([
  "2", "3", "39", "140", "135", "78", "61", "848", "4", "5", "88", "94", "253",
]);

interface TopMatchesProps {
  leagues: LeagueData[];
}

const TopMatches = ({ leagues }: TopMatchesProps) => {
  // Collect top matches: live first, then scheduled from top leagues
  const topMatches: (MatchData & { leagueName: string; leagueLogo?: string; leagueFlag?: string })[] = [];

  for (const league of leagues) {
    if (!TOP_LEAGUE_IDS.has(league.id)) continue;
    for (const match of league.matches) {
      topMatches.push({ ...match, leagueName: league.name, leagueLogo: league.logo, leagueFlag: league.flag });
    }
  }

  // Sort: live > scheduled > finished, max 6
  const sorted = topMatches
    .sort((a, b) => {
      const order = { live: 0, scheduled: 1, finished: 2 };
      return (order[a.status] ?? 1) - (order[b.status] ?? 1);
    })
    .slice(0, 6);

  if (sorted.length === 0) return null;

  return (
    <section className="mb-6 sm:mb-8">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
        <Flame className="h-4 w-4 text-destructive" />
        <h2 className="text-sm sm:text-base font-bold text-foreground">Top Matchs</h2>
        <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          {sorted.length}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:pb-0">
        {sorted.map((match, i) => {
          const isLive = match.status === "live";
          const isFinished = match.status === "finished";
          const homeScore = match.homeTeam.score ?? 0;
          const awayScore = match.awayTeam.score ?? 0;

          return (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
            >
              <Link
                to={`/match/${buildEntitySlug(match.id, `${match.homeTeam.name}-vs-${match.awayTeam.name}`)}`}
                className={cn(
                  "group relative flex flex-col gap-2 rounded-xl border p-3 sm:p-4 transition-all hover:shadow-md hover:-translate-y-0.5 min-w-[260px] shrink-0 sm:min-w-0 sm:shrink",
                  isLive
                    ? "bg-live/5 border-live/30 hover:border-live/60"
                    : "bg-card border-border/50 hover:border-primary/30"
                )}
              >
                {/* Live pulse bar */}
                {isLive && (
                  <div className="absolute top-0 left-0 h-full w-1 rounded-l-xl bg-live" />
                )}

                {/* League */}
                <div className="flex items-center gap-1.5 pl-1">
                  {match.leagueFlag && (
                    <img src={match.leagueFlag} alt="" className="h-3.5 w-5 rounded-[2px] object-cover" />
                  )}
                  {match.leagueLogo && (
                    <img src={match.leagueLogo} alt="" className="h-4 w-4 object-contain" />
                  )}
                  <span className="text-[10px] font-semibold text-muted-foreground truncate">
                    {match.leagueName}
                  </span>
                  {isLive && (
                    <span className="ml-auto flex items-center gap-1 rounded-full bg-live/15 px-1.5 py-0.5 text-[9px] font-black text-live">
                      <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse" />
                      {match.minute}'
                    </span>
                  )}
                </div>

                {/* Teams + Score */}
                <div className="flex items-center justify-between gap-2 px-1">
                  {/* Home */}
                  <div className="flex flex-1 flex-col items-center gap-1 min-w-0">
                    {match.homeTeam.logo?.startsWith("http") ? (
                      <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="h-8 w-8 object-contain" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground">
                        {match.homeTeam.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className={cn(
                      "text-[11px] font-semibold text-center leading-tight truncate w-full text-center",
                      isFinished && homeScore > awayScore ? "text-foreground font-black" : "text-muted-foreground"
                    )}>
                      {match.homeTeam.name}
                    </span>
                  </div>

                  {/* Score / Time */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    {isLive || isFinished ? (
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "min-w-[28px] rounded-lg px-2 py-1 text-center text-base font-black shadow-sm",
                          isLive ? "bg-live text-white" : "bg-score-bg text-primary-foreground"
                        )}>
                          {homeScore}
                        </span>
                        <span className="text-muted-foreground text-sm">-</span>
                        <span className={cn(
                          "min-w-[28px] rounded-lg px-2 py-1 text-center text-base font-black shadow-sm",
                          isLive ? "bg-live text-white" : "bg-score-bg text-primary-foreground"
                        )}>
                          {awayScore}
                        </span>
                      </div>
                    ) : (
                      <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
                        {match.time}
                      </span>
                    )}
                    {isFinished && (
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">FT</span>
                    )}
                  </div>

                  {/* Away */}
                  <div className="flex flex-1 flex-col items-center gap-1 min-w-0">
                    {match.awayTeam.logo?.startsWith("http") ? (
                      <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="h-8 w-8 object-contain" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground">
                        {match.awayTeam.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className={cn(
                      "text-[11px] font-semibold text-center leading-tight truncate w-full text-center",
                      isFinished && awayScore > homeScore ? "text-foreground font-black" : "text-muted-foreground"
                    )}>
                      {match.awayTeam.name}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default TopMatches;
