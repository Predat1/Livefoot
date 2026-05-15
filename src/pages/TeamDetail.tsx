import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHeadEnhanced";
import { useTeamDetail, useTeamSquad, useTeamFixtures, useTeamNextFixtures, useTeamCoach, useTransfersByTeam } from "@/hooks/useApiFootball";
import { ArrowLeft, MapPin, Users, Calendar, Star, Shirt, TrendingUp, User, ArrowRightLeft, Image } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShareButton from "@/components/ShareButton";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { Skeleton } from "@/components/ui/skeleton";
import { extractIdFromSlug, buildEntitySlug } from "@/utils/slugify";
import EntityBreadcrumbs from "@/components/EntityBreadcrumbs";

const TeamDetail = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  const rawParam = teamId || "";
  const resolvedParam = extractIdFromSlug(rawParam);
  const { data: team, isLoading: loadingTeam } = useTeamDetail(resolvedParam);
  const finalId = team?.id || (/^\d+$/.test(resolvedParam) ? resolvedParam : "");
  const { data: squad, isLoading: loadingSquad } = useTeamSquad(finalId);
  const { data: coach } = useTeamCoach(finalId);
  const { data: recentResults, isLoading: loadingResults } = useTeamFixtures(finalId, "2024");
  const { data: nextFixtures } = useTeamNextFixtures(finalId);
  const { data: transfers, isLoading: loadingTransfers } = useTransfersByTeam(finalId);

  // Group squad by position
  const squadByPosition = useMemo(() => {
    if (!squad || squad.length === 0) return {};
    const groups: Record<string, any[]> = {};
    const posOrder = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];
    for (const p of squad) {
      const pos = p.position || "Other";
      if (!groups[pos]) groups[pos] = [];
      groups[pos].push(p);
    }
    // Sort by position order
    const sorted: Record<string, any[]> = {};
    for (const pos of posOrder) {
      if (groups[pos]) sorted[pos] = groups[pos];
    }
    // Add any remaining positions
    for (const pos of Object.keys(groups)) {
      if (!sorted[pos]) sorted[pos] = groups[pos];
    }
    return sorted;
  }, [squad]);

  // Redirect to canonical SEO-friendly URL
  useEffect(() => {
    if (team?.id && team?.name) {
      const canonical = buildEntitySlug(team.id, team.name);
      if (rawParam !== canonical) {
        navigate(`/teams/${canonical}`, { replace: true });
      }
    }
  }, [team?.id, team?.name, rawParam, navigate]);

  if (loadingTeam) {
    return (
      <Layout>
        <div className="px-2 sm:container py-8">
          <Skeleton className="h-48 w-full rounded-2xl mb-6" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!team) {
    return (
      <Layout>
        <div className="px-2 sm:container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Team not found</h1>
          <Link to="/teams" className="text-primary hover:underline">Back to teams</Link>
        </div>
      </Layout>
    );
  }

  const positionLabel = (pos: string) => {
    const labels: Record<string, string> = {
      Goalkeeper: "🧤 Gardiens",
      Defender: "🛡️ Défenseurs",
      Midfielder: "⚙️ Milieux",
      Attacker: "⚡ Attaquants",
      Other: "👤 Autres",
    };
    return labels[pos] || pos;
  };

  return (
    <Layout>
      <SEOHead
        title={`${team.name} - Effectif, Calendrier, Résultats ${new Date().getFullYear()}/${(new Date().getFullYear() + 1).toString().slice(-2)} | LiveFoot`}
        description={`${team.name} (${team.country}) - Tout sur l'équipe : effectif complet, prochains matchs, derniers résultats, transferts, classement et statistiques. Stade: ${team.venue?.name || "N/A"}. Suivez ${team.name} en direct sur LiveFoot.fun !`}
        keywords={`${team.name}, ${team.name} effectif, ${team.name} calendrier, ${team.name} résultats, ${team.name} transferts, ${team.country} football, ${team.name} match en direct, composition ${team.name}`}
        ogImage={team.logo}
        canonical={`https://www.livefoot.fun/teams/${teamId}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SportsTeam",
          name: team.name,
          sport: "Soccer",
          area: {
            "@type": "Place",
            name: team.country,
          },
          member: squad?.map((p: any) => ({
            "@type": "Person",
            name: p.name,
            position: p.position,
          })),
        }}
        breadcrumbs={[
          { name: "Équipes", url: "/teams" },
          { name: team.name, url: `/teams/${teamId}` },
        ]}
      />
      <div className="px-2 sm:container py-4 sm:py-8">
        <EntityBreadcrumbs steps={[
          { label: "Équipes", href: "/teams" },
          { label: team.name },
        ]} />
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link to="/teams" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
          <ShareButton title={`${team.name} | LiveFoot`} text={`Découvrez ${team.name} | LiveFoot`} />
        </div>

        {/* Team Header */}
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden mb-6">
          {/* Venue Image Banner */}
          {team.venue?.image && (
            <div className="relative h-32 sm:h-48 w-full overflow-hidden">
              <img src={team.venue.image} alt={team.venue.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white/80 text-xs font-medium">
                <MapPin className="h-3.5 w-3.5" />
                <span>{team.venue.name}{team.venue.city ? ` • ${team.venue.city}` : ""}</span>
              </div>
            </div>
          )}

          <div className="gradient-primary p-6 sm:p-8 text-primary-foreground">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {team.logo ? (
                <img src={team.logo} alt={team.name} className="h-20 w-20 sm:h-24 sm:w-24 object-contain bg-white/20 rounded-2xl p-2" />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl font-black">{team.name.charAt(0)}</div>
              )}
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-2xl sm:text-3xl font-black">{team.name}</h1>
                <p className="text-primary-foreground/80">{team.country}</p>
                {coach && (
                  <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                    {coach.photo && <img src={coach.photo} alt={coach.name} className="h-6 w-6 rounded-full object-cover border border-white/30" />}
                    <span className="text-xs text-primary-foreground/70">Entraîneur : <strong className="text-primary-foreground">{coach.name}</strong></span>
                  </div>
                )}
              </div>
              <button
                onClick={() => toggleFavorite("teams", team.id, team.name)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <Star className={cn("h-5 w-5", isFavorite("teams", team.id) ? "fill-yellow-400 text-yellow-400" : "text-white")} />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
            <div className="p-4 text-center">
              <Calendar className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-black text-foreground">{team.founded || "—"}</p>
              <p className="text-xs text-muted-foreground">Fondé</p>
            </div>
            <div className="p-4 text-center">
              <MapPin className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground truncate">{team.venue?.name || "—"}</p>
              <p className="text-xs text-muted-foreground">Stade</p>
            </div>
            <div className="p-4 text-center">
              <Users className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-black text-foreground">{team.venue?.capacity?.toLocaleString() || "—"}</p>
              <p className="text-xs text-muted-foreground">Capacité</p>
            </div>
            <div className="p-4 text-center">
              <Shirt className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-black text-foreground">{squad?.length || "—"}</p>
              <p className="text-xs text-muted-foreground">Joueurs</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="squad" className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-card border border-border/50 rounded-xl p-1 mb-4">
            <TabsTrigger value="squad" className="rounded-lg text-xs sm:text-sm">Effectif</TabsTrigger>
            <TabsTrigger value="transfers" className="rounded-lg text-xs sm:text-sm">Transferts</TabsTrigger>
            <TabsTrigger value="results" className="rounded-lg text-xs sm:text-sm">Résultats</TabsTrigger>
            <TabsTrigger value="fixtures" className="rounded-lg text-xs sm:text-sm">À venir</TabsTrigger>
          </TabsList>

          {/* Squad */}
          <TabsContent value="squad" className="mt-0">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-5 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shirt className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground">Effectif ({squad?.length || 0} joueurs)</h3>
                </div>
              </div>
              {loadingSquad ? (
                <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : Object.keys(squadByPosition).length > 0 ? (
                <div className="p-4 space-y-6">
                  {Object.entries(squadByPosition).map(([position, players]) => (
                    <div key={position}>
                      <h4 className="text-sm font-black text-muted-foreground mb-3 uppercase tracking-wider">{positionLabel(position)}</h4>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {players.map((player: any) => (
                          <Link
                            key={player.id}
                            to={`/players/${buildEntitySlug(player.id, player.name)}`}
                            className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 hover:ring-1 hover:ring-primary/30 transition-all group"
                          >
                            {player.photo ? (
                              <img src={player.photo} alt={player.name} className="h-10 w-10 rounded-full object-cover bg-muted group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                                {player.name?.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">{player.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {player.number ? `#${player.number}` : ""} {player.age ? `• ${player.age} ans` : ""}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">Aucune donnée d'effectif disponible.</div>
              )}
            </div>
          </TabsContent>

          {/* Transfers */}
          <TabsContent value="transfers" className="mt-0">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">Transferts Récents</h3>
              </div>
              {loadingTransfers ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : transfers && transfers.length > 0 ? (
                <div className="p-4 space-y-3">
                  {transfers.slice(0, 20).map((t: any, idx: number) => {
                    const latestTransfer = t.transfers?.[0];
                    if (!latestTransfer) return null;
                    const isArrival = String(latestTransfer.teams?.in?.id) === finalId;
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-white/5">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0",
                          isArrival ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                        )}>
                          {isArrival ? "IN" : "OUT"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{t.player?.name}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {isArrival ? (
                              <>
                                <span>de</span>
                                {latestTransfer.teams?.out?.logo && <img src={latestTransfer.teams.out.logo} alt="" className="h-3.5 w-3.5 object-contain" />}
                                <span className="font-medium">{latestTransfer.teams?.out?.name}</span>
                              </>
                            ) : (
                              <>
                                <span>vers</span>
                                {latestTransfer.teams?.in?.logo && <img src={latestTransfer.teams.in.logo} alt="" className="h-3.5 w-3.5 object-contain" />}
                                <span className="font-medium">{latestTransfer.teams?.in?.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            latestTransfer.type === "Free" ? "bg-muted text-muted-foreground" :
                            latestTransfer.type === "Loan" ? "bg-amber-500/10 text-amber-500" :
                            "bg-primary/10 text-primary"
                          )}>
                            {latestTransfer.type === "Free" ? "Libre" : latestTransfer.type === "Loan" ? "Prêt" : latestTransfer.type || "Transfert"}
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-1">{latestTransfer.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">Aucun transfert récent.</div>
              )}
            </div>
          </TabsContent>

          {/* Results */}
          <TabsContent value="results" className="mt-0">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">Résultats Récents</h3>
              </div>
              {loadingResults ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                  ))}
                </div>
              ) : recentResults && recentResults.length > 0 ? (
                <div className="p-4 space-y-2">
                  {recentResults.map((r: any) => {
                    const isHome = r.homeTeam.name === team.name;
                    const won = isHome ? (r.homeScore > r.awayScore) : (r.awayScore > r.homeScore);
                    const draw = r.homeScore === r.awayScore;
                    const result = won ? "W" : draw ? "D" : "L";
                    return (
                      <Link key={r.id} to={`/match/${r.id}`} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                            result === "W" ? "bg-emerald-500/10 text-emerald-500" :
                            result === "L" ? "bg-destructive/10 text-destructive" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {result}
                          </span>
                          <div className="flex items-center gap-2">
                            {r.homeTeam.logo && <img src={r.homeTeam.logo} alt="" className="h-5 w-5 object-contain" />}
                            <span className="text-xs font-medium text-foreground">{r.homeTeam.name}</span>
                            <span className="text-xs font-bold text-foreground">{r.homeScore} - {r.awayScore}</span>
                            <span className="text-xs font-medium text-foreground">{r.awayTeam.name}</span>
                            {r.awayTeam.logo && <img src={r.awayTeam.logo} alt="" className="h-5 w-5 object-contain" />}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{r.date}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">Aucun résultat disponible.</div>
              )}
            </div>
          </TabsContent>

          {/* Upcoming Fixtures */}
          <TabsContent value="fixtures" className="mt-0">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">Prochains Matchs</h3>
              </div>
              {nextFixtures && nextFixtures.length > 0 ? (
                <div className="p-4 space-y-2">
                  {nextFixtures.map((f: any) => (
                    <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-2">
                        {f.homeTeam.logo && <img src={f.homeTeam.logo} alt="" className="h-5 w-5 object-contain" />}
                        <span className="text-xs font-medium text-foreground">{f.homeTeam.name}</span>
                        <span className="text-xs text-muted-foreground">vs</span>
                        <span className="text-xs font-medium text-foreground">{f.awayTeam.name}</span>
                        {f.awayTeam.logo && <img src={f.awayTeam.logo} alt="" className="h-5 w-5 object-contain" />}
                      </div>
                      <span className="text-xs text-muted-foreground">{f.date} • {f.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">Aucun match à venir.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default TeamDetail;
