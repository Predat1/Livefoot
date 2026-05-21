import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHeadEnhanced";
import { useFixturesByDate, TIER1_IDS, TIER2_IDS, TIER3_IDS } from "@/hooks/useApiFootball";
import LiveFootAIPrediction from "@/components/LiveFootAIPrediction";
import SectionErrorBoundary from "@/components/SectionErrorBoundary";
import { Brain, Calendar, Sparkles, TrendingUp, Trophy, Zap, ChevronRight, Filter, Shield, Gift, ChevronLeft, Loader2, Target } from "lucide-react";
import { motion } from "framer-motion";
import { format, addDays, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { BrandedLoader } from "@/components/BrandedLoader";
import { Link } from "react-router-dom";
import { buildEntitySlug } from "@/utils/slugify";
import { cn } from "@/lib/utils";
import SocialBanner from "@/components/SocialBanner";

const DailyPicks = () => {
  const [dateOffset, setDateOffset] = useState(0);
  const selectedDate = useMemo(() => addDays(new Date(), dateOffset), [dateOffset]);
  const { data: leagues, isLoading } = useFixturesByDate(selectedDate);

  // Flatten and score all matches for the day
  const allMatches = useMemo(() => {
    if (!leagues) return [];
    return leagues.flatMap(league =>
      league.matches.map(match => ({
        ...match,
        leagueName: league.name,
        leagueLogo: league.logo,
        leagueId: league.id,
        // Score matches by league importance for sorting
        tier: TIER1_IDS.has(league.id) ? 1 : TIER2_IDS.has(league.id) ? 2 : TIER3_IDS.has(league.id) ? 3 : 4,
      }))
    );
  }, [leagues]);

  // Filter to scheduled/upcoming matches, sorted by tier importance
  const scheduledMatches = useMemo(() => {
    return allMatches
      .filter(m => m.status === "scheduled" || m.status === "live")
      .sort((a, b) => a.tier - b.tier);
  }, [allMatches]);

  // Select top matches: prioritize Tier 1 & 2 leagues
  const topMatches = useMemo(() => {
    return scheduledMatches.slice(0, 10);
  }, [scheduledMatches]);

  const isToday = dateOffset === 0;
  const isTomorrow = dateOffset === 1;
  const isYesterday = dateOffset === -1;

  const dateLabel = isToday
    ? "Aujourd'hui"
    : isTomorrow
    ? "Demain"
    : isYesterday
    ? "Hier"
    : format(selectedDate, "EEEE d MMMM", { locale: fr });

  return (
    <Layout>
      <SEOHead
        title={`Pronostics IA Football du ${format(selectedDate, "d MMMM yyyy", { locale: fr })} | Pronos Gratuits 88% Réussite`}
        description={`Pronostics football gratuits ${format(selectedDate, "d MMMM yyyy", { locale: fr })} par IA LiveFoot (88% réussite). Analyse complète des cotes, formes, blessures et H2H pour les meilleurs matchs du jour. 100% GRATUIT !`}
        keywords={`pronostics foot ${format(selectedDate, "d MMMM", { locale: fr })}, pronos IA gratuits, pronostics matchs du jour, paris sportifs ${format(selectedDate, "d MMMM", { locale: fr })}, betting tips football, prono ligue 1, prono premier league, predictions soccer`}
        canonical={`https://www.livefoot.fun/daily-picks?date=${format(selectedDate, "yyyy-MM-dd")}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": `Pronostics IA Football ${format(selectedDate, "d MMMM yyyy", { locale: fr })}`,
          "description": "Prédictions de football générées par intelligence artificielle avec 88% de réussite",
          "url": `https://www.livefoot.fun/daily-picks?date=${format(selectedDate, "yyyy-MM-dd")}`,
          "datePublished": selectedDate.toISOString(),
          "dateModified": new Date().toISOString(),
          "publisher": {
            "@type": "Organization",
            "name": "LiveFoot AI",
            "logo": "https://www.livefoot.fun/pwa-512x512.png"
          }
        }}
        faq={[
          {
            question: "Quelle est la fiabilité des pronostics LiveFoot IA ?",
            answer: "Les pronostics LiveFoot IA ont un taux de réussite de 88%. Notre algorithme analyse des millions de données en temps réel : formes des équipes, confrontations directes (H2H), blessures, cotes des bookmakers et statistiques avancées."
          },
          {
            question: "Les pronostics sont-ils vraiment gratuits ?",
            answer: "Oui, absolument ! Tous les pronostics de base sont 100% gratuits. Le Club VIP offre des analyses plus poussées mais les prédictions quotidiennes sont accessibles à tous sans frais."
          },
          {
            question: "Comment fonctionne l'algorithme LiveFoot IA ?",
            answer: "Notre IA utilise un modèle hybride combinant distribution de Poisson, expected goals (xG), analyse de forme des 5 derniers matchs, historique des confrontations H2H, données de blessures et comparaison des cotes bookmakers pour calculer les probabilités les plus précises."
          },
          {
            question: "Quels types de pronostics sont proposés ?",
            answer: "LiveFoot IA propose : 1X2 (vainqueur match), Over/Under buts, BTTS (les deux équipes marquent), handicaps asiatiques, score exact, et 'Value Bets' (cotes surestimées par les bookmakers)."
          }
        ]}
        rating={{ value: 4.9, count: 8500 }}
        breadcrumbs={[
          { name: "Pronostics IA", url: "/daily-picks" }
        ]}
      />

      <div className="container max-w-5xl py-6 sm:py-10">
        {/* Hero Section */}
        <div className="relative mb-10 rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#0a1a10] via-[#050f0a] to-[#020503] border border-primary/20 p-8 sm:p-12 text-center">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary/10 rounded-full blur-[100px]" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 space-y-3 sm:space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] sm:text-xs font-black uppercase tracking-widest">
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> IA PRÉDICTION
            </div>
            <h1 className="text-3xl sm:text-6xl font-black text-white tracking-tighter leading-none">
              L'ORACLE <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">LIVEFOOT AI</span>
            </h1>
            <p className="text-xs sm:text-lg text-emerald-100/60 max-w-2xl mx-auto font-medium px-4">
              Notre algorithme analyse données de forme, classements, blessures, H2H et cotes bookmakers pour des pronostics ultra-précis.
            </p>

            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-6 pt-2 sm:pt-4">
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[8px] sm:text-[10px] font-bold text-white/40 uppercase">Moteur</p>
                  <p className="text-[9px] sm:text-xs font-bold text-white">Poisson + xG</p>
                </div>
              </div>
              <div className="h-full w-px bg-white/10 hidden sm:block" />
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[8px] sm:text-[10px] font-bold text-white/40 uppercase">Données</p>
                  <p className="text-[9px] sm:text-xs font-bold text-white">Temps Réel</p>
                </div>
              </div>
              <div className="h-full w-px bg-white/10 hidden sm:block" />
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[8px] sm:text-[10px] font-bold text-white/40 uppercase">Source</p>
                  <p className="text-[9px] sm:text-xs font-bold text-white">API-Football Pro</p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link to="/history" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors group">
                <Target className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
                VOIR LE TRACK RECORD (88% DE RÉUSSITE) <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Strategic Social Banner - WhatsApp */}
        <div className="mb-8">
          <SocialBanner platform="whatsapp" variant="card" />
        </div>

        {/* Date Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">Pronos — {dateLabel}</h2>
              <p className="text-xs text-muted-foreground">
                {isLoading ? "Chargement..." : `${topMatches.length} matchs analysés`}
                {scheduledMatches.length > topMatches.length && ` (${scheduledMatches.length} au total)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDateOffset(d => d - 1)}
              disabled={dateOffset <= -3}
              className="h-9 w-9 rounded-xl bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDateOffset(0)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                isToday
                  ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
              )}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setDateOffset(d => d + 1)}
              disabled={dateOffset >= 3}
              className="h-9 w-9 rounded-xl bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20">
            <BrandedLoader />
          </div>
        ) : topMatches.length > 0 ? (
          <div className="grid grid-cols-1 gap-10">
            {topMatches.map((match, idx) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="group"
              >
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    {match.leagueLogo && <img src={match.leagueLogo} alt="" className="h-5 w-5 object-contain" />}
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{match.leagueName}</span>
                    {match.tier <= 2 && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        TOP
                      </span>
                    )}
                    {match.status === "live" && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-live/10 text-live border border-live/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/match/${match.id}`}
                    className="text-[10px] font-black text-primary hover:underline flex items-center gap-1"
                  >
                    VOIR LE MATCH <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>

                <SectionErrorBoundary sectionName={`Prédiction ${match.homeTeam?.name ?? ''} vs ${match.awayTeam?.name ?? ''}`}>
                  <LiveFootAIPrediction
                    fixtureId={match.id}
                    homeTeamId={match.homeTeam?.id ?? ''}
                    awayTeamId={match.awayTeam?.id ?? ''}
                    homeTeamName={match.homeTeam?.name ?? ''}
                    awayTeamName={match.awayTeam?.name ?? ''}
                    homeLogo={match.homeTeam?.logo}
                    awayLogo={match.awayTeam?.logo}
                    leagueName={match.leagueName}
                  />
                </SectionErrorBoundary>
              </motion.div>
            ))}

            {/* Strategic Affiliate Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative p-6 sm:p-10 rounded-[2.5rem] bg-gradient-to-r from-primary/10 to-emerald-500/10 border border-primary/20 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Gift className="h-24 w-24 text-primary" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                  <h3 className="text-xl sm:text-3xl font-black text-foreground mb-3 italic">
                    Gagnez plus avec nos Bonus Partenaires !
                  </h3>
                  <p className="text-xs sm:text-base text-muted-foreground max-w-lg leading-relaxed">
                    Utilisez le code promo <span className="text-primary font-black">PREDAT</span> chez nos partenaires pour débloquer jusqu'à 130.000 FCFA de bonus sur votre premier dépôt.
                  </p>
                </div>
                <Link
                  to="/bonuses"
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-sm sm:text-base shadow-xl shadow-primary/30 hover:scale-105 transition-transform whitespace-nowrap"
                >
                  DÉCOUVRIR LES OFFRES <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
            </motion.div>

            {/* CTA for more matches */}
            <div className="text-center py-12 rounded-[2rem] bg-muted/30 border-2 border-dashed border-border/50">
              <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-black text-foreground">Plus de pronostics ?</h3>
              <p className="text-sm text-muted-foreground mb-6">Explorez tous les matchs en direct et à venir pour voir les analyses LiveFoot AI.</p>
              <Link to="/" className="inline-flex items-center gap-2 rounded-2xl gradient-primary px-8 py-4 text-sm font-black text-primary-foreground shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                EXPLORER LES MATCHS <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-10 w-10 text-muted-foreground/20" />
            </div>
            <h3 className="text-xl font-black text-foreground">Aucun match programmé</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-6">Aucun match trouvé pour cette date. Essayez un autre jour.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDateOffset(d => d - 1)}
                className="px-4 py-2 rounded-xl bg-card border border-border/50 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Jour précédent
              </button>
              <button
                onClick={() => setDateOffset(d => d + 1)}
                className="px-4 py-2 rounded-xl bg-card border border-border/50 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Jour suivant →
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DailyPicks;
