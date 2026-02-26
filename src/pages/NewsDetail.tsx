import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { useFootballNews } from "@/hooks/useFootballNews";
import { ArrowLeft, Calendar, Clock, User, ExternalLink, Flame, Loader2 } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const NewsDetail = () => {
  const { newsId } = useParams();
  const { data: articles = [], isLoading } = useFootballNews();

  const article = articles.find((n) => n.id === newsId);
  const relatedArticles = articles
    .filter((n) => n.id !== newsId)
    .filter((n) => article ? n.category === article.category : true)
    .slice(0, 3);

  if (isLoading) {
    return (
      <Layout>
        <SEOHead title="Loading..." />
        <div className="container py-8 max-w-4xl space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <SEOHead title="Article not found" />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Article not found</h1>
          <Link to="/news" className="text-primary hover:underline">Back to news</Link>
        </div>
      </Layout>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    image: article.image,
    author: { "@type": "Person", name: article.author },
    datePublished: article.date,
    publisher: {
      "@type": "Organization",
      name: "LiveFoot",
    },
  };

  return (
    <Layout>
      <SEOHead
        title={`${article.title} | LiveFoot News`}
        description={article.summary}
        ogImage={article.image}
        jsonLd={jsonLd}
      />
      <article className="container py-4 sm:py-8 max-w-4xl">
        <Link
          to="/news"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to news
        </Link>

        {/* Hero Image */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl mb-6">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-48 sm:h-72 md:h-96 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=400&fit=crop";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">{article.category}</Badge>
            {article.trending && (
              <Badge className="bg-destructive text-destructive-foreground">
                <Flame className="h-3 w-3 mr-1" /> Trending
              </Badge>
            )}
          </div>
        </div>

        {/* Article Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-black text-foreground mb-4 leading-tight">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" /> {article.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> {article.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {article.readTime}
            </span>
            <span className="flex items-center gap-1.5 text-primary">
              <ExternalLink className="h-4 w-4" /> {article.source}
            </span>
          </div>
        </header>

        {/* Article Body */}
        <div className="rounded-2xl bg-card border border-border/50 p-5 sm:p-8 mb-8">
          <p className="text-base sm:text-lg font-medium text-foreground mb-6 leading-relaxed border-l-4 border-primary pl-4 italic">
            {article.summary}
          </p>
          <div className="prose prose-sm sm:prose-base max-w-none text-foreground/90 leading-relaxed space-y-4">
            <p>{article.content}</p>
          </div>

          {/* Read full article link */}
          {article.link && (
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="h-4 w-4" />
              Read full article on {article.source}
            </a>
          )}

          {/* Share */}
          <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Share this article</span>
            <ShareButton title={article.title} text={article.summary} url={`/news/${article.id}`} />
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-1 rounded-full gradient-primary" />
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Related Articles</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {relatedArticles.map((news, idx) => (
                <Link
                  key={`${news.id}-${idx}`}
                  to={`/news/${news.id}`}
                  className="group rounded-xl bg-card border border-border/50 overflow-hidden hover-lift transition-all"
                >
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={news.image}
                      alt={news.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=400&fit=crop";
                      }}
                    />
                    <span className="absolute bottom-2 left-2 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {news.category}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {news.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span>{news.date}</span>
                      <span className="text-primary/70">{news.source}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </Layout>
  );
};

export default NewsDetail;
