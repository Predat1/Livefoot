import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import DatePicker from "@/components/DatePicker";
import LeagueSection from "@/components/LeagueSection";
import PullToRefreshIndicator from "@/components/PullToRefresh";
import InfiniteScrollLoader from "@/components/InfiniteScrollLoader";
import { mockLeagues } from "@/data/mockData";
import { mockNews } from "@/data/newsData";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { Trophy, TrendingUp, Zap, ArrowRight, Calendar, Eye, Flame, Activity, Target, ChevronRight } from "lucide-react";
import livefootLogo from "@/assets/livefoot-logo.png";

const Index = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState("all");

  const matchCounts = useMemo(() => {
    let all = 0;
    let tv = 0;
    let live = 0;
    for (const league of mockLeagues) {
      for (const match of league.matches) {
        all++;
        if ((match as any).isTv) tv++;
        if (match.status === "live") live++;
      }
    }
    return { all, tv, live };
  }, []);

  const filteredLeagues = useMemo(() => {
    if (activeFilter === "all") return mockLeagues;
    return mockLeagues
      .map((league) => ({
        ...league,
        matches: league.matches.filter((match) => {
          if (activeFilter === "tv") return (match as any).isTv === true;
          if (activeFilter === "live") return match.status === "live";
          return true;
        }),
      }))
      .filter((league) => league.matches.length > 0);
  }, [activeFilter]);

  const stats = [
    { icon: Trophy, label: "Leagues", value: String(mockLeagues.length), color: "primary" as const },
    { icon: Activity, label: "Live Now", value: String(matchCounts.live), color: "live" as const },
    { icon: Target, label: "Total Matches", value: String(matchCounts.all), color: "primary" as const },
    { icon: Zap, label: "Goals Today", value: String(mockLeagues.reduce((acc, l) => acc + l.matches.reduce((a, m) => a + ((m as any).events?.filter((e: any) => e.type === "goal").length ?? 0), 0), 0)), color: "primary" as const },
  ];

  const handleRefresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshKey((prev) => prev + 1);
  }, []);

  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const { items: visibleLeagues, hasMore, isLoading, loadMoreRef } = useInfiniteScroll({
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
    <div ref={containerRef} className="min-h-screen bg-background relative" key={refreshKey}>
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

      {/* Hero Banner */}
      <section className="hero-gradient relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-primary/5 blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="container relative py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[11px] font-bold text-primary uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  {matchCounts.live > 0 ? `${matchCounts.live} Live Now` : 'Football Scores'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
                Today's <span className="text-gradient">Football</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md">
                {matchCounts.all} matches across {mockLeagues.length} competitions. All scores updated in real-time.
              </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full sm:w-auto">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="stat-card-glow group flex flex-col items-center gap-1.5 rounded-2xl bg-card/80 backdrop-blur-sm p-3 sm:p-4 border border-border/50 hover-lift animate-scale-in cursor-default"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl ${
                    stat.color === 'live' ? 'bg-live/10' : 'gradient-primary shadow-lg shadow-primary/20'
                  } transition-transform duration-300 group-hover:scale-110`}>
                    <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      stat.color === 'live' ? 'text-live' : 'text-primary-foreground'
                    }`} />
                  </div>
                  <span className={`text-xl sm:text-2xl font-black ${
                    stat.color === 'live' && matchCounts.live > 0 ? 'text-live' : 'text-foreground'
                  }`}>
                    {stat.value}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <DatePicker
        selectedDate={selectedDate}
        activeFilter={activeFilter}
        onDateChange={setSelectedDate}
        onFilterChange={setActiveFilter}
        matchCounts={matchCounts}
      />

      <main className="container py-5 sm:py-8">
        {/* Section Header */}
        <div className="mb-5 sm:mb-7 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="h-7 sm:h-9 w-1.5 rounded-full gradient-primary" />
            <div>
              <h2 className="text-base sm:text-xl font-black text-foreground tracking-tight">
                {activeFilter === "live" ? "Live Matches" : activeFilter === "tv" ? "Televised" : "All Matches"}
              </h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-0.5">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          <Link
            to="/live"
            className="flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-primary hover:bg-primary/20 transition-all duration-300 group"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Live</span>
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Leagues */}
        <div className="space-y-3 sm:space-y-4">
          {visibleLeagues.length > 0 ? (
            visibleLeagues.map((league, index) => (
              <LeagueSection key={league.id} league={league} index={index} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl bg-card border border-border/50">
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                <Trophy className="h-8 w-8 text-primary-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">No matches found</p>
              <p className="text-xs text-muted-foreground">Try a different filter or date.</p>
            </div>
          )}
        </div>

        <InfiniteScrollLoader ref={loadMoreRef} isLoading={isLoading} hasMore={hasMore} />

        {/* Trending News Section */}
        {trendingNews.length > 0 && (
          <section className="mt-10 sm:mt-14">
            <div className="mb-5 sm:mb-7 flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="h-7 sm:h-9 w-1.5 rounded-full bg-destructive" />
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-destructive" />
                  <h2 className="text-base sm:text-xl font-black text-foreground tracking-tight">Trending</h2>
                </div>
              </div>
              <Link
                to="/news"
                className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:underline underline-offset-4 group"
              >
                All News
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Featured news (first item large) */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-12">
              {trendingNews.map((news, index) => (
                <Link
                  key={news.id}
                  to={`/news/${news.id}`}
                  className={`group overflow-hidden rounded-2xl bg-card border border-border/50 hover-lift card-shine transition-all animate-fade-in ${
                    index === 0 ? 'lg:col-span-6 lg:row-span-2' : 'lg:col-span-3'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`relative overflow-hidden ${index === 0 ? 'h-44 sm:h-full min-h-[200px] lg:min-h-[320px]' : 'h-36 sm:h-40'}`}>
                    <img
                      src={news.image}
                      alt={news.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="inline-block rounded-full gradient-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground uppercase tracking-wider shadow-lg shadow-primary/30 mb-2">
                        {news.category}
                      </span>
                      <h3 className={`font-black text-foreground group-hover:text-primary transition-colors leading-snug ${
                        index === 0 ? 'text-base sm:text-lg lg:text-xl line-clamp-3' : 'text-xs sm:text-sm line-clamp-2'
                      }`}>
                        {news.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-[10px] sm:text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> {news.date}</span>
                        <span className="flex items-center gap-1"><Eye className="h-2.5 w-2.5" /> {news.views?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-8 sm:mt-12">
        <div className="container py-10 sm:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-start">
            {/* Brand */}
            <div className="flex flex-col items-center sm:items-start gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-primary/20">
                  <img src={livefootLogo} alt="LiveFoot logo" className="h-full w-full object-cover" />
                </div>
                <span className="text-xl font-black text-foreground tracking-tight">LIVEFOOT</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-xs text-center sm:text-left leading-relaxed">
                Your ultimate destination for live scores, results, fixtures, tables, statistics and football news.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-foreground uppercase tracking-widest mb-1">Links</span>
              {footerLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Install CTA */}
            <div className="flex flex-col items-center sm:items-end gap-3">
              <span className="text-xs font-bold text-foreground uppercase tracking-widest">Get the App</span>
              <Link
                to="/install"
                className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
              >
                <Zap className="h-4 w-4" />
                Install PWA
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground/60">
              © {new Date().getFullYear()} LiveFoot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
