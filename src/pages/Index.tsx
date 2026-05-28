import React, { useState, useCallback, useMemo, Fragment, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHeadEnhanced";
import DatePicker from "@/components/DatePicker";
import LeagueSection from "@/components/LeagueSection";
import PullToRefreshIndicator from "@/components/PullToRefresh";
import InfiniteScrollLoader from "@/components/InfiniteScrollLoader";
import { useFootballNews } from "@/hooks/useFootballNews";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useFixturesByDate, useRealtimeLiveFixtures, type LeagueData } from "@/hooks/useApiFootball";
import { useFavorites } from "@/hooks/useFavorites";
import { useCommunityTopRated } from "@/hooks/useCommunityRatings";
import { Trophy, TrendingUp, Zap, ArrowRight, Calendar, Eye, Flame, Loader2, WifiOff, Star, Users, Sparkles, Share2 } from "lucide-react";
import { useAppLogo } from "@/hooks/useAppLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { MatchSkeleton } from "@/components/BrandedLoader";
import PlayerAvatar from "@/components/PlayerAvatar";
import { cn } from "@/lib/utils";
import { buildEntitySlug } from "@/utils/slugify";
import { isFavoriteMatch, sortLeaguesByPriority, sortMatchesWithinLeague } from "@/utils/matchRanking";
import SectionErrorBoundary from "@/components/SectionErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";

// Widgets secondaires lazy-loaded -> sortis du bundle initial de la home
const FavoritesFeed = lazy(() => import("@/components/FavoritesFeed"));
const TopMatches = lazy(() => import("@/components/TopMatches"));
const TopScorersWidget = lazy(() => import("@/components/TopScorersWidget"));
const PartnerBanner = lazy(() => import("@/components/PartnerBanner"));
import TelegramBanner from "@/components/TelegramBanner";
import ShareWidget from "@/components/ShareWidget";
import SocialBanner from "@/components/SocialBanner";

const Index = () => {
  const livefootLogo = useAppLogo();
  const { isVip, user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState("all");
  const [referralBannerDismissed, setReferralBannerDismissed] = useState(false);

  const { data: apiLeagues, isLoading, isError, refetch } = useFixturesByDate(selectedDate);
  const { data: realtimeLiveLeagues, refetch: refetchRealtimeLive } = useRealtimeLiveFixtures();
  const { favorites } = useFavorites();

  const favoriteCompIds = useMemo(() => new Set(favorites?.competitions || []), [favorites?.competitions]);
  const favoriteTeamIds = useMemo(() => new Set((favorites?.teams || []).map(String)), [favorites?.teams]);
  const rankingFavorites = useMemo(() => ({
    teams: favoriteTeamIds,
    competitions: favoriteCompIds,
  }), [favoriteTeamIds, favoriteCompIds]);

  // BeSoccer-style sort: live > favorites > major competitions > team notoriety > recent events.
  const leagues = useMemo(() => {
    const liveMatches = new Map<string, any>();
    for (const league of realtimeLiveLeagues || []) {
      for (const match of league.matches || []) {
        liveMatches.set(match.id, { league, match });
      }
    }

    const rawMap = new Map<string, LeagueData>();
    for (const league of apiLeagues || []) {
      rawMap.set(league.id, {
        ...league,
        matches: league.matches.map((match) => liveMatches.get(match.id)?.match || match),
      });
    }
    for (const { league, match } of liveMatches.values()) {
      const existing = rawMap.get(league.id);
      if (existing) {
        if (!existing.matches.some((m) => m.id === match.id)) existing.matches.unshift(match);
      } else {
        rawMap.set(league.id, { ...league, matches: [match] });
      }
    }

    const raw = Array.from(rawMap.values()).map((league) => ({
      ...league,
      matches: sortMatchesWithinLeague(league.matches, league, rankingFavorites),
    }));

    return sortLeaguesByPriority(raw, rankingFavorites);
  }, [apiLeagues, realtimeLiveLeagues, rankingFavorites]);

  const matchCounts = useMemo(() => {
    let all = 0;
    let tv = 0;
    let live = 0;
    let scheduled = 0;
    let finished = 0;
    let favorite = 0;
    for (const league of leagues) {
      for (const match of league.matches) {
        all++;
        if ((match as any).isTv) tv++;
        if (isFavoriteMatch(match, league.id, rankingFavorites)) favorite++;
        if (match.status === "live") live++;
        else if (match.status === "scheduled") scheduled++;
        else if (match.status === "finished") finished++;
      }
    }
    return { all, tv, live, scheduled, finished, favorites: favorite };
  }, [leagues, rankingFavorites]);

  const filteredLeagues = useMemo(() => {
    const filtered = activeFilter === "all"
      ? leagues
      : leagues
          .map((league) => ({
            ...league,
            matches: league.matches.filter((match) => {
              if (activeFilter === "tv") return (match as any).isTv === true;
              if (activeFilter === "live") return match.status === "live";
              if (activeFilter === "scheduled") return match.status === "scheduled";
              if (activeFilter === "finished") return match.status === "finished";
              if (activeFilter === "favorites") return isFavoriteMatch(match, league.id, rankingFavorites);
              return true;
            }),
          }))
          .filter((league) => league.matches.length > 0);

    // Sort matches within each league: Live → À venir → Terminés
    return filtered.map((league) => ({
      ...league,
      matches: sortMatchesWithinLeague(league.matches, league, rankingFavorites),
    }));
  }, [activeFilter, leagues, rankingFavorites]);

  const stats = [
    { icon: Trophy, label: "Competitions", value: String(leagues.length) },
    { icon: TrendingUp, label: "Live", value: String(matchCounts.live) },
    { icon: Zap, label: "Matches", value: String(matchCounts.all) },
  ];

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
    setActiveFilter("all");
  }, []);

  const handleRefresh = useCallback(async () => {
    await Promise.allSettled([refetch(), refetchRealtimeLive()]);
  }, [refetch, refetchRealtimeLive]);

  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const { items: visibleLeagues, hasMore, isLoading: isLoadingMore, loadMoreRef } = useInfiniteScroll({
    initialItems: filteredLeagues,
    itemsPerPage: 5,
  });

  const { data: newsArticles = [] } = useFootballNews();
  const { data: topRatedPlayers, isLoading: loadingTopRated } = useCommunityTopRated("week");
  const trendingNews = newsArticles.filter((n) => n.trending).slice(0, 4);

const FOOTER_LINKS = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

const SEO_LD = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LiveFoot.fun",
    url: "https://www.livefoot.fun",
    description: "Scores de football en direct, pronostics IA gratuits (88% réussite), résultats live, classements et statistiques des meilleures ligues mondiales.",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: "https://www.livefoot.fun/search?q={search_term_string}" },
      "query-input": "required name=search_term_string",
    },
    inLanguage: ["fr", "en", "es", "de", "it", "pt"],
  },
  {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: "LiveFoot.fun",
    url: "https://www.livefoot.fun",
    sport: "Soccer",
    description: "Application de scores de football en direct avec pronostics IA gratuits couvrant plus de 800 compétitions mondiales.",
    logo: "https://www.livefoot.fun/pwa-512x512.png",
    sameAs: [
      "https://twitter.com/LiveFootApp",
      "https://instagram.com/LiveFootApp",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LiveFoot.fun",
    applicationCategory: "SportsApplication",
    operatingSystem: "iOS, Android, Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "12500",
    },
  },
];

// FAQ pour Rich Snippets
const SEO_FAQ = [
  {
    question: "Qu'est-ce que LiveFoot.fun ?",
    answer: "LiveFoot.fun est une application gratuite de scores de football en direct qui couvre plus de 800 compétitions mondiales. Elle propose des pronostics IA gratuits avec 88% de réussite, des résultats live, classements et statistiques détaillées."
  },
  {
    question: "Les pronostics LiveFoot IA sont-ils gratuits ?",
    answer: "Oui ! Tous les pronostics de l'IA LiveFoot sont 100% gratuits. Notre algorithme analyse des millions de données (H2H, forme, stats, blessures, cotes) pour vous offrir les prédictions les plus fiables sur chaque match."
  },
  {
    question: "Quelles ligues sont couvertes par LiveFoot ?",
    answer: "LiveFoot couvre toutes les principales ligues : Ligue 1, Premier League, La Liga, Serie A, Bundesliga, Ligue des Champions, Europa League, et plus de 800 compétitions dans le monde entier."
  },
  {
    question: "Comment suivre les scores en direct sur LiveFoot ?",
    answer: "Rendez-vous sur livefoot.fun pour voir tous les matchs en direct. Les scores sont mis à jour en temps réel avec les buts, cartons, remplacements et statistiques complètes."
  },
  {
    question: "LiveFoot est-il disponible en application mobile ?",
    answer: "Oui ! LiveFoot est disponible sur iOS et Android, et fonctionne aussi directement dans votre navigateur web. Installez notre PWA pour une expérience optimale."
  }
];


  return (
    <div ref={containerRef} className="min-h-screen bg-background relative pb-safe lg:pb-0">
      <SEOHead
        title="LiveFoot.fun - Scores Football en Direct, Pronos IA & Résultats Live"
        description="Suivez tous les scores de football en direct sur LiveFoot.fun. Résultats live, pronostics IA gratuits (88% réussite), classements et statistiques en temps réel pour plus de 800 compétitions mondiales."
        keywords="scores football direct, résultats foot live, pronostics foot gratuits, pronos ia football, classement ligue 1, score en direct aujourd'hui, livescore gratuit, foot en direct, match en direct, paris sportifs pronostics"
        jsonLd={SEO_LD}
        faq={SEO_FAQ}
        rating={{ value: 4.8, count: 12500 }}
      />
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        progress={progress}
      />
      
      <Header />
      <DatePicker
        selectedDate={selectedDate}
        activeFilter={activeFilter}
        onDateChange={handleDateChange}
        onFilterChange={setActiveFilter}
        matchCounts={matchCounts}
      />

      <main className="px-2 sm:container py-4 sm:py-8">
        {/* Stats bar */}
        <div className="mb-6 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-4">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="flex min-w-0 items-center gap-2 rounded-lg border border-border/50 bg-card p-2.5 shadow-sm hover-lift animate-scale-in sm:gap-3 sm:p-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20 min-[430px]:flex sm:h-12 sm:w-12">
                <stat.icon className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1 text-center min-[430px]:text-left">
                {isLoading ? (
                  <Skeleton className="h-6 w-8 mx-auto sm:mx-0" />
                ) : (
                  <p className="text-lg font-black leading-tight text-foreground sm:text-2xl">{stat.value}</p>
                )}
                <p className="truncate text-[9px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Free AI Predictions Highlight */}
        <section className="mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="group relative overflow-hidden rounded-lg border border-primary/20 bg-card shadow-sm dark:bg-gradient-to-br dark:from-[#0c1a12] dark:via-[#050f0a] dark:to-[#0c0d12]">
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
              <Zap className="h-16 w-16 sm:h-24 sm:w-24 text-primary" />
            </div>
            <div className="relative z-10 p-5 sm:p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-4">
                <Sparkles className="h-3.5 w-3.5" /> IA Expert 100% Gratuit
              </div>
              <h2 className="mb-2 text-xl font-black leading-tight text-foreground sm:text-3xl dark:text-white">
                Découvrez les Pronostics de l'IA <span className="text-primary">LiveFoot</span>
              </h2>
              <p className="mb-6 max-w-lg text-xs text-muted-foreground sm:text-sm dark:text-emerald-300/70">
                Nos modèles analysent des millions de données (H2H, forme, stats) pour vous offrir les prédictions les plus fiables sur chaque match.
              </p>
              <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-4">
                <Button asChild className="rounded-lg px-6 py-5 text-sm font-black">
                  <Link to="/daily-picks">VOIR LES PRONOS</Link>
                </Button>
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-muted overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
                    </div>
                  ))}
                  <div className="h-8 px-2 flex items-center justify-center bg-card rounded-full border-2 border-background text-[10px] font-bold text-muted-foreground">
                    +5k actifs
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Suspense fallback={null}>
          <FavoritesFeed leagues={leagues} isLoading={isLoading} />
        </Suspense>

        {/* Top Community Players Widget */}
        {(topRatedPlayers && topRatedPlayers.length > 0) && (
          <section className="mb-6 sm:mb-8">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
                <Star className="h-4 w-4 text-primary" />
                <h2 className="text-sm sm:text-base font-bold text-foreground">Top Joueurs de la Semaine</h2>
              </div>
              <Link
                to="/rankings"
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Voir tout <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-1">
              {topRatedPlayers.slice(0, 5).map((player, index) => (
                <Link
                  key={player.player_id}
                  to={`/players/${buildEntitySlug(player.player_id, player.player_name)}`}
                  className="flex-shrink-0 w-28 sm:w-32 rounded-xl bg-card border border-border/50 p-3 text-center hover-lift transition-all"
                >
                  <div className="relative mx-auto mb-2">
                    <PlayerAvatar name={player.player_name} size="sm" />
                    <span className={cn(
                      "absolute -top-1 -left-1 h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black",
                      index === 0 ? "bg-primary text-primary-foreground" :
                      index === 1 ? "bg-primary/20 text-primary" :
                      index === 2 ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-foreground truncate">{player.player_name}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="h-3 w-3 text-primary fill-primary" />
                    <span className="text-xs font-black text-primary">{player.avg_rating}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{player.total_ratings} votes</p>
                </Link>
              ))}
            </div>
          </section>
        )}


        {/* Referral banner — non-VIP uniquement */}
        {user && !isVip && !referralBannerDismissed && activeFilter === "all" && (
          <div className="relative mb-4 flex items-center gap-3 overflow-hidden rounded-lg border border-amber-500/25 bg-amber-500/10 p-4 dark:bg-gradient-to-r dark:from-amber-950/40 dark:to-[#0a0d14]">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-foreground dark:text-white">Invitez 10 amis - Obtenez 48h VIP gratuit</p>
              <p className="text-[10px] text-muted-foreground dark:text-white/50">Partagez votre lien depuis votre profil</p>
            </div>
            <Link to="/profile" className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-black text-black transition-colors hover:bg-amber-400">
              Mon lien
            </Link>
            <button onClick={() => setReferralBannerDismissed(true)} className="ml-1 shrink-0 text-lg leading-none text-muted-foreground transition-colors hover:text-foreground">×</button>
          </div>
        )}

        {/* Top Matches bloc - visible only on "all" filter */}
        {!isLoading && !isError && activeFilter === "all" && (
          <SectionErrorBoundary>
            <Suspense fallback={null}>
              <TopMatches leagues={leagues} />
            </Suspense>
          </SectionErrorBoundary>
        )}

        {/* Telegram community banner */}
        {activeFilter === "all" && (
          <div className="mb-4">
            <Suspense fallback={null}>
              <TelegramBanner variant="inline" dismissible={true} />
            </Suspense>
          </div>
        )}

        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {activeFilter === "live" ? "Matchs en Direct"
                : activeFilter === "tv" ? "Matchs Télévisés"
                : activeFilter === "finished" ? "Matchs Terminés"
                : activeFilter === "scheduled" ? "Matchs à Venir"
                : activeFilter === "favorites" ? "Matchs Favoris"
                : "Matchs du Jour"}
            </h2>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Chargement...
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {isLoading && <MatchSkeleton />}

        {/* Error state */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl bg-card border border-border/50">
            <WifiOff className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm mb-3">Impossible de charger les matchs. Veuillez réessayer.</p>
            <button
              onClick={() => refetch()}
              className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Leagues */}
        {!isLoading && !isError && (
          <div className="space-y-3 sm:space-y-4">
            {visibleLeagues.length > 0 ? (
              visibleLeagues.map((league, index) => (
                <Fragment key={league.id}>
                  <LeagueSection league={league} index={index} />
                  {/* Intercalate Top Scorers Widgets */}
                  {index === 0 && (
                    <SectionErrorBoundary>
                      <Suspense fallback={null}>
                        <TopScorersWidget leagueId="61" season="2024" title="Meilleurs Buteurs - Ligue 1" className="my-6" />
                      </Suspense>
                    </SectionErrorBoundary>
                  )}
                  {index === 1 && (
                    <SectionErrorBoundary>
                      <Suspense fallback={null}>
                        <TopScorersWidget leagueId="39" season="2024" title="Meilleurs Buteurs - Premier League" className="my-6" />
                      </Suspense>
                    </SectionErrorBoundary>
                  )}
                  {index === 2 && (
                    <SectionErrorBoundary>
                      <Suspense fallback={null}>
                        <TopScorersWidget leagueId="140" season="2024" title="Meilleurs Buteurs - La Liga" className="my-6" />
                      </Suspense>
                    </SectionErrorBoundary>
                  )}
                  {index === 3 && (
                    <SectionErrorBoundary>
                      <Suspense fallback={null}>
                        <TopScorersWidget leagueId="135" season="2024" title="Meilleurs Buteurs - Serie A" className="my-6" />
                      </Suspense>
                    </SectionErrorBoundary>
                  )}
                  {index === 4 && (
                    <SectionErrorBoundary>
                      <Suspense fallback={null}>
                        <TopScorersWidget leagueId="78" season="2024" title="Meilleurs Buteurs - Bundesliga" className="my-6" />
                      </Suspense>
                    </SectionErrorBoundary>
                  )}
                  
                  {/* Strategic Affiliate Placement Between Leagues */}
                  {index === 2 && (
                    <SectionErrorBoundary>
                      <Suspense fallback={null}>
                        <PartnerBanner partnerId="1xbet" className="my-8" />
                      </Suspense>
                    </SectionErrorBoundary>
                  )}
                  {index === 5 && (
                    <SectionErrorBoundary>
                      <Suspense fallback={null}>
                        <PartnerBanner partnerId="1win" className="my-8" />
                      </Suspense>
                    </SectionErrorBoundary>
                  )}
                </Fragment>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground text-sm">
                  {matchCounts.all === 0 ? "Aucun match programmé pour cette date." : "Aucun match trouvé pour ce filtre."}
                </p>
              </div>
            )}
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

        {/* Trending News Section */}
        {trendingNews.length > 0 && (
          <section className="mt-8 sm:mt-12">
            <div className="mb-4 sm:mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
                <Flame className="h-5 w-5 text-destructive" />
                <h2 className="text-base sm:text-lg font-bold text-foreground">Actualités Tendances</h2>
              </div>
              <Link
                to="/news"
                className="flex items-center gap-1 text-xs sm:text-sm font-medium text-primary hover:underline"
              >
                Toutes les Infos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {trendingNews.map((news, index) => (
                <Link
                  key={`${news.id}-${index}`}
                  to={`/news/${news.id}`}
                  className="group overflow-hidden rounded-lg border border-border/50 bg-card transition-all hover-lift animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative h-32 sm:h-40 overflow-hidden">
                    <img
                      src={news.image}
                      alt={news.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                    <span className="absolute bottom-2 left-2 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {news.category}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {news.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> {news.date}</span>
                      <span className="flex items-center gap-1"><Eye className="h-2.5 w-2.5" /> {news.views?.toLocaleString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Social links */}
        <section className="mt-10 mb-8 animate-scale-in">
          <div className="mb-3 flex flex-col gap-1 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-8 w-1 rounded-full bg-primary" />
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-bold text-foreground sm:text-lg">Suivre LiveFoot</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Alertes buts, pronostics, videos et discussions foot sur nos plateformes.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SocialBanner platform="whatsapp" variant="card" />
            <SocialBanner platform="tiktok" variant="card" />
            <SocialBanner platform="youtube" variant="card" />
            <SocialBanner platform="facebook" variant="card" />
          </div>
        </section>

        {/* Viral Share Section */}
        <section className="mt-12 mb-8 animate-fade-in">
          <div className="rounded-lg border border-primary/20 bg-card p-5 text-center sm:p-8">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20 sm:h-14 sm:w-14">
              <Share2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="mb-3 text-xl font-black text-foreground sm:text-2xl">Tu aimes LiveFoot ?</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
              Partage l'application avec tes amis parieurs et fans de foot pour les aider à gagner grâce à nos pronos IA !
            </p>
            <div className="max-w-sm mx-auto">
              <Suspense fallback={null}>
                <ShareWidget 
                  title="LiveFoot - Scores & Pronos IA"
                  text="Je te conseille LiveFoot pour suivre les scores en direct et avoir des pronostics IA de fou ! C'est 100% gratuit."
                  url="/"
                />
              </Suspense>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - hidden on mobile */}
      <footer className="hidden lg:block border-t border-border bg-card py-12 mt-8">
        <div className="container text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl overflow-hidden shadow-lg shadow-primary/30">
              <img
              src={livefootLogo}
              alt="LiveFoot"
              className="h-full w-full object-cover"
              loading="eager"
            />
            </div>
            <span className="text-2xl font-black text-foreground tracking-tight">LIVEFOOT</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Votre destination ultime pour les scores en direct, résultats, calendriers, classements, statistiques et actualités football.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 flex-wrap">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} LiveFoot. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
