import { useState } from "react";
import Layout from "@/components/Layout";
import { mockCompetitions, standingsData } from "@/data/competitionsData";
import { Trophy, Users, Target, ChevronRight, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const Competitions = () => {
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);

  const handleCompetitionClick = (id: string) => {
    setSelectedCompetition(selectedCompetition === id ? null : id);
  };

  const getStandings = (id: string) => {
    return standingsData[id] || [];
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 rounded-full gradient-primary" />
            <h1 className="text-3xl font-black text-foreground">Competitions</h1>
          </div>
          <p className="text-muted-foreground ml-4">Explore leagues, cups, and tournaments from around the world</p>
        </div>

        {/* Competitions Grid */}
        <div className="space-y-4">
          {mockCompetitions.map((competition, index) => (
            <div
              key={competition.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                onClick={() => handleCompetitionClick(competition.id)}
                className={cn(
                  "group cursor-pointer rounded-2xl bg-card border border-border/50 p-5 transition-all duration-300 hover-lift",
                  selectedCompetition === competition.id && "ring-2 ring-primary"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted/80 text-3xl shadow-sm">
                      {competition.logo}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {competition.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{competition.country}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="hidden sm:flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span className="text-sm font-medium">{competition.teams}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Teams</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Trophy className="h-4 w-4" />
                          <span className="text-sm font-medium">MD {competition.currentMatchday}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Matchday</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-primary">
                          <Target className="h-4 w-4" />
                          <span className="text-sm font-bold">{competition.topScorerGoals}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{competition.topScorer}</span>
                      </div>
                    </div>
                    <ChevronRight 
                      className={cn(
                        "h-5 w-5 text-muted-foreground transition-transform duration-300",
                        selectedCompetition === competition.id && "rotate-90"
                      )} 
                    />
                  </div>
                </div>
              </div>

              {/* Standings Table */}
              {selectedCompetition === competition.id && getStandings(competition.id).length > 0 && (
                <div className="mt-2 rounded-2xl bg-card border border-border/50 overflow-hidden animate-fade-in">
                  <div className="bg-league-header px-5 py-3 border-b border-border">
                    <h4 className="font-bold text-foreground">Standings - Top 5</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border text-xs text-muted-foreground">
                          <th className="px-4 py-3 text-left font-medium">#</th>
                          <th className="px-4 py-3 text-left font-medium">Team</th>
                          <th className="px-4 py-3 text-center font-medium">P</th>
                          <th className="px-4 py-3 text-center font-medium">W</th>
                          <th className="px-4 py-3 text-center font-medium">D</th>
                          <th className="px-4 py-3 text-center font-medium">L</th>
                          <th className="px-4 py-3 text-center font-medium">GD</th>
                          <th className="px-4 py-3 text-center font-medium">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getStandings(competition.id).map((team, idx) => (
                          <tr 
                            key={team.team}
                            className={cn(
                              "border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30",
                              idx === 0 && "bg-primary/5"
                            )}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                  idx < 4 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}>
                                  {team.position}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-semibold text-foreground">{team.team}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{team.played}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{team.won}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{team.drawn}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{team.lost}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={cn(
                                "font-medium",
                                team.gd > 0 ? "text-primary" : team.gd < 0 ? "text-destructive" : "text-muted-foreground"
                              )}>
                                {team.gd > 0 ? "+" : ""}{team.gd}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-foreground">{team.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Competitions;
