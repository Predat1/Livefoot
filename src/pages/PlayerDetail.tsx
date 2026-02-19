import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { mockPlayers } from "@/data/playersData";
import { ArrowLeft, Star, Target, TrendingUp, User, Shirt, Ruler, Weight, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import PlayerAvatar from "@/components/PlayerAvatar";
import TeamLogo from "@/components/TeamLogo";
import CountryFlag from "@/components/CountryFlag";
import ShareButton from "@/components/ShareButton";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { useState } from "react";

// Generate deterministic season history per player
const generateSeasonHistory = (player: ReturnType<typeof mockPlayers.find> & object) => {
  if (!player) return [];
  const seed = player.id.length + player.name.length;
  const seasons = [
    { season: "2024/25", team: player.team, apps: player.appearances, goals: player.goals, assists: player.assists, rating: player.rating, mins: player.minutesPlayed },
    { season: "2023/24", team: player.team, apps: Math.max(20, 34 - (seed % 8)), goals: Math.max(0, player.goals - 3 + (seed % 6)), assists: Math.max(0, player.assists - 2 + (seed % 4)), rating: Math.round((player.rating - 0.3 + (seed % 3) * 0.1) * 10) / 10, mins: Math.max(1000, player.minutesPlayed - 200 + (seed % 300)) },
    { season: "2022/23", team: (seed % 3 === 0 && player.teamId !== "real-madrid") ? "Previous Club" : player.team, apps: Math.max(15, 30 - (seed % 10)), goals: Math.max(0, player.goals - 5 + (seed % 8)), assists: Math.max(0, player.assists - 1 + (seed % 5)), rating: Math.round((player.rating - 0.6 + (seed % 4) * 0.1) * 10) / 10, mins: Math.max(900, player.minutesPlayed - 400 + (seed % 400)) },
    { season: "2021/22", team: (seed % 2 === 0 && player.teamId !== "arsenal") ? "Previous Club" : player.team, apps: Math.max(10, 28 - (seed % 12)), goals: Math.max(0, player.goals - 8 + (seed % 10)), assists: Math.max(0, player.assists - 3 + (seed % 6)), rating: Math.round((player.rating - 0.9 + (seed % 5) * 0.1) * 10) / 10, mins: Math.max(700, player.minutesPlayed - 600 + (seed % 500)) },
    { season: "2020/21", team: (seed % 4 === 0) ? "Youth / Loan" : player.team, apps: Math.max(5, 22 - (seed % 14)), goals: Math.max(0, player.goals - 11 + (seed % 12)), assists: Math.max(0, player.assists - 4 + (seed % 7)), rating: Math.round((player.rating - 1.2 + (seed % 6) * 0.1) * 10) / 10, mins: Math.max(400, player.minutesPlayed - 800 + (seed % 600)) },
  ];
  return seasons;
};

const PlayerDetail = () => {
  const { playerId } = useParams();
  const player = mockPlayers.find((p) => p.id === playerId);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showAllSeasons, setShowAllSeasons] = useState(false);

  if (!player) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Player not found</h1>
          <Link to="/players" className="text-primary hover:underline">Back to players</Link>
        </div>
      </Layout>
    );
  }

  const radarData = [
    { skill: "Shooting", value: Math.min(player.shotsPerGame * 20, 95) },
    { skill: "Passing", value: player.passAccuracy },
    { skill: "Dribbling", value: Math.min(player.duelsWon + 15, 95) },
    { skill: "Physical", value: Math.min(parseInt(player.weight) / 1.1, 95) },
    { skill: "Pace", value: player.position === "Forward" ? 88 : player.position === "Midfielder" ? 78 : 70 },
    { skill: "Defense", value: player.position === "Defender" ? 85 : player.position === "Goalkeeper" ? 90 : 45 },
  ];

  const seasonHistory = generateSeasonHistory(player);
  const visibleSeasons = showAllSeasons ? seasonHistory : seasonHistory.slice(0, 3);

  return (
    <Layout>
      <SEOHead
        title={`${player.name} - Stats & Profile`}
        description={`${player.name} - ${player.position} for ${player.team}. ${player.goals} goals, ${player.assists} assists in ${player.appearances} appearances. Rating: ${player.rating}.`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: player.name,
          nationality: player.nationality,
          jobTitle: `Professional Football Player - ${player.position}`,
          memberOf: { "@type": "SportsTeam", name: player.team },
        }}
      />
      <div className="container py-4 sm:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link to="/players" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to players
          </Link>
          <ShareButton
            title={`${player.name} - ${player.position} | LiveFoot`}
            text={`${player.name} (${player.team}) - ${player.goals} buts, ${player.assists} passes déc. | LiveFoot`}
          />
        </div>

        {/* Player Header */}
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden mb-6">
          <div className="gradient-primary p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <PlayerAvatar name={player.name} photoUrl={player.photoUrl} size="xl" className="!bg-white/20" />
              <div className="text-center sm:text-left flex-1 text-primary-foreground">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <CountryFlag country={player.country} size="md" />
                  <span className="text-sm opacity-80">{player.nationality}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">{player.name}</h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <TeamLogo teamName={player.team} size="xs" className="!bg-white/20 !rounded" />
                  <span className="opacity-90">{player.team}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center text-primary-foreground">
                  <div className="text-4xl font-black">{player.rating}</div>
                  <div className="text-xs opacity-80">Rating</div>
                </div>
                <button onClick={() => toggleFavorite("players", player.id)} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                  <Star className={cn("h-5 w-5", isFavorite("players", player.id) ? "fill-yellow-400 text-yellow-400" : "text-white")} />
                </button>
              </div>
            </div>
          </div>

          {/* Info Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-border">
            <div className="p-3 sm:p-4 text-center">
              <Shirt className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-black text-foreground">#{player.jersey}</p>
              <p className="text-[10px] text-muted-foreground">{player.position}</p>
            </div>
            <div className="p-3 sm:p-4 text-center">
              <Calendar className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-black text-foreground">{player.age}</p>
              <p className="text-[10px] text-muted-foreground">Age</p>
            </div>
            <div className="p-3 sm:p-4 text-center">
              <Ruler className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-black text-foreground">{player.height}</p>
              <p className="text-[10px] text-muted-foreground">Height</p>
            </div>
            <div className="p-3 sm:p-4 text-center">
              <Weight className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-black text-foreground">{player.weight}</p>
              <p className="text-[10px] text-muted-foreground">Weight</p>
            </div>
            <div className="p-3 sm:p-4 text-center col-span-2 sm:col-span-1">
              <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-black text-primary">{player.marketValue}</p>
              <p className="text-[10px] text-muted-foreground">Market Value</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Season Stats */}
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-foreground">Season Statistics</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <div className="text-3xl font-black text-primary">{player.goals}</div>
                  <div className="text-xs text-muted-foreground">Goals</div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <div className="text-3xl font-black text-foreground">{player.assists}</div>
                  <div className="text-xs text-muted-foreground">Assists</div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <div className="text-2xl font-black text-foreground">{player.appearances}</div>
                  <div className="text-xs text-muted-foreground">Appearances</div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <div className="text-2xl font-black text-foreground">{player.minutesPlayed}'</div>
                  <div className="text-xs text-muted-foreground">Minutes</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <div className="text-xl font-black text-foreground">{player.shotsPerGame}</div>
                  <div className="text-xs text-muted-foreground">Shots/Game</div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <div className="text-xl font-black text-foreground">{player.passAccuracy}%</div>
                  <div className="text-xs text-muted-foreground">Pass Accuracy</div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <div className="text-xl font-black text-foreground">{player.duelsWon}%</div>
                  <div className="text-xs text-muted-foreground">Duels Won</div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 rounded bg-yellow-500"></span>
                    <span className="font-bold">{player.yellowCards}</span>
                    <span className="w-3 h-3 rounded bg-destructive"></span>
                    <span className="font-bold">{player.redCards}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Cards</div>
                </div>
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-foreground">Skills Radar</h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Skills" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Season History Table */}
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
          <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-foreground">Historique de saisons</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Saison</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground">Club</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground">Matchs</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground">Buts</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground">Passes déc.</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground">Mins</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground">Note</th>
                </tr>
              </thead>
              <tbody>
                {visibleSeasons.map((season, i) => (
                  <tr
                    key={season.season}
                    className={cn(
                      "border-b border-border/50 transition-colors hover:bg-muted/30",
                      i === 0 && "bg-primary/5"
                    )}
                  >
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-bold", i === 0 ? "text-primary" : "text-foreground")}>
                        {season.season}
                        {i === 0 && (
                          <span className="ml-2 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-black text-primary">EN COURS</span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        {i === 0 && <TeamLogo teamName={season.team} size="xs" />}
                        <span className="text-xs text-foreground truncate max-w-[100px]">{season.team}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-bold text-foreground">{season.apps}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn("text-sm font-black", season.goals > 0 ? "text-primary" : "text-muted-foreground")}>
                        {season.goals}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-bold text-foreground">{season.assists}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs text-muted-foreground">{season.mins.toLocaleString()}'</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-xs font-black min-w-[36px]",
                        season.rating >= 8 ? "bg-primary/15 text-primary" :
                        season.rating >= 7 ? "bg-muted text-foreground" :
                        "bg-muted/50 text-muted-foreground"
                      )}>
                        {season.rating.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {seasonHistory.length > 3 && (
            <button
              onClick={() => setShowAllSeasons((s) => !s)}
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t border-border"
            >
              {showAllSeasons ? (
                <><ChevronUp className="h-3.5 w-3.5" /> Voir moins</>
              ) : (
                <><ChevronDown className="h-3.5 w-3.5" /> Voir toutes les saisons ({seasonHistory.length})</>
              )}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PlayerDetail;
