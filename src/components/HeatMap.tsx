import { cn } from "@/lib/utils";

interface HeatMapProps {
  playersData: any[];
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

// Map position to zones on the pitch (0-100 scale)
function getPositionZone(pos: string, playerIndex: number, seed: number): { x: number; y: number } {
  const jitterX = (seededRandom(seed) - 0.5) * 12;
  const jitterY = (seededRandom(seed + 7) - 0.5) * 16;

  switch (pos) {
    case "G": return { x: 50 + jitterX * 0.3, y: 90 + jitterY * 0.2 };
    case "D": {
      const spread = [20, 35, 50, 65, 80];
      const baseX = spread[playerIndex % spread.length];
      return { x: baseX + jitterX, y: 72 + jitterY * 0.5 };
    }
    case "M": {
      const spread = [25, 40, 50, 60, 75];
      const baseX = spread[playerIndex % spread.length];
      return { x: baseX + jitterX, y: 48 + jitterY };
    }
    case "F": {
      const spread = [30, 50, 70];
      const baseX = spread[playerIndex % spread.length];
      return { x: baseX + jitterX, y: 22 + jitterY * 0.6 };
    }
    default: return { x: 50 + jitterX, y: 50 + jitterY };
  }
}

function getIntensity(stats: any): number {
  const passes = stats?.passes?.total || 0;
  const shots = stats?.shots?.total || 0;
  const duels = stats?.duels?.total || 0;
  const touches = passes + shots * 3 + duels;
  return Math.min(touches / 60, 1); // normalize to 0-1
}

const HeatMap = ({ playersData, homeTeamId, awayTeamId, homeTeamName, awayTeamName }: HeatMapProps) => {
  if (!playersData || playersData.length < 2) {
    return <p className="text-center text-muted-foreground py-8 text-sm">Données non disponibles</p>;
  }

  const renderTeamHeat = (teamData: any, isHome: boolean) => {
    const teamPlayers = (teamData.players || []).filter((p: any) => {
      const minutes = p.statistics?.[0]?.games?.minutes;
      return minutes && minutes > 0;
    });

    // Group by position for index tracking
    const positionCounters: Record<string, number> = {};

    const heatPoints = teamPlayers.map((p: any) => {
      const stats = p.statistics?.[0];
      const pos = stats?.games?.position?.[0] || "M";
      positionCounters[pos] = (positionCounters[pos] || 0);
      const idx = positionCounters[pos]++;
      const seed = p.player?.id || idx;
      
      let zone = getPositionZone(pos, idx, seed);
      // Flip for away team
      if (!isHome) {
        zone = { x: 100 - zone.x, y: 100 - zone.y };
      }
      
      const intensity = getIntensity(stats);
      const r = 8 + intensity * 16;
      
      return {
        x: zone.x * 3.6 + 10, // scale to SVG 400 width with padding
        y: zone.y * 5.4 + 10, // scale to SVG 580 height with padding
        r,
        intensity,
        name: p.player?.name || "",
        pos,
      };
    });

    return heatPoints;
  };

  const homeTeamData = playersData.find((t: any) => String(t.team?.id) === homeTeamId) || playersData[0];
  const awayTeamData = playersData.find((t: any) => String(t.team?.id) === awayTeamId) || playersData[1];
  
  const homePoints = renderTeamHeat(homeTeamData, true);
  const awayPoints = renderTeamHeat(awayTeamData, false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-6 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-primary/60" />
          {homeTeamName}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-destructive/60" />
          {awayTeamName}
        </span>
      </div>
      <svg viewBox="0 0 380 560" className="w-full max-w-sm mx-auto rounded-xl" style={{ background: "hsl(142, 40%, 28%)" }}>
        {/* SVG Defs for radial gradients */}
        <defs>
          <radialGradient id="homeGrad">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="awayGrad">
            <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Pitch outline */}
        <rect x="10" y="10" width="360" height="540" rx="4" fill="none" stroke="hsla(0,0%,100%,0.25)" strokeWidth="1.5" />
        {/* Center line */}
        <line x1="10" y1="280" x2="370" y2="280" stroke="hsla(0,0%,100%,0.25)" strokeWidth="1.5" />
        {/* Center circle */}
        <circle cx="190" cy="280" r="40" fill="none" stroke="hsla(0,0%,100%,0.25)" strokeWidth="1.5" />
        <circle cx="190" cy="280" r="2" fill="hsla(0,0%,100%,0.3)" />
        {/* Top penalty area */}
        <rect x="100" y="10" width="180" height="80" fill="none" stroke="hsla(0,0%,100%,0.25)" strokeWidth="1.5" />
        <rect x="140" y="10" width="100" height="32" fill="none" stroke="hsla(0,0%,100%,0.2)" strokeWidth="1" />
        <circle cx="190" cy="68" r="2" fill="hsla(0,0%,100%,0.3)" />
        {/* Bottom penalty area */}
        <rect x="100" y="470" width="180" height="80" fill="none" stroke="hsla(0,0%,100%,0.25)" strokeWidth="1.5" />
        <rect x="140" y="518" width="100" height="32" fill="none" stroke="hsla(0,0%,100%,0.2)" strokeWidth="1" />
        <circle cx="190" cy="492" r="2" fill="hsla(0,0%,100%,0.3)" />

        {/* Home heat blobs */}
        {homePoints.map((p, i) => (
          <circle key={`h-${i}`} cx={p.x} cy={p.y} r={p.r} fill="url(#homeGrad)" opacity={0.4 + p.intensity * 0.6}>
            <title>{p.name} ({p.pos})</title>
          </circle>
        ))}
        {/* Away heat blobs */}
        {awayPoints.map((p, i) => (
          <circle key={`a-${i}`} cx={p.x} cy={p.y} r={p.r} fill="url(#awayGrad)" opacity={0.4 + p.intensity * 0.6}>
            <title>{p.name} ({p.pos})</title>
          </circle>
        ))}

        {/* Team labels */}
        <text x="190" y="28" textAnchor="middle" fill="hsla(0,0%,100%,0.5)" fontSize="10" fontWeight="bold">{homeTeamName}</text>
        <text x="190" y="545" textAnchor="middle" fill="hsla(0,0%,100%,0.5)" fontSize="10" fontWeight="bold">{awayTeamName}</text>
      </svg>
    </div>
  );
};

export default HeatMap;
