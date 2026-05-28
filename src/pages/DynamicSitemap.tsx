import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTeams, getTopScorers, getFixtures } from "@/services/apiFootball";
import { buildEntitySlug } from "@/utils/slugify";

const LEAGUES = ["39", "140", "135", "78", "61", "2", "3"]; // PL, Liga, Serie A, BuLi, L1, CL, EL
const BASE = "https://www.livefoot.fun";
const SEASON = "2025";

const DynamicSitemap = () => {
  const todayStr = new Date().toISOString().split("T")[0];

  const { data, isLoading } = useQuery({
    queryKey: ["sitemap-data", todayStr],
    queryFn: async () => {
      // 1. Fetch teams for all leagues in parallel
      const teamPromises = LEAGUES.map(async (leagueId) => {
        try {
          const res = await getTeams({ league: leagueId, season: SEASON });
          return (res.response || []).map((item: any) => ({
            id: String(item.team.id),
            name: item.team.name,
          }));
        } catch (e) {
          console.warn(`Sitemap: error fetching teams for league ${leagueId}`, e);
          return [];
        }
      });

      // 2. Fetch scorers/players for all leagues in parallel
      const scorerPromises = LEAGUES.map(async (leagueId) => {
        try {
          const res = await getTopScorers(leagueId, SEASON);
          return (res.response || []).map((item: any) => ({
            id: String(item.player?.id),
            name: item.player?.name,
          }));
        } catch (e) {
          console.warn(`Sitemap: error fetching scorers for league ${leagueId}`, e);
          return [];
        }
      });

      // 3. Fetch today's fixtures
      const fixturesPromise = (async () => {
        try {
          const res = await getFixtures({ date: todayStr });
          return (res.response || []).map((fix: any) => ({
            id: String(fix.fixture?.id),
            homeTeam: { name: fix.teams?.home?.name || "" },
            awayTeam: { name: fix.teams?.away?.name || "" },
          }));
        } catch (e) {
          console.warn("Sitemap: error fetching fixtures", e);
          return [];
        }
      })();

      const [teamsArrays, playersArrays, fixturesArray] = await Promise.all([
        Promise.all(teamPromises),
        Promise.all(scorerPromises),
        fixturesPromise,
      ]);

      const allTeams = teamsArrays.flat();
      const allPlayers = playersArrays.flat();
      const uniquePlayers = Array.from(new Map(allPlayers.map(p => [p.id, p])).values());

      return {
        teams: allTeams,
        players: uniquePlayers,
        matches: fixturesArray,
      };
    },
    staleTime: 12 * 60 * 60 * 1000,
  });

  useEffect(() => {
    if (isLoading || !data) return;

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

    const teamUrls = data.teams.map(t => ({
      loc: `/teams/${buildEntitySlug(t.id, t.name)}`,
      priority: "0.7",
      freq: "weekly",
    }));

    const playerUrls = data.players.map(p => ({
      loc: `/players/${buildEntitySlug(p.id, p.name)}`,
      priority: "0.6",
      freq: "weekly",
    }));

    const matchUrls = data.matches.map((m: any) => ({
      loc: `/match/${buildEntitySlug(m.id, `${m.homeTeam.name}-vs-${m.awayTeam.name}`)}`,
      priority: "0.9",
      freq: "hourly",
    }));

    const allUrls = [...staticUrls, ...teamUrls, ...playerUrls, ...matchUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    u => `  <url>
    <loc>${BASE}${u.loc}</loc>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
    <lastmod>${todayStr}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>`;

    // Replace the entire document with XML
    document.open("text/xml");
    document.write(xml);
    document.close();
  }, [isLoading, data, todayStr]);

  if (isLoading) {
    return <div style={{ padding: 20, fontFamily: "monospace" }}>Generating sitemap...</div>;
  }

  return null;
};

export default DynamicSitemap;
