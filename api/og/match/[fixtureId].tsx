import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge",
};

type MatchInfo = {
  home: string;
  away: string;
  homeLogo?: string;
  awayLogo?: string;
  homeScore?: string;
  awayScore?: string;
  status: string;
  minute?: string;
  league: string;
  date?: string;
};

function getParam(url: URL, key: string) {
  return url.searchParams.get(key) || "";
}

function extractFixtureId(url: URL) {
  return decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "").replace(/\D/g, "");
}

async function fetchFixtureInfo(fixtureId: string): Promise<Partial<MatchInfo> | null> {
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
    const fixture = payload?.response?.[0];
    if (!fixture) return null;

    const statusRaw = fixture.fixture?.status?.short || "NS";
    const live = ["1H", "2H", "HT", "ET", "P", "BT", "LIVE", "INT"].includes(statusRaw);
    const finished = ["FT", "AET", "PEN", "AWD", "WO"].includes(statusRaw);

    return {
      home: fixture.teams?.home?.name,
      away: fixture.teams?.away?.name,
      homeLogo: fixture.teams?.home?.logo,
      awayLogo: fixture.teams?.away?.logo,
      homeScore: String(fixture.goals?.home ?? ""),
      awayScore: String(fixture.goals?.away ?? ""),
      status: live ? "live" : finished ? "finished" : "scheduled",
      minute: fixture.fixture?.status?.elapsed ? String(fixture.fixture.status.elapsed) : "",
      league: fixture.league?.name,
      date: fixture.fixture?.date ? new Date(fixture.fixture.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "",
    };
  } catch {
    return null;
  }
}

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const fixtureId = extractFixtureId(url);
  const fetched = await fetchFixtureInfo(fixtureId);

  const data: MatchInfo = {
    home: getParam(url, "home") || fetched?.home || "Équipe domicile",
    away: getParam(url, "away") || fetched?.away || "Équipe extérieure",
    homeLogo: getParam(url, "homeLogo") || fetched?.homeLogo || "",
    awayLogo: getParam(url, "awayLogo") || fetched?.awayLogo || "",
    homeScore: getParam(url, "homeScore") || fetched?.homeScore || "",
    awayScore: getParam(url, "awayScore") || fetched?.awayScore || "",
    status: getParam(url, "status") || fetched?.status || "scheduled",
    minute: getParam(url, "minute") || fetched?.minute || "",
    league: getParam(url, "league") || fetched?.league || "Football",
    date: getParam(url, "date") || fetched?.date || "À venir",
  };

  const badge = data.status === "live" ? `LIVE${data.minute ? ` • ${data.minute}'` : ""}` : data.status === "finished" ? "TERMINÉ" : data.date || "À VENIR";
  const score = data.status === "scheduled" ? "VS" : `${data.homeScore || 0} - ${data.awayScore || 0}`;
  const matchUrl = `livefoot.fun/match/${fixtureId || ""}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #05120d 0%, #0f172a 48%, #052e16 100%)",
          color: "white",
          padding: 64,
          fontFamily: "Inter, Arial, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", right: -90, top: -110, width: 360, height: 360, borderRadius: 999, background: "rgba(34,197,94,0.22)" }} />
        <div style={{ position: "absolute", left: -120, bottom: -140, width: 360, height: 360, borderRadius: 999, background: "rgba(250,204,21,0.16)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 38, fontWeight: 900, color: "#22c55e" }}>LiveFoot.fun</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{data.league}</div>
          </div>
          <div style={{ padding: "12px 24px", borderRadius: 999, background: data.status === "live" ? "#ef4444" : data.status === "finished" ? "#22c55e" : "#f59e0b", fontSize: 24, fontWeight: 900 }}>{badge}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ width: 310, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
            <div style={{ width: 138, height: 138, borderRadius: 36, background: "white", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid rgba(34,197,94,0.35)" }}>
              {data.homeLogo ? <img src={data.homeLogo} width="96" height="96" style={{ objectFit: "contain" }} /> : <div style={{ color: "#0f172a", fontSize: 48, fontWeight: 900 }}>{data.home.slice(0, 2).toUpperCase()}</div>}
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, textAlign: "center", lineHeight: 1.1 }}>{data.home}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <div style={{ fontSize: 92, fontWeight: 900 }}>{score}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "rgba(255,255,255,0.7)" }}>Scores live • Stats • Pronos IA</div>
          </div>

          <div style={{ width: 310, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
            <div style={{ width: 138, height: 138, borderRadius: 36, background: "white", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid rgba(34,197,94,0.35)" }}>
              {data.awayLogo ? <img src={data.awayLogo} width="96" height="96" style={{ objectFit: "contain" }} /> : <div style={{ color: "#0f172a", fontSize: 48, fontWeight: 900 }}>{data.away.slice(0, 2).toUpperCase()}</div>}
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, textAlign: "center", lineHeight: 1.1 }}>{data.away}</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ padding: "14px 34px", borderRadius: 999, background: "rgba(15,23,42,0.78)", border: "1px solid rgba(34,197,94,0.35)", color: "#d1fae5", fontSize: 25, fontWeight: 800 }}>{matchUrl}</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": data.status === "live" ? "public, max-age=60, s-maxage=60" : "public, max-age=3600, s-maxage=86400",
      },
    }
  );
}
