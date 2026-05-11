export const config = {
  runtime: "edge",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function extractFixtureId(url: URL) {
  return decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "").replace(/\D/g, "");
}

async function fetchFixture(fixtureId: string) {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey || !fixtureId) return null;

  try {
    const response = await fetch(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`, {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
    });
    const payload = await response.json();
    return payload?.response?.[0] || null;
  } catch {
    return null;
  }
}

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const fixtureId = extractFixtureId(url);
  const originalPath = url.searchParams.get("path") || `/match/${fixtureId}`;
  const fixture = await fetchFixture(fixtureId);

  const home = fixture?.teams?.home?.name || "Équipe domicile";
  const away = fixture?.teams?.away?.name || "Équipe extérieure";
  const league = fixture?.league?.name || "Football";
  const statusRaw = fixture?.fixture?.status?.short || "NS";
  const live = ["1H", "2H", "HT", "ET", "P", "BT", "LIVE", "INT"].includes(statusRaw);
  const finished = ["FT", "AET", "PEN", "AWD", "WO"].includes(statusRaw);
  const status = live ? "live" : finished ? "finished" : "scheduled";

  const imageUrl = new URL(`/api/og/match/${fixtureId}`, url.origin);
  imageUrl.searchParams.set("home", home);
  imageUrl.searchParams.set("away", away);
  imageUrl.searchParams.set("homeLogo", fixture?.teams?.home?.logo || "");
  imageUrl.searchParams.set("awayLogo", fixture?.teams?.away?.logo || "");
  imageUrl.searchParams.set("homeScore", String(fixture?.goals?.home ?? ""));
  imageUrl.searchParams.set("awayScore", String(fixture?.goals?.away ?? ""));
  imageUrl.searchParams.set("status", status);
  imageUrl.searchParams.set("minute", fixture?.fixture?.status?.elapsed ? String(fixture.fixture.status.elapsed) : "");
  imageUrl.searchParams.set("league", league);
  imageUrl.searchParams.set("date", fixture?.fixture?.date ? new Date(fixture.fixture.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "");

  const canonicalUrl = `${url.origin}${originalPath}`;
  const title = `${home} vs ${away} en direct | LiveFoot.fun`;
  const description = `Suivez ${home} vs ${away} en direct sur LiveFoot.fun : score live, statistiques, compositions et pronostics IA.`;

  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta property="og:type" content="sports_event" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl.toString())}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="LiveFoot.fun" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl.toString())}" />
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <p><a href="${escapeHtml(canonicalUrl)}">Voir le match sur LiveFoot.fun</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": live ? "public, max-age=60, s-maxage=60" : "public, max-age=1800, s-maxage=3600",
    },
  });
}
