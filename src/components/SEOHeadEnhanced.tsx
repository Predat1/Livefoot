import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

interface FAQItem {
  question: string;
  answer: string;
}

interface SEOHeadEnhancedProps {
  title: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  keywords?: string;
  noIndex?: boolean;
  articleMeta?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  faq?: FAQItem[];
  breadcrumbs?: { name: string; url: string }[];
  rating?: {
    value: number;
    count: number;
  };
  matchData?: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    date: string;
    status?: "scheduled" | "live" | "finished";
  };
}

const SITE_URL = "https://livefoot.fun";
const DEFAULT_OG_IMAGE = "https://livefoot.fun/og-image.png";
const LOGO_URL = "https://livefoot.fun/pwa-512x512.png";

// Generate FAQ Schema
const generateFAQSchema = (faq: FAQItem[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
});

// Generate SportsEvent Schema for matches
const generateMatchSchema = (match: NonNullable<SEOHeadEnhancedProps["matchData"]>) => ({
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  name: `${match.homeTeam} vs ${match.awayTeam}`,
  description: `Match de football: ${match.homeTeam} contre ${match.awayTeam} en ${match.league}`,
  startDate: match.date,
  eventStatus: match.status === "live" 
    ? "https://schema.org/EventScheduled" 
    : match.status === "finished" 
    ? "https://schema.org/EventScheduled" 
    : "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
  sport: "Soccer",
  competitor: [
    {
      "@type": "SportsTeam",
      name: match.homeTeam,
    },
    {
      "@type": "SportsTeam",
      name: match.awayTeam,
    },
  ],
  organizer: {
    "@type": "Organization",
    name: match.league,
  },
});

// Generate BreadcrumbList Schema
const generateBreadcrumbSchema = (items: { name: string; url: string }[], siteUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`,
  })),
});

// Generate AggregateRating Schema
const generateRatingSchema = (rating: { value: number; count: number }) => ({
  "@context": "https://schema.org",
  "@type": "AggregateRating",
  ratingValue: rating.value,
  bestRating: 5,
  worstRating: 1,
  ratingCount: rating.count,
  reviewCount: rating.count,
});

const SEOHeadEnhanced = ({
  title,
  description,
  ogImage,
  canonical,
  jsonLd,
  keywords,
  noIndex,
  articleMeta,
  faq,
  breadcrumbs,
  rating,
  matchData,
}: SEOHeadEnhancedProps) => {
  const location = useLocation();
  const fullTitle = title.includes("LiveFoot") ? title : `${title} | LiveFoot.fun`;
  const defaultDescription =
    "LiveFoot.fun — Scores de football en direct, pronostics IA gratuits (88% réussite), résultats live, classements et statistiques des meilleures ligues mondiales : Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Ligue des Champions.";
  const desc = description || defaultDescription;
  const canonicalUrl = canonical || `${SITE_URL}${location.pathname}${location.search}`;
  const image = ogImage || DEFAULT_OG_IMAGE;

  // Combine multiple JSON-LD schemas
  const jsonLdArray: Record<string, unknown>[] = [];

  // Add custom JSON-LD if provided
  if (jsonLd) {
    if (Array.isArray(jsonLd)) {
      jsonLdArray.push(...jsonLd);
    } else {
      jsonLdArray.push(jsonLd);
    }
  }

  // Add Match schema if match data provided
  if (matchData) {
    jsonLdArray.push(generateMatchSchema(matchData));
  }

  // Add FAQ schema if provided
  if (faq && faq.length > 0) {
    jsonLdArray.push(generateFAQSchema(faq));
  }

  // Add Rating schema if provided
  if (rating) {
    jsonLdArray.push(generateRatingSchema(rating));
  }

  // Add Breadcrumb schema if provided, otherwise add default for non-home pages
  if (breadcrumbs && breadcrumbs.length > 0) {
    jsonLdArray.push(generateBreadcrumbSchema(breadcrumbs, SITE_URL));
  } else if (location.pathname !== "/") {
    jsonLdArray.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: title.replace(" | LiveFoot.fun", ""),
          item: canonicalUrl,
        },
      ],
    });
  }

  // Add Article/Analysis schema for match pages with predictions
  if (title.toLowerCase().includes("vs") && !noIndex) {
    jsonLdArray.push({
      "@context": "https://schema.org",
      "@type": "AnalysisNewsArticle",
      headline: `Analyse et Pronostic IA : ${title}`,
      description: desc,
      author: {
        "@type": "Organization",
        name: "LiveFoot AI Oracle",
        url: SITE_URL,
      },
      publisher: {
        "@type": "Organization",
        name: "LiveFoot.fun",
        logo: {
          "@type": "ImageObject",
          url: LOGO_URL,
        },
      },
      datePublished: articleMeta?.publishedTime || new Date().toISOString(),
      image: image,
    });
  }

  // Always include Organization schema
  jsonLdArray.push({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LiveFoot.fun",
    url: SITE_URL,
    logo: LOGO_URL,
    sameAs: [
      "https://twitter.com/LiveFootApp",
      "https://instagram.com/LiveFootApp",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${SITE_URL}/contact`,
    },
  });

  const isHome = location.pathname === "/";

  return (
    <Helmet>
      {/* Primary Meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noIndex ? (
        <meta name="robots" content="noindex,nofollow" />
      ) : (
        <>
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
          <meta name="googlebot" content="index, follow" />
        </>
      )}
      <link rel="canonical" href={canonicalUrl} />

      {/* Hreflang for multilingual SEO signals */}
      <link rel="alternate" hrefLang="fr" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="es" href={canonicalUrl} />
      <link rel="alternate" hrefLang="de" href={canonicalUrl} />
      <link rel="alternate" hrefLang="it" href={canonicalUrl} />
      <link rel="alternate" hrefLang="pt" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={articleMeta ? "article" : matchData ? "sports_event" : "website"} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content="LiveFoot.fun" />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:locale:alternate" content="en_US" />
      <meta property="og:locale:alternate" content="es_ES" />
      <meta property="og:locale:alternate" content="de_DE" />
      <meta property="og:locale:alternate" content="it_IT" />

      {/* Article meta */}
      {articleMeta?.publishedTime && (
        <meta property="article:published_time" content={articleMeta.publishedTime} />
      )}
      {articleMeta?.modifiedTime && (
        <meta property="article:modified_time" content={articleMeta.modifiedTime} />
      )}
      {articleMeta?.author && <meta property="article:author" content={articleMeta.author} />}
      {articleMeta?.section && <meta property="article:section" content={articleMeta.section} />}
      {articleMeta?.tags?.map((tag, i) => (
        <meta key={i} property="article:tag" content={tag} />
      ))}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@LiveFootApp" />
      <meta name="twitter:creator" content="@LiveFootApp" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={fullTitle} />

      {/* JSON-LD Structured Data */}
      {jsonLdArray.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}

      {/* Sports App schema on homepage */}
      {isHome && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsActivityLocation",
            name: "LiveFoot.fun",
            description: "Application de scores de football en direct avec pronostics IA",
            url: SITE_URL,
            sport: "Soccer",
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHeadEnhanced;
export { generateFAQSchema, generateBreadcrumbSchema };
