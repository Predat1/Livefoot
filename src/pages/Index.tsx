import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import DatePicker from "@/components/DatePicker";
import LeagueSection from "@/components/LeagueSection";
import PullToRefreshIndicator from "@/components/PullToRefresh";
import InfiniteScrollLoader from "@/components/InfiniteScrollLoader";
import { mockNews } from "@/data/newsData";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useFixturesByDate } from "@/hooks/useApiFootball";
import { Trophy, TrendingUp, Zap, ArrowRight, Calendar, Eye, Flame, Loader2, WifiOff } from "lucide-react";
import livefootLogo from "@/assets/livefoot-logo.png";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: apiLeagues, isLoading, isError, refetch } = useFixturesByDate(selectedDate);

  const leagues = apiLeagues || [];

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
    { icon: Trophy, label: "Competitions", value: String(leagues.length) },
    { icon: TrendingUp, label: "Live", value: String(matchCounts.live) },
    { icon: Zap, label: "Matches", value: String(matchCounts.all) },
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

  const trendingNews = mockNews.filter((n) => n.trending).slice(0, 4);

  const footerLinks = [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background relative">
      <SEOHead
        title="LiveFoot - Live Football Scores Today"
        description="Follow all today's live football scores, results, fixtures and tables from Premier League, La Liga, Serie A, Bundesliga and more."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "LiveFoot",
          url: "https://livefoot.app",
          description: "Live football scores, results, fixtures, tables, statistics and football news.",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://livefoot.app/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
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
        onDateChange={setSelectedDate}
        onFilterChange={setActiveFilter}
        matchCounts={matchCounts}
      />

      <main className="container py-4 sm:py-8">
        {/* Stats bar */}
        <div className="mb-6 sm:mb-8 grid grid-cols-3 gap-2 sm:gap-4">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 rounded-xl sm:rounded-2xl bg-card p-3 sm:p-4 shadow-sm border border-border/50 hover-lift animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl gradient-primary shadow-lg shadow-primary/20">
                <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div className="text-center sm:text-left">
                {isLoading ? (
                  <Skeleton className="h-6 w-8 mx-auto sm:mx-0" />
                ) : (
                  <p className="text-lg sm:text-2xl font-black text-foreground">{stat.value}</p>
                )}
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Section Header */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {activeFilter === "live" ? "Live Matches" : activeFilter === "tv" ? "Televised Matches" : "Today's Matches"}
            </h2>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading...
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="px-4 py-3 bg-league-header flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-5 w-32" />
                </div>
                {[1, 2].map((j) => (
                  <div key={j} className="flex items-center justify-between px-5 py-5 border-b border-border/50">
                    <div className="flex flex-1 items-center justify-end gap-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                    <div className="mx-6">
                      <Skeleton className="h-8 w-20 rounded-lg" />
                    </div>
                    <div className="flex flex-1 items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl bg-card border border-border/50">
            <WifiOff className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm mb-3">Unable to load matches. Please try again.</p>
            <button
              onClick={() => refetch()}
              className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Retry
            </button>
          </div>
        )}

        {/* Leagues */}
        {!isLoading && !isError && (
          <div className="space-y-3 sm:space-y-4">
            {visibleLeagues.length > 0 ? (
              visibleLeagues.map((league, index) => (
                <LeagueSection key={league.id} league={league} index={index} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground text-sm">
                  {matchCounts.all === 0 ? "No matches scheduled for this date." : "No matches found for this filter."}
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
                <h2 className="text-base sm:text-lg font-bold text-foreground">Trending News</h2>
              </div>
              <Link
                to="/news"
                className="flex items-center gap-1 text-xs sm:text-sm font-medium text-primary hover:underline"
              >
                All News <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {trendingNews.map((news, index) => (
                <Link
                  key={news.id}
                  to={`/news/${news.id}`}
                  className="group rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden hover-lift transition-all animate-fade-in"
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
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 sm:py-12 mt-6 sm:mt-8">
        <div className="container text-center">
          <div className="mb-4 sm:mb-6 flex items-center justify-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl overflow-hidden shadow-lg shadow-primary/30">
              <img src={livefootLogo} alt="LiveFoot logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight">LIVEFOOT</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto px-4">
            Your ultimate destination for live scores, results, fixtures, tables, statistics and football news.
          </p>
          <div className="mt-4 sm:mt-6 flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p className="mt-6 sm:mt-8 text-[10px] sm:text-xs text-muted-foreground/60">
            © 2024 LiveFoot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
