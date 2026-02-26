const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// RSS feed sources for football news
const RSS_FEEDS = [
  {
    url: "https://www.espn.com/espn/rss/soccer/news",
    source: "ESPN",
    category: "News",
  },
  {
    url: "https://feeds.bbci.co.uk/sport/football/rss.xml",
    source: "BBC Sport",
    category: "News",
  },
  {
    url: "https://www.goal.com/feeds/en/news",
    source: "GOAL",
    category: "News",
  },
];

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  image: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  source: string;
  link: string;
  views: number;
  trending: boolean;
}

// Simple XML tag extractor (no external deps needed)
function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

function extractAllItems(xml: string): string[] {
  const items: string[] = [];
  const regex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    items.push(match[0]);
  }
  return items;
}

function extractImageFromItem(itemXml: string): string {
  // Try media:content
  const mediaMatch = itemXml.match(/url="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp|gif)[^"]*)"/i);
  if (mediaMatch) return mediaMatch[1];

  // Try enclosure
  const enclosureMatch = itemXml.match(/<enclosure[^>]+url="(https?:\/\/[^"]+)"/i);
  if (enclosureMatch) return enclosureMatch[1];

  // Try image in description/content
  const imgMatch = itemXml.match(/<img[^>]+src="(https?:\/\/[^"]+)"/i);
  if (imgMatch) return imgMatch[1];

  // Fallback
  return "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=400&fit=crop";
}

function estimateReadTime(text: string): string {
  const words = text.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min`;
}

function categorizeArticle(title: string, content: string): string {
  const text = (title + " " + content).toLowerCase();
  if (text.includes("premier league") || text.includes("epl")) return "Premier League";
  if (text.includes("la liga") || text.includes("laliga")) return "La Liga";
  if (text.includes("serie a")) return "Serie A";
  if (text.includes("bundesliga")) return "Bundesliga";
  if (text.includes("ligue 1")) return "Ligue 1";
  if (text.includes("champions league") || text.includes("ucl")) return "Champions League";
  if (text.includes("transfer") || text.includes("sign") || text.includes("deal")) return "Transfers";
  if (text.includes("world cup") || text.includes("euro 20")) return "International";
  return "News";
}

// In-memory cache
let cachedNews: NewsArticle[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function fetchAndParseFeeds(): Promise<NewsArticle[]> {
  const now = Date.now();
  if (cachedNews && now < cacheExpiry) {
    return cachedNews;
  }

  const allArticles: NewsArticle[] = [];

  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, {
          headers: { "User-Agent": "LiveFoot/1.0 RSS Reader" },
        });
        if (!res.ok) return [];
        
        const xml = await res.text();
        const items = extractAllItems(xml);
        
        return items.slice(0, 15).map((itemXml, index) => {
          const title = extractTag(itemXml, "title");
          const description = extractTag(itemXml, "description")
            .replace(/<[^>]*>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .trim();
          const link = extractTag(itemXml, "link");
          const pubDate = extractTag(itemXml, "pubDate");
          const creator = extractTag(itemXml, "dc:creator") || extractTag(itemXml, "author") || feed.source;
          const image = extractImageFromItem(itemXml);
          const category = categorizeArticle(title, description);

          return {
            id: btoa(link || `${feed.source}-${index}`).replace(/[^a-zA-Z0-9]/g, "").slice(0, 20),
            title,
            summary: description.slice(0, 200) + (description.length > 200 ? "..." : ""),
            content: description,
            image,
            category,
            date: pubDate
              ? new Date(pubDate).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            readTime: estimateReadTime(description),
            author: creator.replace(/<[^>]*>/g, "").trim() || feed.source,
            source: feed.source,
            link,
            views: Math.floor(Math.random() * 50000) + 5000,
            trending: index < 3,
          } as NewsArticle;
        });
      } catch (e) {
        console.error(`Failed to fetch ${feed.url}:`, e);
        return [];
      }
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled" && Array.isArray(result.value)) {
      allArticles.push(...result.value);
    }
  }

  // Sort by date descending
  allArticles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Mark top 6 as trending
  for (let i = 0; i < Math.min(6, allArticles.length); i++) {
    allArticles[i].trending = true;
  }

  cachedNews = allArticles;
  cacheExpiry = now + CACHE_TTL;

  return allArticles;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const articles = await fetchAndParseFeeds();

    return new Response(JSON.stringify({ articles, count: articles.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Football news error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch news", articles: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
