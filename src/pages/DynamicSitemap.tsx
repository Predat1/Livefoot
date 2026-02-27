import { useEffect } from "react";
import { useTopScorers, useTeamsByLeague } from "@/hooks/useApiFootball";
import { buildEntitySlug } from "@/utils/slugify";

const LEAGUES = ["39", "140", "135", "78", "61"]; // PL, Liga, Serie A, BuLi, L1
const BASE = "https://livefoot.app";
const SEASON = "2024";

const DynamicSitemap = () => {
  const teamQueries = LEAGUES.map(id => useTeamsByLeague(id, SEASON));
  const scorerQueries = LEAGUES.map(id => useTopScorers(id, SEASON));

  const allTeams = teamQueries.flatMap(q => q.data || []);
  const allPlayers = scorerQueries.flatMap(q => q.data || []);
  const isLoading = teamQueries.some(q => q.isLoading) || scorerQueries.some(q => q.isLoading);

  // Deduplicate players by id
  const uniquePlayers = Array.from(new Map(allPlayers.map(p => [p.id, p])).values());

  useEffect(() => {
    if (isLoading) return;

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

    const teamUrls = allTeams.map(t => ({
      loc: `/teams/${buildEntitySlug(t.id, t.name)}`,
      priority: "0.7",
      freq: "weekly",
    }));

    const playerUrls = uniquePlayers.map(p => ({
      loc: `/players/${buildEntitySlug(p.id, p.name)}`,
      priority: "0.6",
      freq: "weekly",
    }));

    const allUrls = [...staticUrls, ...teamUrls, ...playerUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    u => `  <url>
    <loc>${BASE}${u.loc}</loc>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
    <lastmod>${today}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>`;

    // Replace the entire document with XML
    document.open("text/xml");
    document.write(xml);
    document.close();
  }, [isLoading, allTeams.length, uniquePlayers.length]);

  if (isLoading) {
    return <div style={{ padding: 20, fontFamily: "monospace" }}>Generating sitemap...</div>;
  }

  return null;
};

export default DynamicSitemap;
