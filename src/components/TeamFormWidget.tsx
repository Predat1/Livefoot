import { Link } from "react-router-dom";
import { useTeamForm, useTeamNextFixtures } from "@/hooks/useApiFootball";
import { cn } from "@/lib/utils";
import { buildEntitySlug } from "@/utils/slugify";
import { Calendar, TrendingUp, Loader2 } from "lucide-react";

interface TeamFormWidgetProps {
  teamId: string;
  teamName: string;
  teamLogo?: string;
}

const FormBadge = ({ result }: { result: string }) => {
  const colors = {
    W: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    D: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
    L: "bg-destructive/20 text-destructive",
  };
  const labels = { W: "V", D: "N", L: "D" };
  return (
    <span className={cn("w-7 h-7 rounded-md flex items-center justify-center text-xs font-black", colors[result as keyof typeof colors] || "bg-muted text-muted-foreground")}>
      {labels[result as keyof typeof labels] || result}
    </span>
  );
};

const TeamFormWidget = ({ teamId, teamName, teamLogo }: TeamFormWidgetProps) => {
  const { data: form, isLoading: formLoading } = useTeamForm(teamId);
  const { data: nextMatches, isLoading: nextLoading } = useTeamNextFixtures(teamId);

  const isLoading = formLoading || nextLoading;

  if (isLoading) {
    return (
      <div className="rounded-xl bg-card border border-border/50 p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded bg-muted" />
          <div className="h-4 w-24 rounded bg-muted" />
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="w-7 h-7 rounded-md bg-muted" />)}
        </div>
      </div>
    );
  }

  const winStreak = form ? (() => {
    let streak = 0;
    for (const f of form) {
      if (f.result === "W") streak++;
      else break;
    }
    return streak;
  })() : 0;

  const unbeatenStreak = form ? (() => {
    let streak = 0;
    for (const f of form) {
      if (f.result !== "L") streak++;
      else break;
    }
    return streak;
  })() : 0;

  const nextMatch = nextMatches?.[0];

  return (
    <div className="rounded-xl bg-card border border-border/50 p-3 sm:p-4 hover-lift transition-all">
      {/* Team header */}
      <Link to={`/teams/${buildEntitySlug(teamId, teamName)}`} className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity">
        {teamLogo && <img src={teamLogo} alt={teamName} className="h-6 w-6 object-contain" />}
        <span className="text-sm font-bold text-foreground truncate">{teamName}</span>
      </Link>

      {/* Recent form */}
      {form && form.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Forme récente</p>
          <div className="flex items-center gap-1.5">
            {form.map((f, i) => (
              <div key={f.id} className="group relative">
                <FormBadge result={f.result} />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                  <div className="bg-popover border border-border rounded-lg px-2 py-1 shadow-lg whitespace-nowrap">
                    <p className="text-[10px] font-medium text-foreground">{f.opponent}</p>
                    <p className="text-[10px] text-muted-foreground">{f.goalsFor}-{f.goalsAgainst} · {f.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-3 mb-3">
        {winStreak > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-3 w-3" />
            <span className="font-semibold">{winStreak} victoire{winStreak > 1 ? "s" : ""} d'affilée</span>
          </div>
        )}
        {winStreak === 0 && unbeatenStreak > 1 && (
          <div className="flex items-center gap-1 text-[10px] text-primary">
            <TrendingUp className="h-3 w-3" />
            <span className="font-semibold">{unbeatenStreak} matchs invaincu</span>
          </div>
        )}
      </div>

      {/* Next match */}
      {nextMatch && (
        <div className="border-t border-border/50 pt-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Prochain match
          </p>
          <div className="flex items-center gap-2 text-xs">
            <img src={nextMatch.homeTeam.logo} alt="" className="h-4 w-4 object-contain" />
            <span className="text-foreground font-medium truncate">{nextMatch.homeTeam.name}</span>
            <span className="text-muted-foreground">vs</span>
            <span className="text-foreground font-medium truncate">{nextMatch.awayTeam.name}</span>
            <img src={nextMatch.awayTeam.logo} alt="" className="h-4 w-4 object-contain" />
            <span className="text-muted-foreground ml-auto text-[10px]">{nextMatch.date} {nextMatch.time}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamFormWidget;
