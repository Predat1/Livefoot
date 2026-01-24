import { useState } from "react";
import Layout from "@/components/Layout";
import { mockNews, newsCategories } from "@/data/newsData";
import { Clock, Calendar, ArrowRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const News = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredNews = activeCategory === "All" 
    ? mockNews 
    : mockNews.filter(news => news.category === activeCategory);

  return (
    <Layout>
      <div className="container py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 rounded-full gradient-primary" />
            <h1 className="text-3xl font-black text-foreground">Football News</h1>
          </div>
          <p className="text-muted-foreground ml-4">Stay updated with the latest football news from around the world</p>
        </div>

        {/* Categories */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {newsCategories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                activeCategory === category
                  ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Featured Article */}
        {filteredNews.length > 0 && (
          <div className="mb-8 group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-card shadow-lg hover-lift">
              <div className="grid md:grid-cols-2">
                <div className="relative h-64 md:h-auto overflow-hidden">
                  <img
                    src={filteredNews[0].image}
                    alt={filteredNews[0].title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-card/80 to-transparent md:hidden" />
                </div>
                <div className="p-6 md:p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      {filteredNews[0].category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" /> Featured
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {filteredNews[0].title}
                  </h2>
                  <p className="text-muted-foreground mb-4">{filteredNews[0].summary}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> {filteredNews[0].date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" /> {filteredNews[0].readTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* News Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNews.slice(1).map((news, index) => (
            <article
              key={news.id}
              className="group cursor-pointer overflow-hidden rounded-2xl bg-card shadow-sm border border-border/50 hover-lift animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={news.image}
                  alt={news.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                <span className="absolute bottom-3 left-3 rounded-full bg-primary/90 px-3 py-1 text-xs font-bold text-primary-foreground">
                  {news.category}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {news.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {news.summary}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {news.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {news.readTime}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default News;
