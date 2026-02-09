import { useState, useCallback, useMemo } from "react";
import Header from "@/components/Header";
import DatePicker from "@/components/DatePicker";
import LeagueSection from "@/components/LeagueSection";
import PullToRefreshIndicator from "@/components/PullToRefresh";
import InfiniteScrollLoader from "@/components/InfiniteScrollLoader";
import { mockLeagues } from "@/data/mockData";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { Trophy, TrendingUp, Zap } from "lucide-react";
import livefootLogo from "@/assets/livefoot-logo.png";

const Index = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState("all");

  // Compute match counts from all leagues
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

  // Filter leagues based on active filter
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
    { icon: Trophy, label: "Competitions", value: String(mockLeagues.length) },
    { icon: TrendingUp, label: "Live", value: String(matchCounts.live) },
    { icon: Zap, label: "Goals", value: String(mockLeagues.reduce((acc, l) => acc + l.matches.reduce((a, m) => a + ((m as any).events?.filter((e: any) => e.type === "goal").length ?? 0), 0), 0)) },
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

  return (
    <div ref={containerRef} className="min-h-screen bg-background relative" key={refreshKey}>
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
                <p className="text-lg sm:text-2xl font-black text-foreground">{stat.value}</p>
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
          <button className="flex items-center gap-2 rounded-lg sm:rounded-xl bg-muted/50 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-300">
            View All
          </button>
        </div>

        {/* Leagues */}
        <div className="space-y-3 sm:space-y-4">
          {visibleLeagues.length > 0 ? (
            visibleLeagues.map((league, index) => (
              <LeagueSection key={league.id} league={league} index={index} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground text-sm">No matches found for this filter.</p>
            </div>
          )}
        </div>

        {/* Infinite Scroll Loader */}
        <InfiniteScrollLoader
          ref={loadMoreRef}
          isLoading={isLoading}
          hasMore={hasMore}
        />
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
            {["About", "Contact", "Privacy", "Terms"].map((link) => (
              <a 
                key={link}
                href="#" 
                className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link}
              </a>
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
