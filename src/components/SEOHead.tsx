import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

interface SEOHeadProps {
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
  };
}

const SITE_URL = "https://livefoot.app";
const DEFAULT_OG_IMAGE = "https://livefoot.app/pwa-512x512.png";

const SEOHead = ({
  title,
  description,
  ogImage,
  canonical,
  jsonLd,
  keywords,
  noIndex,
  articleMeta,
}: SEOHeadProps) => {
  const location = useLocation();
  const fullTitle = title.includes("LiveFoot") ? title : `${title} | LiveFoot`;
  const defaultDescription =
    "LiveFoot — Scores de football en direct, résultats, calendriers, classements et statistiques des meilleures ligues mondiales : Premier League, La Liga, Serie A, Bundesliga, Ligue 1.";
  const desc = description || defaultDescription;
  const canonicalUrl = canonical || `${SITE_URL}${location.pathname}`;
  const image = ogImage || DEFAULT_OG_IMAGE;

  // Combine multiple JSON-LD schemas
  const jsonLdArray = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd
      : [jsonLd]
    : [];

  // Always include Organization schema on homepage
  const isHome = location.pathname === "/";

  return (
    <Helmet>
      {/* Primary Meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Hreflang for multilingual SEO signals */}
      <link rel="alternate" hrefLang="fr" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={articleMeta ? "article" : "website"} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content="LiveFoot" />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:locale:alternate" content="en_US" />

      {/* Article meta */}
      {articleMeta?.publishedTime && (
        <meta property="article:published_time" content={articleMeta.publishedTime} />
      )}
      {articleMeta?.modifiedTime && (
        <meta property="article:modified_time" content={articleMeta.modifiedTime} />
      )}
      {articleMeta?.author && <meta property="article:author" content={articleMeta.author} />}
      {articleMeta?.section && <meta property="article:section" content={articleMeta.section} />}

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

      {/* Organization schema on all pages */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "LiveFoot",
          url: SITE_URL,
          logo: `${SITE_URL}/pwa-512x512.png`,
          sameAs: [
            "https://twitter.com/LiveFootApp",
            "https://instagram.com/LiveFootApp",
          ],
        })}
      </script>

      {/* BreadcrumbList for non-home pages */}
      {!isHome && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
              {
                "@type": "ListItem",
                position: 2,
                name: title.replace(" | LiveFoot", ""),
                item: canonicalUrl,
              },
            ],
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
