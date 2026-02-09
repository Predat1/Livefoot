import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { standingsData, mockCompetitions } from "@/data/competitionsData";
import { Trophy, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import TeamLogo from "@/components/TeamLogo";
import LeagueLogo from "@/components/LeagueLogo";
import CountryFlag from "@/components/CountryFlag";

const Standings = () => {
  const leaguesWithStandings = mockCompetitions.filter((c) => standingsData[c.id]);
  const [selectedLeague, setSelectedLeague] = useState(leaguesWithStandings[0]?.id || "premier-league");

  const standings = standingsData[selectedLeague] || [];

  const getTrendIcon = (trend: "up" | "down" | "same") => {
    switch (trend) {
      case "up": return <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />;
      case "down": return <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />;
      default: return <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />;
    }
  };

  const getFormBadge = (result: string) => {
    const colors: Record<string, string> = {
      W: "bg-primary text-primary-foreground",
      D: "bg-muted text-muted-foreground",
      L: "bg-destructive text-destructive-foreground",
    };
    return (
      <span className={cn("w-4 h-4 sm:w-5 sm:h-5 rounded text-[10px] sm:text-xs font-bold flex items-center justify-center", colors[result])}>
        {result}
      </span>
    );
  };

  return (
    <Layout>
      <div className="container py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
            <h1 className="text-xl sm:text-3xl font-black text-foreground">Standings</h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground ml-3 sm:ml-4">League tables and rankings</p>
        </div>

        {/* League Selector */}
        <div className="mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 min-w-max">
            {leaguesWithStandings.map((league) => (
              <button
                key={league.id}
                onClick={() => setSelectedLeague(league.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap",
                  selectedLeague === league.id
                    ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
                )}
              >
                <LeagueLogo leagueId={league.id} size="sm" className="!h-5 !w-5 sm:!h-6 sm:!w-6" />
                {league.name}
              </button>
            ))}
          </div>
        </div>

        {/* Standings Table */}
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
          <div className="bg-league-header px-4 sm:px-5 py-3 border-b border-border flex items-center gap-3">
            <LeagueLogo leagueId={selectedLeague} size="sm" />
            <div>
              <h3 className="font-bold text-foreground">{mockCompetitions.find((c) => c.id === selectedLeague)?.name}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{mockCompetitions.find((c) => c.id === selectedLeague)?.season}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border text-[10px] sm:text-xs text-muted-foreground">
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">#</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Team</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">P</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">W</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">D</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">L</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">GF</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">GA</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">GD</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">Pts</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium hidden sm:table-cell">Form</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium w-8"></th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, idx) => (
                  <tr key={team.team} className={cn("border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30", idx < 4 && "bg-primary/5")}>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <span className={cn("w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold", idx < 4 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        {team.position}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <Link to={`/teams/${team.team.toLowerCase().replace(/ /g, "-")}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                        <TeamLogo teamName={team.team} size="xs" className="!h-6 !w-6" />
                        <span className="font-semibold text-xs sm:text-sm text-foreground">{team.team}</span>
                      </Link>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.played}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.won}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.drawn}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.lost}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.gf}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-muted-foreground">{team.ga}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                      <span className={cn("text-xs sm:text-sm font-medium", team.gd > 0 ? "text-primary" : team.gd < 0 ? "text-destructive" : "text-muted-foreground")}>
                        {team.gd > 0 ? "+" : ""}{team.gd}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-xs sm:text-sm text-foreground">{team.points}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                        {team.form.map((result, i) => <span key={i}>{getFormBadge(result)}</span>)}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">{getTrendIcon(team.trend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Standings;
