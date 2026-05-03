import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import DatePicker from "@/components/DatePicker";
import LeagueSection from "@/components/LeagueSection";
import PullToRefreshIndicator from "@/components/PullToRefresh";
import InfiniteScrollLoader from "@/components/InfiniteScrollLoader";
import { useFootballNews } from "@/hooks/useFootballNews";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useFixturesByDate, TIER1_IDS, TIER2_IDS, TIER3_IDS } from "@/hooks/useApiFootball";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserCountry, getLeagueIdsForCountry } from "@/hooks/useUserCountry";
import { useCommunityTopRated } from "@/hooks/useCommunityRatings";
import { Trophy, TrendingUp, Zap, ArrowRight, Calendar, Eye, Flame, Loader2, WifiOff, Star, Sparkles } from "lucide-react";
import { useAppLogo } from "@/hooks/useAppLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchSkeleton } from "@/components/BrandedLoader";
import FavoritesFeed from "@/components/FavoritesFeed";
import PlayerAvatar from "@/components/PlayerAvatar";
import { cn } from "@/lib/utils";
import { buildEntitySlug } from "@/utils/slugify";

const Index = () => {
  const livefootLogo = useAppLogo();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: apiLeagues, isLoading, isError, refetch } = useFixturesByDate(selectedDate);
  const { favorites } = useFavorites();
  const { data: userCountry } = useUserCountry();

  const favoriteCompIds = useMemo(() => new Set(favorites.competitions), [favorites.competitions]);
  const localLeagueIds = useMemo(() => getLeagueIdsForCountry(userCountry), [userCountry]);

  // Smart sort: Live > User favorites > Local league > Tier1 > Tier2 > Tier3 > rest
  const leagues = useMemo(() => {
    const raw = apiLeagues || [];
    return [...raw].sort((a, b) => {
      const score = (league: typeof a) => {
        let s = 0;
        if (league.matches.some((m) => m.status === "live")) s += 1000;
        if (favoriteCompIds.has(league.id)) s += 500;
        if (localLeagueIds.has(league.id)) s += 300;
        if (TIER1_IDS.has(league.id)) s += 200;
        else if (TIER2_IDS.has(league.id)) s += 150;
        else if (TIER3_IDS.has(league.id)) s += 100;
        s += league.matches.length * 0.1;
        return s;
      };
      return score(b) - score(a);
    });
  }, [apiLeagues, favoriteCompIds, localLeagueIds]);

  const matchCounts = useMemo(() => {
    let all = 0;
    let tv = 0;
    let live = 0;
    for (const league of leagues) {
      for (const match of league.matches) {
        all++;
        if ((match as any).isTv) tv++;
        if (match.status === "live") live++;
      }
    }
    return { all, tv, live };
  }, [leagues]);

  const filteredLeagues = useMemo(() => {
    if (activeFilter === "all") return leagues;
    return leagues
      .map((league) => ({
        ...league,
        matches: league.matches.filter((match) => {
          if (activeFilter === "tv") return (match as any).isTv === true;
          if (activeFilter === "live") return match.status === "live";
          return true;
        }),
      }))
      .filter((league) => league.matches.length > 0);
  }, [activeFilter, leagues]);

  const stats = [
    { icon: Trophy, label: "Ligues", value: String(leagues.length), color: "text-amber-500" },
    { icon: TrendingUp, label: "En Direct", value: String(matchCounts.live), color: "text-red-500" },
    { icon: Zap, label: "Total Matchs", value: String(matchCounts.all), color: "text-primary" },
  ];

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const { items: visibleLeagues, hasMore, isLoading: isLoadingMore, loadMoreRef } = useInfiniteScroll({
    initialItems: filteredLeagues,
    itemsPerPage: 3,
  });

  const { data: newsArticles = [] } = useFootballNews();
  const { data: topRatedPlayers } = useCommunityTopRated("week");
  const trendingNews = newsArticles.filter((n) => n.trending).slice(0, 4);
  const featuredNews = newsArticles[0];

  const FOOTER_LINKS = [
    { label: "À propos", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Confidentialité", href: "/privacy" },
    { label: "Conditions", href: "/terms" },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background relative pb-safe lg:pb-0">
      <SEOHead
        title="LiveFoot - Scores Football en Direct Aujourd'hui"
        description="Suivez tous les scores de football en direct, résultats, calendriers et classements."
        path="/"
      />
      
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        progress={progress}
      />
      
      <Header />

      <main className="animate-fade-in">
        {/* Elite Hero Section */}
        {featuredNews && (
          <section className="relative h-[40vh] sm:h-[50vh] overflow-hidden group">
            <motion.img 
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
              src={featuredNews.image} 
              className="absolute inset-0 w-full h-full object-cover" 
              alt="Featured"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent hidden sm:block" />
            
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12 sm:pb-20">
              <div className="container px-0 sm:px-4">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-3xl space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-primary text-[10px] font-black text-primary-foreground uppercase tracking-widest">À LA UNE</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-white/80 uppercase tracking-widest">
                      <Sparkles size={12} className="text-primary" /> {featuredNews.category}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-5xl font-black text-white leading-[1.1] tracking-tighter drop-shadow-2xl">
                    {featuredNews.title}
                  </h1>
                  <p className="text-sm sm:text-lg text-white/70 font-medium line-clamp-2 max-w-xl">
                    {featuredNews.summary || "Découvrez les dernières analyses et résultats du monde du football en direct."}
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <Button asChild className="rounded-full px-8 gradient-primary shadow-xl shadow-primary/30">
                      <Link to={`/news/${featuredNews.id}`}>Lire l'article</Link>
                    </Button>
                    <div className="flex items-center gap-2 text-white/60 text-xs font-bold uppercase tracking-widest">
                      <Eye size={14} /> {featuredNews.views?.toLocaleString()} vues
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        )}

        <DatePicker
          selectedDate={selectedDate}
          activeFilter={activeFilter}
          onDateChange={setSelectedDate}
          onFilterChange={setActiveFilter}
          matchCounts={matchCounts}
        />

        <div className="px-2 sm:container py-6 sm:py-10">
          {/* Elite Stats Cards */}
          <div className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-3xl glass-card p-6 shadow-sm hover-lift card-shine"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-150 group-hover:rotate-12">
                  <stat.icon size={64} />
                </div>
                <div className="flex items-center gap-4">
                  <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 shadow-inner transition-transform group-hover:scale-110", stat.color)}>
                    <stat.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-foreground tracking-tighter leading-none">
                      {isLoading ? "..." : stat.value}
                    </p>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              {/* Favorites Feed */}
              <FavoritesFeed leagues={leagues} isLoading={isLoading} />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1.5 rounded-full gradient-primary shadow-glow" />
                  <h2 className="text-xl font-black text-foreground tracking-tighter uppercase">
                    {activeFilter === "live" ? "Direct 🔥" : activeFilter === "tv" ? "Télévisé 📺" : "Le Programme"}
                  </h2>
                </div>
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" /> Mise à jour...
                  </div>
                )}
              </div>

              {/* Loading skeleton */}
              {isLoading && <MatchSkeleton />}

              {/* Error state */}
              {isError && !isLoading && (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-[2.5rem] bg-card border border-border">
                  <WifiOff className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground font-bold mb-4 uppercase text-xs tracking-widest">Connexion interrompue</p>
                  <Button onClick={() => refetch()} className="rounded-full gradient-primary px-8">Réessayer</Button>
                </div>
              )}

              {/* Leagues */}
              {!isLoading && !isError && (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {visibleLeagues.length > 0 ? (
                      visibleLeagues.map((league, index) => (
                        <motion.div
                          key={league.id}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <LeagueSection league={league} index={index} />
                        </motion.div>
                      ))
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="text-muted-foreground font-black uppercase text-[10px] tracking-widest opacity-40">
                          {matchCounts.all === 0 ? "Silence radio sur les terrains..." : "Aucun match ne correspond à vos critères."}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Infinite Scroll Loader */}
              {!isLoading && !isError && (
                <InfiniteScrollLoader
                  ref={loadMoreRef}
                  isLoading={isLoadingMore}
                  hasMore={hasMore}
                />
              )}
            </div>

            <aside className="lg:col-span-4 space-y-10">
              {/* Community Widget */}
              {topRatedPlayers && topRatedPlayers.length > 0 && (
                <section className="rounded-[2.5rem] bg-card/40 border border-border p-8 shadow-sm">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-primary fill-primary" />
                      <h3 className="text-lg font-black tracking-tighter uppercase">Elite Players</h3>
                    </div>
                    <Link to="/rankings" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Voir tout</Link>
                  </div>
                  <div className="space-y-4">
                    {topRatedPlayers.slice(0, 5).map((player, index) => (
                      <Link
                        key={player.player_id}
                        to={`/players/${buildEntitySlug(player.player_id, player.player_name)}`}
                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-all group"
                      >
                        <div className="relative">
                          <PlayerAvatar name={player.player_name} size="sm" />
                          <span className={cn(
                            "absolute -top-1 -left-1 h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-card",
                            index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-foreground truncate leading-none group-hover:text-primary transition-colors">{player.player_name}</p>
                          <p className="text-[9px] text-muted-foreground uppercase font-bold mt-1 tracking-wider">{player.total_ratings} votes</p>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10">
                           <Star size={12} className="text-primary fill-primary" />
                           <span className="text-sm font-black text-primary">{player.avg_rating}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Trending News Widget */}
              {trendingNews.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Flame className="h-5 w-5 text-destructive animate-pulse" />
                      <h3 className="text-lg font-black tracking-tighter uppercase">Hot News</h3>
                    </div>
                    <Link to="/news" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Tout voir</Link>
                  </div>
                  <div className="space-y-3">
                    {trendingNews.map((news, index) => (
                      <Link
                        key={`${news.id}-${index}`}
                        to={`/news/${news.id}`}
                        className="group flex gap-4 items-center animate-fade-in"
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border shadow-sm">
                          <img src={news.image} className="h-full w-full object-cover transition-transform group-hover:scale-110" alt={news.title} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{news.category}</p>
                          <h4 className="text-sm font-black text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">{news.title}</h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </aside>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-20 mt-12">
        <div className="container text-center space-y-8">
          <div className="flex items-center justify-center gap-4">
            <div className="h-14 w-14 rounded-[1.5rem] gradient-primary shadow-xl shadow-primary/20 flex items-center justify-center p-3">
              <img src="/logo.svg" className="brightness-0 invert h-full w-full object-contain" />
            </div>
            <span className="text-3xl font-black text-foreground tracking-tighter">LIVEFOOT<span className="text-primary">AI</span></span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto font-medium leading-relaxed">
            L'excellence du football en temps réel. Découvrez les scores, analyses et prédictions propulsées par l'intelligence marketplace.
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.label} to={link.href} className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="pt-8 border-t border-border/50 max-w-xs mx-auto">
            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
              © {new Date().getFullYear()} LIVEFOOT ELITE STUDIO
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
