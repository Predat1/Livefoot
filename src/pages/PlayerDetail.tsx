import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { usePlayerDetailApi, usePlayerTrophies, usePlayerSeasons } from "@/hooks/useApiFootball";
import { ArrowLeft, Star, Target, TrendingUp, User, Shirt, Ruler, Weight, Calendar, ChevronDown, ChevronUp, Timer, Footprints, Crosshair, Shield, Zap, Trophy, Loader2 } from "lucide-react";
import PlayerAvatar from "@/components/PlayerAvatar";
import TeamLogo from "@/components/TeamLogo";
import CountryFlag from "@/components/CountryFlag";
import ShareButton from "@/components/ShareButton";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const StatCard = ({ label, value, icon: Icon, highlight = false }: { label: string; value: string | number; icon?: any; highlight?: boolean }) => (
  <div className="p-3 sm:p-4 rounded-xl bg-muted/30 text-center">
    {Icon && <Icon className={cn("h-4 w-4 mx-auto mb-1", highlight ? "text-primary" : "text-muted-foreground")} />}
    <div className={cn("text-xl sm:text-2xl font-black", highlight ? "text-primary" : "text-foreground")}>{value}</div>
    <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{label}</div>
  </div>
);

const PlayerDetail = () => {
  const { playerId } = useParams();
  const { data: player, isLoading, isError } = usePlayerDetailApi(playerId || "");
  const { data: trophies, isLoading: trophiesLoading } = usePlayerTrophies(playerId || "");
  const { data: seasonHistory, isLoading: seasonsLoading } = usePlayerSeasons(playerId || "");
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showAllSeasons, setShowAllSeasons] = useState(false);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="flex items-center gap-2 mb-6">
            <Link to="/players" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Link>
          </div>
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden mb-6">
            <div className="gradient-primary p-8">
              <div className="flex items-center gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-5 w-36" />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      </Layout>
    );
  }

  if (!player || isError) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Joueur introuvable</h1>
          <Link to="/players" className="text-primary hover:underline">Retour aux joueurs</Link>
        </div>
      </Layout>
    );
  }

  const isGK = player.position === "Goalkeeper";
  const shotsPerGame = player.appearances > 0 ? Math.round((player.shotsTotal / player.appearances) * 10) / 10 : 0;
  const duelsWonPct = player.duelsTotal > 0 ? Math.round((player.duelsWon / player.duelsTotal) * 100) : 0;
  const goalsP90 = player.minutes > 0 ? Math.round((player.goals / (player.minutes / 90)) * 100) / 100 : 0;
  const assistsP90 = player.minutes > 0 ? Math.round((player.assists / (player.minutes / 90)) * 100) / 100 : 0;
  const conversionRate = player.shotsTotal > 0 ? Math.round((player.goals / player.shotsTotal) * 100) : 0;

  const radarData = [
    { skill: "Tirs", value: Math.min(shotsPerGame * 20, 95) },
    { skill: "Passes", value: player.passAccuracy || 50 },
    { skill: "Dribbles", value: player.dribblesAttempts > 0 ? Math.min(Math.round((player.dribblesSuccess / player.dribblesAttempts) * 100), 95) : 40 },
    { skill: "Physique", value: Math.min(duelsWonPct + 10, 95) },
    { skill: "Vitesse", value: player.position === "Attacker" ? 88 : player.position === "Midfielder" ? 78 : 70 },
    { skill: "Défense", value: player.position === "Defender" ? 85 : isGK ? 90 : Math.min(player.tacklesTotal > 0 ? 45 : 30, 95) },
  ];

  const wonTrophies = (trophies || []).filter(t => t.place === "Winner");
  const visibleSeasons = showAllSeasons ? (seasonHistory || []) : (seasonHistory || []).slice(0, 5);

  return (
    <Layout>
      <SEOHead
        title={`${player.name} - Stats & Profil`}
        description={`${player.name} - ${player.position} au ${player.team}. ${player.goals} buts, ${player.assists} passes déc. en ${player.appearances} matchs.`}
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
            <ArrowLeft className="h-4 w-4" /> Retour aux joueurs
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
              <PlayerAvatar name={player.name} photoUrl={player.photo} size="xl" className="!bg-white/20" />
              <div className="text-center sm:text-left flex-1 text-primary-foreground">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <CountryFlag country={player.nationality} size="md" />
                  <span className="text-sm opacity-80">{player.nationality}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">{player.name}</h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                  {player.teamLogo && <img src={player.teamLogo} alt={player.team} className="h-5 w-5 object-contain" />}
                  <span className="opacity-90">{player.team}</span>
                </div>
                {player.league && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-xs opacity-70">
                    {player.leagueLogo && <img src={player.leagueLogo} alt={player.league} className="h-4 w-4 object-contain" />}
                    <span>{player.league} · {player.leagueCountry}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center text-primary-foreground">
                  <div className="text-4xl font-black">{player.rating.toFixed(1)}</div>
                  <div className="text-xs opacity-80">Rating</div>
                </div>
                <button onClick={() => toggleFavorite("players", player.id)} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                  <Star className={cn("h-5 w-5", isFavorite("players", player.id) ? "fill-primary text-primary" : "text-white")} />
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
              <p className="text-[10px] text-muted-foreground">Âge</p>
            </div>
            <div className="p-3 sm:p-4 text-center">
              <Ruler className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-black text-foreground">{player.height || "N/A"}</p>
              <p className="text-[10px] text-muted-foreground">Taille</p>
            </div>
            <div className="p-3 sm:p-4 text-center">
              <Weight className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-black text-foreground">{player.weight || "N/A"}</p>
              <p className="text-[10px] text-muted-foreground">Poids</p>
            </div>
            <div className="p-3 sm:p-4 text-center col-span-2 sm:col-span-1">
              <User className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-black text-foreground">{player.lineups}</p>
              <p className="text-[10px] text-muted-foreground">Titularisations</p>
            </div>
          </div>
        </div>

        {/* Detailed Stats Tabs */}
        <Tabs defaultValue="overview" className="w-full mb-6">
          <TabsList className="w-full grid grid-cols-4 bg-card border border-border/50 rounded-xl p-1 mb-4">
            <TabsTrigger value="overview" className="rounded-lg text-[10px] sm:text-sm">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="attacking" className="rounded-lg text-[10px] sm:text-sm">{isGK ? "Gardien" : "Attaque"}</TabsTrigger>
            <TabsTrigger value="defensive" className="rounded-lg text-[10px] sm:text-sm">Défense</TabsTrigger>
            <TabsTrigger value="passing" className="rounded-lg text-[10px] sm:text-sm">Passes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground">Statistiques saison</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard label="Buts" value={player.goals} icon={Target} highlight />
                    <StatCard label="Passes déc." value={player.assists} icon={Footprints} />
                    <StatCard label="Matchs" value={player.appearances} icon={Shirt} />
                    <StatCard label="Minutes" value={`${player.minutes}'`} icon={Timer} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <StatCard label="Buts/90" value={goalsP90} highlight />
                    <StatCard label="Passes/90" value={assistsP90} />
                    <StatCard label="Contributions" value={player.goals + player.assists} highlight />
                    <div className="p-3 sm:p-4 rounded-xl bg-muted/30 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-3.5 h-4 rounded bg-accent" />
                        <span className="font-black text-xl text-foreground">{player.yellowCards}</span>
                        <span className="w-3.5 h-4 rounded bg-destructive" />
                        <span className="font-black text-xl text-foreground">{player.redCards}</span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">Cartons</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground">Radar de compétences</h3>
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

          <TabsContent value="attacking" className="mt-0">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">{isGK ? "Statistiques gardien" : "Statistiques offensives"}</h3>
              </div>
              <div className="p-4">
                {isGK ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Arrêts" value={player.saves ?? 0} highlight />
                    <StatCard label="Buts encaissés" value={player.conceded ?? 0} />
                    <StatCard label="Matchs" value={player.appearances} />
                    <StatCard label="Minutes" value={`${player.minutes}'`} />
                    <StatCard label="Précision passes" value={`${player.passAccuracy}%`} />
                    <StatCard label="Duels gagnés" value={`${duelsWonPct}%`} />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Buts" value={player.goals} highlight />
                    <StatCard label="Buts/90" value={goalsP90} highlight />
                    <StatCard label="Passes déc." value={player.assists} />
                    <StatCard label="Passes/90" value={assistsP90} />
                    <StatCard label="Tirs/match" value={shotsPerGame} />
                    <StatCard label="Taux conversion" value={`${conversionRate}%`} highlight />
                    <StatCard label="Tirs cadrés" value={player.shotsOn} />
                    <StatCard label="Passes clés" value={player.passesKey} />
                    <StatCard label="Dribbles réussis" value={player.dribblesSuccess} />
                    <StatCard label="Dribbles tentés" value={player.dribblesAttempts} />
                    <StatCard label="Pénaltys marqués" value={player.penaltyScored} />
                    <StatCard label="Pénaltys ratés" value={player.penaltyMissed} />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="defensive" className="mt-0">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">Statistiques défensives</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="Tacles" value={player.tacklesTotal} highlight />
                  <StatCard label="Interceptions" value={player.tacklesInterceptions} />
                  <StatCard label="Blocs" value={player.tacklesBlocks} />
                  <StatCard label="Duels gagnés" value={`${duelsWonPct}%`} highlight />
                  <StatCard label="Duels totaux" value={player.duelsTotal} />
                  <StatCard label="Duels gagnés" value={player.duelsWon} />
                  <StatCard label="Fautes subies" value={player.foulsDrawn} />
                  <StatCard label="Fautes commises" value={player.foulsCommitted} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="passing" className="mt-0">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">Statistiques de passes</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="Précision" value={`${player.passAccuracy}%`} highlight />
                  <StatCard label="Total passes" value={player.passesTotal} />
                  <StatCard label="Passes clés" value={player.passesKey} highlight />
                  <StatCard label="Passes déc." value={player.assists} highlight />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Trophies Section */}
        {!trophiesLoading && wonTrophies.length > 0 && (
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden mb-6">
            <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-foreground">Palmarès ({wonTrophies.length})</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {wonTrophies.map((trophy, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <Trophy className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{trophy.league}</p>
                      <p className="text-xs text-muted-foreground">{trophy.season} · {trophy.country}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Season History */}
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
          <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-foreground">Historique de saisons</h3>
          </div>
          {seasonsLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (seasonHistory || []).length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Aucun historique disponible</div>
          ) : (
            <>
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Saison</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground">Club</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground">Ligue</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground">Matchs</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground">Buts</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground">Passes</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground">Mins</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSeasons.map((s: any, i: number) => (
                      <tr key={`${s.season}-${s.league}-${i}`} className={cn("border-b border-border/50 hover:bg-muted/30", i === 0 && "bg-primary/5")}>
                        <td className="px-4 py-3">
                          <span className={cn("text-xs font-bold", i === 0 ? "text-primary" : "text-foreground")}>
                            {s.season}/{String(Number(s.season) + 1).slice(2)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            {s.teamLogo && <img src={s.teamLogo} alt="" className="h-4 w-4 object-contain" />}
                            <span className="text-xs text-foreground truncate max-w-[100px]">{s.team}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            {s.leagueLogo && <img src={s.leagueLogo} alt="" className="h-4 w-4 object-contain" />}
                            <span className="text-xs text-muted-foreground truncate max-w-[80px]">{s.league}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center"><span className="text-sm font-bold text-foreground">{s.appearances}</span></td>
                        <td className="px-3 py-3 text-center"><span className={cn("text-sm font-black", s.goals > 0 ? "text-primary" : "text-muted-foreground")}>{s.goals}</span></td>
                        <td className="px-3 py-3 text-center"><span className="text-sm font-bold text-foreground">{s.assists}</span></td>
                        <td className="px-3 py-3 text-center"><span className="text-xs text-muted-foreground">{(s.minutes || 0).toLocaleString()}'</span></td>
                        <td className="px-3 py-3 text-center">
                          <span className={cn(
                            "inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-xs font-black min-w-[36px]",
                            s.rating >= 8 ? "bg-primary/15 text-primary" :
                            s.rating >= 7 ? "bg-muted text-foreground" :
                            "bg-muted/50 text-muted-foreground"
                          )}>
                            {s.rating > 0 ? s.rating.toFixed(1) : "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(seasonHistory || []).length > 5 && (
                <button
                  onClick={() => setShowAllSeasons((s) => !s)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t border-border"
                >
                  {showAllSeasons ? <><ChevronUp className="h-3.5 w-3.5" /> Voir moins</> : <><ChevronDown className="h-3.5 w-3.5" /> Voir toutes les saisons ({(seasonHistory || []).length})</>}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PlayerDetail;
