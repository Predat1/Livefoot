import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { mockPlayers } from "@/data/playersData";
import { ArrowLeft, Star, Target, TrendingUp, User, Shirt, Ruler, Weight, Calendar, ChevronDown, ChevronUp, Timer, Footprints, Crosshair, Shield, Zap, GitCompare, Search, Trophy, Activity, X } from "lucide-react";
import PlayerAvatar from "@/components/PlayerAvatar";
import TeamLogo from "@/components/TeamLogo";
import CountryFlag from "@/components/CountryFlag";
import ShareButton from "@/components/ShareButton";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const COMPARE_STATS = [
  { label: "⚽ Buts", key: "goals" as const, unit: "" },
  { label: "🅰️ Passes déc.", key: "assists" as const, unit: "" },
  { label: "🎮 Matchs", key: "appearances" as const, unit: "" },
  { label: "⭐ Note", key: "rating" as const, unit: "" },
  { label: "🎯 Tirs/match", key: "shotsPerGame" as const, unit: "" },
  { label: "🎯 Précision passe", key: "passAccuracy" as const, unit: "%" },
  { label: "💪 Duels gagnés", key: "duelsWon" as const, unit: "" },
  { label: "🟨 Cartons J.", key: "yellowCards" as const, unit: "", lowerIsBetter: true },
  { label: "🔴 Cartons R.", key: "redCards" as const, unit: "", lowerIsBetter: true },
  { label: "🗓️ Âge", key: "age" as const, unit: "", lowerIsBetter: true },
];

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

// Generate detailed stats deterministically
const generateDetailedStats = (player: NonNullable<ReturnType<typeof mockPlayers.find>>) => {
  const seed = player.name.length + player.age;
  const per90 = (val: number) => Math.round((val / (player.minutesPlayed / 90)) * 100) / 100;
  const goalsP90 = per90(player.goals);
  const assistsP90 = per90(player.assists);
  const isGK = player.position === "Goalkeeper";
  const isDef = player.position === "Defender";
  const isMid = player.position === "Midfielder";

  return {
    // Attacking
    goalsP90,
    assistsP90,
    goalContributions: player.goals + player.assists,
    keyPasses: Math.max(1, Math.round(player.assists * 2.3 + (seed % 8))),
    keyPassesP90: Math.round(Math.max(0.5, (player.assists * 2.3 + (seed % 8)) / (player.minutesPlayed / 90)) * 100) / 100,
    chancesCreated: Math.max(2, Math.round(player.assists * 3.1 + (seed % 12))),
    conversionRate: player.goals > 0 ? Math.round((player.goals / (player.shotsPerGame * player.appearances)) * 100) : 0,
    bigChancesMissed: Math.max(0, Math.round(player.goals * 0.3 + (seed % 4))),
    penaltyGoals: Math.max(0, Math.round((seed % 3) === 0 ? player.goals * 0.15 : 0)),

    // Defensive
    tackles: isDef ? Math.round(2.5 * player.appearances + (seed % 15)) : isMid ? Math.round(1.5 * player.appearances + (seed % 10)) : Math.round(0.5 * player.appearances + (seed % 5)),
    tacklesP90: 0,
    interceptions: isDef ? Math.round(1.8 * player.appearances + (seed % 12)) : isMid ? Math.round(1.0 * player.appearances + (seed % 8)) : Math.round(0.3 * player.appearances + (seed % 3)),
    clearances: isDef ? Math.round(3.5 * player.appearances + (seed % 20)) : Math.round(0.5 * player.appearances + (seed % 5)),
    blockedShots: isDef ? Math.round(1.2 * player.appearances + (seed % 8)) : Math.round(0.3 * player.appearances + (seed % 3)),
    aerialWon: Math.round(player.duelsWon * 0.4 + (seed % 10)),

    // Passing
    totalPasses: Math.round((player.minutesPlayed / 90) * (40 + (seed % 30))),
    passesP90: 0,
    longBalls: Math.round((player.minutesPlayed / 90) * (2 + (seed % 5))),
    crossesP90: isMid || !isDef ? Math.round((1.5 + (seed % 3)) * 10) / 10 : Math.round((0.5 + (seed % 2)) * 10) / 10,
    throughBalls: Math.round(player.assists * 0.8 + (seed % 6)),

    // GK specific
    cleanSheets: isGK ? (player as any).cleanSheets || Math.round(player.appearances * 0.35 + (seed % 5)) : undefined,
    savePercentage: isGK ? (player as any).savePercentage || (70 + (seed % 15)) : undefined,
    saves: isGK ? Math.round(player.appearances * 3.2 + (seed % 15)) : undefined,
    goalsConceded: isGK ? Math.round(player.appearances * 0.9 + (seed % 8)) : undefined,

    // Physical
    distanceCovered: Math.round((player.minutesPlayed / 90) * (10.2 + (seed % 3) * 0.3) * 10) / 10,
    sprints: Math.round((player.minutesPlayed / 90) * (15 + (seed % 12))),
    foulsDrawn: Math.round(player.appearances * (1.2 + (seed % 5) * 0.2)),
    foulsCommitted: Math.round(player.appearances * (0.8 + (seed % 4) * 0.15)),
    offsides: player.position === "Forward" ? Math.round(player.appearances * (0.8 + (seed % 3) * 0.2)) : Math.round(player.appearances * 0.1),
  };
};

const StatCard = ({ label, value, icon: Icon, highlight = false }: { label: string; value: string | number; icon?: any; highlight?: boolean }) => (
  <div className="p-3 sm:p-4 rounded-xl bg-muted/30 text-center">
    {Icon && <Icon className={cn("h-4 w-4 mx-auto mb-1", highlight ? "text-primary" : "text-muted-foreground")} />}
    <div className={cn("text-xl sm:text-2xl font-black", highlight ? "text-primary" : "text-foreground")}>{value}</div>
    <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{label}</div>
  </div>
);

const PlayerDetail = () => {
  const { playerId } = useParams();
  const player = mockPlayers.find((p) => p.id === playerId);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showAllSeasons, setShowAllSeasons] = useState(false);
  const [comparePlayerId, setComparePlayerId] = useState<string | null>(null);
  const [compareSearch, setCompareSearch] = useState("");
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);

  const comparePlayer = comparePlayerId ? mockPlayers.find((p) => p.id === comparePlayerId) : null;
  const compareDetailedStats = comparePlayer ? generateDetailedStats(comparePlayer) : null;

  const otherPlayers = mockPlayers.filter((p) => p.id !== player.id);
  const filteredOtherPlayers = otherPlayers.filter((p) =>
    p.name.toLowerCase().includes(compareSearch.toLowerCase()) ||
    p.team.toLowerCase().includes(compareSearch.toLowerCase())
  );

  const comparePair = comparePlayer ? [player, comparePlayer] : null;
  const winCounts = comparePair
    ? COMPARE_STATS.reduce<[number, number]>((acc, { key, lowerIsBetter }) => {
        const a = Number(comparePair[0][key]);
        const b = Number(comparePair[1][key]);
        if (a === b) return acc;
        const aWins = lowerIsBetter ? a < b : a > b;
        return aWins ? [acc[0] + 1, acc[1]] : [acc[0], acc[1] + 1];
      }, [0, 0])
    : [0, 0];

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
  const detailedStats = generateDetailedStats(player);
  const isGK = player.position === "Goalkeeper";

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
          <div className="flex items-center gap-2">
            <Dialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen}>
              <DialogTrigger asChild>
                <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  <GitCompare className="h-3.5 w-3.5" />
                  Comparer
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Choisir un joueur à comparer</DialogTitle>
                </DialogHeader>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un joueur..."
                    value={compareSearch}
                    onChange={(e) => setCompareSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1">
                  {filteredOtherPlayers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setComparePlayerId(p.id);
                        setCompareDialogOpen(false);
                        setCompareSearch("");
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors",
                        comparePlayerId === p.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
                      )}
                    >
                      <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
                        <div className="flex items-center gap-1.5">
                          <TeamLogo teamName={p.team} size="xs" className="!h-3.5 !w-3.5" />
                          <span className="text-xs text-muted-foreground truncate">{p.team}</span>
                          <span className="text-xs text-muted-foreground">· {p.position}</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-primary">{p.rating}</span>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            <ShareButton
              title={`${player.name} - ${player.position} | LiveFoot`}
              text={`${player.name} (${player.team}) - ${player.goals} buts, ${player.assists} passes déc. | LiveFoot`}
            />
          </div>
        </div>

        {/* ===== COMPARISON PANEL ===== */}
        {comparePlayer && comparePair && (
          <div className="rounded-2xl bg-card border border-primary/20 overflow-hidden mb-6 shadow-lg shadow-primary/5 animate-fade-in">
            <div className="bg-primary/10 px-5 py-3 border-b border-primary/20 flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-foreground">Comparaison</h3>
              <button
                onClick={() => setComparePlayerId(null)}
                className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {/* Player headers */}
              <div className="grid grid-cols-[1fr_2fr_2fr] gap-3 sm:gap-6 mb-4">
                <div />
                {comparePair.map((p, idx) => (
                  <div key={p.id} className="text-center">
                    <div className="relative inline-block mb-2">
                      <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size="md" className="mx-auto" />
                      {winCounts[idx] > winCounts[1 - idx] && (
                        <span className="absolute -top-2 -right-2 text-lg">👑</span>
                      )}
                    </div>
                    <p className="font-black text-sm text-foreground truncate">{p.name}</p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <TeamLogo teamName={p.team} size="xs" className="!h-3.5 !w-3.5" />
                      <p className="text-xs text-muted-foreground truncate">{p.team}</p>
                    </div>
                    <div className="mt-1 flex items-center justify-center gap-1">
                      <CountryFlag country={p.country} size="sm" />
                      <span className="text-xs text-muted-foreground">{p.position}</span>
                    </div>
                    <div className={cn(
                      "mt-2 mx-auto w-fit px-3 py-1 rounded-full text-xs font-bold",
                      winCounts[idx] > winCounts[1 - idx] ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {winCounts[idx]} / {COMPARE_STATS.length} stats
                    </div>
                    <div className="mt-1 font-bold text-sm text-primary">{p.marketValue}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  Statistiques
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-1">
                {COMPARE_STATS.map(({ label, key, unit, lowerIsBetter }) => {
                  const a = Number(comparePair[0][key]);
                  const b = Number(comparePair[1][key]);
                  const aWins = lowerIsBetter ? a < b : a > b;
                  const bWins = lowerIsBetter ? b < a : b > a;
                  const maxVal = Math.max(a, b) || 1;

                  return (
                    <div key={key} className="grid grid-cols-[1fr_2fr_2fr] gap-3 sm:gap-6 py-2 border-t border-border/40 items-center">
                      <span className="text-[11px] sm:text-xs text-muted-foreground text-right pr-2">{label}</span>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className={cn("text-sm font-black", aWins ? "text-primary" : "text-foreground")}>{a}{unit}</span>
                          {aWins && <Trophy className="h-3 w-3 text-primary opacity-70" />}
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all", aWins ? "bg-primary" : "bg-muted-foreground/30")} style={{ width: `${lowerIsBetter ? (1 - a / maxVal) * 100 : (a / maxVal) * 100}%` }} />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          {bWins && <Trophy className="h-3 w-3 text-primary opacity-70" />}
                          <span className={cn("text-sm font-black ml-auto", bWins ? "text-primary" : "text-foreground")}>{b}{unit}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all", bWins ? "bg-primary" : "bg-muted-foreground/30")} style={{ width: `${lowerIsBetter ? (1 - b / maxVal) * 100 : (b / maxVal) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

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

        {/* Detailed Stats Tabs */}
        <Tabs defaultValue="overview" className="w-full mb-6">
          <TabsList className="w-full grid grid-cols-4 bg-card border border-border/50 rounded-xl p-1 mb-4">
            <TabsTrigger value="overview" className="rounded-lg text-[10px] sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="attacking" className="rounded-lg text-[10px] sm:text-sm">{isGK ? "GK Stats" : "Attack"}</TabsTrigger>
            <TabsTrigger value="defensive" className="rounded-lg text-[10px] sm:text-sm">Defense</TabsTrigger>
            <TabsTrigger value="passing" className="rounded-lg text-[10px] sm:text-sm">Passing</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Season Stats */}
              <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground">Season Statistics</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard label="Goals" value={player.goals} icon={Target} highlight />
                    <StatCard label="Assists" value={player.assists} icon={Footprints} />
                    <StatCard label="Appearances" value={player.appearances} icon={Shirt} />
                    <StatCard label="Minutes" value={`${player.minutesPlayed}'`} icon={Timer} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <StatCard label="Goals/90" value={detailedStats.goalsP90} highlight />
                    <StatCard label="Assists/90" value={detailedStats.assistsP90} />
                    <StatCard label="Goal Contributions" value={detailedStats.goalContributions} highlight />
                    <div className="p-3 sm:p-4 rounded-xl bg-muted/30 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-3.5 h-4 rounded bg-yellow-500"></span>
                        <span className="font-black text-xl text-foreground">{player.yellowCards}</span>
                        <span className="w-3.5 h-4 rounded bg-destructive"></span>
                        <span className="font-black text-xl text-foreground">{player.redCards}</span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">Cards</div>
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
          </TabsContent>

          {/* Attacking / GK Tab */}
          <TabsContent value="attacking" className="mt-0">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">{isGK ? "Goalkeeper Statistics" : "Attacking Statistics"}</h3>
              </div>
              <div className="p-4">
                {isGK ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Clean Sheets" value={detailedStats.cleanSheets ?? 0} highlight />
                    <StatCard label="Save %" value={`${detailedStats.savePercentage ?? 0}%`} highlight />
                    <StatCard label="Total Saves" value={detailedStats.saves ?? 0} />
                    <StatCard label="Goals Conceded" value={detailedStats.goalsConceded ?? 0} />
                    <StatCard label="Appearances" value={player.appearances} />
                    <StatCard label="Minutes" value={`${player.minutesPlayed}'`} />
                    <StatCard label="Pass Accuracy" value={`${player.passAccuracy}%`} />
                    <StatCard label="Duels Won" value={`${player.duelsWon}%`} />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Goals" value={player.goals} highlight />
                    <StatCard label="Goals/90" value={detailedStats.goalsP90} highlight />
                    <StatCard label="Assists" value={player.assists} />
                    <StatCard label="Assists/90" value={detailedStats.assistsP90} />
                    <StatCard label="Shots/Game" value={player.shotsPerGame} />
                    <StatCard label="Conversion Rate" value={`${detailedStats.conversionRate}%`} highlight />
                    <StatCard label="Key Passes" value={detailedStats.keyPasses} />
                    <StatCard label="Key Passes/90" value={detailedStats.keyPassesP90} />
                    <StatCard label="Chances Created" value={detailedStats.chancesCreated} />
                    <StatCard label="Big Chances Missed" value={detailedStats.bigChancesMissed} />
                    <StatCard label="Penalty Goals" value={detailedStats.penaltyGoals} />
                    <StatCard label="Offsides" value={detailedStats.offsides} />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Defensive Tab */}
          <TabsContent value="defensive" className="mt-0">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">Defensive Statistics</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="Tackles" value={detailedStats.tackles} highlight />
                  <StatCard label="Interceptions" value={detailedStats.interceptions} />
                  <StatCard label="Clearances" value={detailedStats.clearances} />
                  <StatCard label="Blocked Shots" value={detailedStats.blockedShots} />
                  <StatCard label="Aerial Duels Won" value={detailedStats.aerialWon} />
                  <StatCard label="Duels Won" value={`${player.duelsWon}%`} highlight />
                  <StatCard label="Fouls Drawn" value={detailedStats.foulsDrawn} />
                  <StatCard label="Fouls Committed" value={detailedStats.foulsCommitted} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Passing Tab */}
          <TabsContent value="passing" className="mt-0">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">Passing Statistics</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="Pass Accuracy" value={`${player.passAccuracy}%`} highlight />
                  <StatCard label="Total Passes" value={detailedStats.totalPasses} />
                  <StatCard label="Key Passes" value={detailedStats.keyPasses} highlight />
                  <StatCard label="Through Balls" value={detailedStats.throughBalls} />
                  <StatCard label="Long Balls" value={detailedStats.longBalls} />
                  <StatCard label="Crosses/90" value={detailedStats.crossesP90} />
                  <StatCard label="Chances Created" value={detailedStats.chancesCreated} />
                  <StatCard label="Assists" value={player.assists} highlight />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Season History Table */}
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
          <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-foreground">Historique de saisons</h3>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
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
