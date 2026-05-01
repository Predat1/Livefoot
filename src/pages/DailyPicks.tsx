import { useMemo } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { useFixturesByDate } from "@/hooks/useApiFootball";
import LiveFootAIPrediction from "@/components/LiveFootAIPrediction";
import { Brain, Calendar, Sparkles, TrendingUp, Trophy, Zap, ChevronRight, Filter, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BrandedLoader } from "@/components/BrandedLoader";
import { Link } from "react-router-dom";
import { buildEntitySlug } from "@/utils/slugify";

const MOCK_MATCHES = [
  {
    id: "mock1",
    leagueName: "Ligue des Champions",
    leagueLogo: "https://media.api-sports.io/football/leagues/2.png",
    homeTeam: { id: "mock-541", name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png" },
    awayTeam: { id: "mock-50", name: "Manchester City", logo: "https://media.api-sports.io/football/teams/50.png" }
  },
  {
    id: "mock2",
    leagueName: "Premier League",
    leagueLogo: "https://media.api-sports.io/football/leagues/39.png",
    homeTeam: { id: "mock-42", name: "Arsenal", logo: "https://media.api-sports.io/football/teams/42.png" },
    awayTeam: { id: "mock-40", name: "Liverpool", logo: "https://media.api-sports.io/football/teams/40.png" }
  }
];

const DailyPicks = () => {
  const today = new Date();
  const { data: leagues, isLoading } = useFixturesByDate(today);

  // Flatten all matches for the day
  const allMatches = useMemo(() => {
    if (!leagues) return [];
    return leagues.flatMap(league => 
      league.matches.map(match => ({
        ...match,
        leagueName: league.name,
        leagueLogo: league.logo,
        leagueId: league.id
      }))
    ).filter(m => m.status === "scheduled");
  }, [leagues]);

  const topMatches = useMemo(() => {
    const realMatches = allMatches.slice(0, 5);
    return [...MOCK_MATCHES, ...realMatches];
  }, [allMatches]);

  return (
    <Layout>
      <SEOHead 
        title="Pronostics du Jour — LiveFoot AI" 
        description="Découvrez les prédictions ultra-fiables générées par l'intelligence artificielle LiveFoot pour les matchs de football du jour."
      />

      <div className="container max-w-5xl py-6 sm:py-10">
        {/* Hero Section */}
        <div className="relative mb-12 rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#0a1a10] via-[#050f0a] to-[#020503] border border-primary/20 p-8 sm:p-12 text-center">
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
              Chaque jour, notre algorithme analyse des millions de données pour vous proposer les pronostics les plus fiables du marché.
            </p>

            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-6 pt-2 sm:pt-4">
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[8px] sm:text-[10px] font-bold text-white/40 uppercase">Vitesse</p>
                  <p className="text-[9px] sm:text-xs font-bold text-white">Temps Réel</p>
                </div>
              </div>
              <div className="h-full w-px bg-white/10 hidden sm:block" />
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[8px] sm:text-[10px] font-bold text-white/40 uppercase">Précision</p>
                  <p className="text-[9px] sm:text-xs font-bold text-white">85% Succès</p>
                </div>
              </div>
              <div className="h-full w-px bg-white/10 hidden sm:block" />
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[8px] sm:text-[10px] font-bold text-white/40 uppercase">Sécurité</p>
                  <p className="text-[9px] sm:text-xs font-bold text-white">Vérifié</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Date Selector / Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">Pronos du {format(today, "d MMMM", { locale: fr })}</h2>
              <p className="text-xs text-muted-foreground">{topMatches.length} matchs analysés (Mode Aperçu Actif)</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-muted/50 border border-border/50">
            <button className="px-4 py-2 rounded-xl bg-background shadow-sm text-xs font-bold text-foreground flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" /> Tous les championnats
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
              <div key={match.id} className="group">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <img src={match.leagueLogo} alt="" className="h-5 w-5 object-contain" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{match.leagueName}</span>
                  </div>
                  <Link 
                    to={`/match/${match.id}/${buildEntitySlug(match.id, match.homeTeam.name)}-vs-${buildEntitySlug(match.id, match.awayTeam.name)}`}
                    className="text-[10px] font-black text-primary hover:underline flex items-center gap-1"
                  >
                    VOIR LE MATCH <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                
                <LiveFootAIPrediction
                  homeTeamId={match.homeTeam.id}
                  awayTeamId={match.awayTeam.id}
                  homeTeamName={match.homeTeam.name}
                  awayTeamName={match.awayTeam.name}
                  homeLogo={match.homeTeam.logo}
                  awayLogo={match.awayTeam.logo}
                />
              </div>
            ))}

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
            <h3 className="text-xl font-black text-foreground">Aucun match majeur trouvé</h3>
            <p className="text-sm text-muted-foreground mt-2">Revenez plus tard pour les prochaines analyses de l'Oracle.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DailyPicks;
