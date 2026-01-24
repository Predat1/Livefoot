import { useState, useCallback } from "react";
import Header from "@/components/Header";
import DatePicker from "@/components/DatePicker";
import LeagueSection from "@/components/LeagueSection";
import PullToRefreshIndicator from "@/components/PullToRefresh";
import InfiniteScrollLoader from "@/components/InfiniteScrollLoader";
import { mockLeagues } from "@/data/mockData";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { Trophy, TrendingUp, Zap } from "lucide-react";

const Index = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const stats = [
    { icon: Trophy, label: "Competitions", value: "156" },
    { icon: TrendingUp, label: "Live", value: "12" },
    { icon: Zap, label: "Goals", value: "87" },
  ];

  const handleRefresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshKey((prev) => prev + 1);
  }, []);

  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const { items: visibleLeagues, hasMore, isLoading, loadMoreRef } = useInfiniteScroll({
    initialItems: mockLeagues,
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
      <DatePicker />

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
            <h2 className="text-base sm:text-lg font-bold text-foreground">Today's Matches</h2>
          </div>
          <button className="flex items-center gap-2 rounded-lg sm:rounded-xl bg-muted/50 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-300">
            View All
          </button>
        </div>

        {/* Leagues */}
        <div className="space-y-3 sm:space-y-4">
          {visibleLeagues.map((league, index) => (
            <LeagueSection key={league.id} league={league} index={index} />
          ))}
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
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl gradient-primary shadow-lg shadow-primary/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-7 sm:w-7 fill-primary-foreground">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                <polygon points="12,6 13.5,10 18,10 14.5,13 16,18 12,15 8,18 9.5,13 6,10 10.5,10" fill="currentColor" />
              </svg>
            </div>
            <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight">BESOCCER</span>
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
            © 2024 BeSoccer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
