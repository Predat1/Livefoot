import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const BASE_URL = "https://livefoot.fun"

serve(async (req) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const staticUrls = [
      { loc: "/", priority: "1.0", freq: "always" },
      { loc: "/live", priority: "0.95", freq: "always" },
      { loc: "/news", priority: "0.9", freq: "hourly" },
      { loc: "/competitions", priority: "0.9", freq: "daily" },
      { loc: "/standings", priority: "0.9", freq: "daily" },
      { loc: "/teams", priority: "0.85", freq: "daily" },
      { loc: "/players", priority: "0.85", freq: "daily" },
      { loc: "/rankings", priority: "0.8", freq: "daily" },
      { loc: "/transfers", priority: "0.8", freq: "daily" },
      { loc: "/predictions", priority: "0.7", freq: "daily" },
      { loc: "/explorer", priority: "0.7", freq: "daily" },
      { loc: "/about", priority: "0.3", freq: "monthly" },
      { loc: "/contact", priority: "0.3", freq: "monthly" },
      { loc: "/privacy", priority: "0.2", freq: "monthly" },
      { loc: "/terms", priority: "0.2", freq: "monthly" },
    ];

    // In a real scenario, you would fetch teams, players, and matches from the DB or API here
    // For now, we'll return the static part + a placeholder for dynamic items
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls
  .map(
    u => `  <url>
    <loc>${BASE_URL}${u.loc}</loc>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
    <lastmod>${today}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
})
