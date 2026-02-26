import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { useFootballNews, useNewsCategories } from "@/hooks/useFootballNews";
import { Clock, Calendar, ArrowRight, TrendingUp, Eye, User, Search, Flame, Loader2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const NEWS_SOURCES = ["All", "ESPN", "BBC Sport", "GOAL", "Sky Sports", "L'Équipe", "Marca", "Football Italia", "Sport Bild"];

const News = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSource, setActiveSource] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: articles = [], isLoading, isError } = useFootballNews();
  const categories = useNewsCategories(articles);

  const filteredNews = articles
    .filter(news => activeCategory === "All" || news.category === activeCategory)
    .filter(news => activeSource === "All" || news.source === activeSource)
    .filter(news =>
      news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      news.summary.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const trendingNews = articles.filter(news => news.trending);

  // Get available sources from actual data
  const availableSources = ["All", ...new Set(articles.map(a => a.source))];

  return (
    <Layout>
      <SEOHead
        title="Football News - Latest Headlines"
        description="Stay updated with the latest football news, transfer rumours, match reports and analysis from around the world."
      />
      <div className="container py-4 sm:py-8">
        {/* Hero Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
            <h1 className="text-xl sm:text-3xl font-black text-foreground">Football News</h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground ml-3 sm:ml-4">Stay updated with the latest football news</p>
        </div>

        {/* Search */}
        <div className="mb-4 sm:mb-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-lg sm:rounded-xl border-border/50 bg-card text-sm"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-24 rounded-full flex-shrink-0" />)}
            </div>
            <Skeleton className="h-64 rounded-2xl" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)}
            </div>
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="text-center py-12 rounded-2xl bg-card border border-border/50">
            <p className="text-muted-foreground text-sm">Unable to load news. Please try again later.</p>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {/* Trending Bar */}
            <div className="mb-6 sm:mb-8 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-2 sm:gap-3 min-w-max">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-destructive/10 text-destructive">
                  <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm font-bold">Trending</span>
                </div>
                {trendingNews.slice(0, 4).map((news, index) => (
                  <Link
                    key={news.id}
                    to={`/news/${news.id}`}
                    className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <span className="text-[10px] sm:text-xs font-bold text-primary">#{index + 1}</span>
                    <span className="text-[10px] sm:text-xs text-foreground line-clamp-1 max-w-[120px] sm:max-w-[200px] group-hover:text-primary transition-colors">
                      {news.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6 sm:mb-8 flex flex-wrap items-center gap-1.5 sm:gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300",
                    activeCategory === category
                      ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Source Filter */}
            <div className="mb-6 sm:mb-8">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">Source</p>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {availableSources.map((source) => (
                  <button
                    key={source}
                    onClick={() => setActiveSource(source)}
                    className={cn(
                      "rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold transition-all duration-300 border",
                      activeSource === source
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border/50 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    )}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Article */}
            {filteredNews.length > 0 && (
              <Link to={`/news/${filteredNews[0].id}`} className="mb-6 sm:mb-8 group block">
                <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-card shadow-lg hover-lift">
                  <div className="grid md:grid-cols-2">
                    <div className="relative h-48 sm:h-64 md:h-auto overflow-hidden">
                      <img
                        src={filteredNews[0].image}
                        alt={filteredNews[0].title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=400&fit=crop";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-card/80 to-transparent md:hidden" />
                      {filteredNews[0].trending && (
                        <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">
                          <Flame className="h-3 w-3 mr-1" /> Hot
                        </Badge>
                      )}
                    </div>
                    <div className="p-4 sm:p-6 md:p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2 sm:mb-4 flex-wrap">
                        <span className="rounded-full bg-primary/10 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-primary">
                          {filteredNews[0].category}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                          <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Featured
                        </span>
                        <span className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                          <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {filteredNews[0].source}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-2 sm:mb-3 group-hover:text-primary transition-colors">
                        {filteredNews[0].title}
                      </h2>
                      <p className="text-xs sm:text-base text-muted-foreground mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-none">{filteredNews[0].summary}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3 sm:h-4 sm:w-4" /> {filteredNews[0].author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" /> {filteredNews[0].date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" /> {filteredNews[0].readTime}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* News Grid */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredNews.slice(1).map((news, index) => (
                <Link
                  key={news.id}
                  to={`/news/${news.id}`}
                  className="group block overflow-hidden rounded-xl sm:rounded-2xl bg-card shadow-sm border border-border/50 hover-lift animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative h-36 sm:h-48 overflow-hidden">
                    <img
                      src={news.image}
                      alt={news.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=400&fit=crop";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                    <span className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 rounded-full bg-primary/90 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-primary-foreground">
                      {news.category}
                    </span>
                    {news.trending && (
                      <Badge className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground text-[10px]">
                        <Flame className="h-2.5 w-2.5 mr-0.5" /> Hot
                      </Badge>
                    )}
                  </div>
                  <div className="p-3 sm:p-5">
                    <h3 className="text-sm sm:text-base font-bold text-foreground mb-1.5 sm:mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {news.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
                      {news.summary}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {news.date}
                        </span>
                        <span className="flex items-center gap-1 text-primary/70">
                          <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {news.source}
                        </span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredNews.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No news found matching your search.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default News;
