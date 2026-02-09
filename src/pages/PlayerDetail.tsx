import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { mockPlayers } from "@/data/playersData";
import { ArrowLeft, Star, Target, TrendingUp, User, Shirt, Ruler, Weight, Calendar } from "lucide-react";
import PlayerAvatar from "@/components/PlayerAvatar";
import TeamLogo from "@/components/TeamLogo";
import CountryFlag from "@/components/CountryFlag";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

const PlayerDetail = () => {
  const { playerId } = useParams();
  const player = mockPlayers.find((p) => p.id === playerId);
  const { isFavorite, toggleFavorite } = useFavorites();

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

  return (
    <Layout>
      <div className="container py-4 sm:py-8">
        <Link to="/players" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to players
        </Link>

        {/* Player Header */}
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden mb-6">
          <div className="gradient-primary p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <PlayerAvatar name={player.name} size="xl" className="!bg-white/20" />
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

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
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
      </div>
    </Layout>
  );
};

export default PlayerDetail;
