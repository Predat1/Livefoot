import { cn } from "@/lib/utils";

interface ShotMapProps {
  playersData: any[];
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getZoneY(pos: string, isHome: boolean): number {
  const zones: Record<string, number> = { G: 270, D: 220, M: 150, F: 70 };
  const base = zones[pos] || 150;
  return isHome ? base : 300 - base;
}

const ShotMap = ({ playersData, homeTeamId, awayTeamId, homeTeamName, awayTeamName }: ShotMapProps) => {
  if (!playersData || playersData.length < 2) {
    return <p className="text-center text-muted-foreground py-8 text-sm">Données de tirs non disponibles</p>;
  }

  const allShots: {
    x: number; y: number; r: number;
    color: string; name: string; goals: number; onTarget: number; total: number; isHome: boolean;
  }[] = [];

  playersData.forEach((teamData: any) => {
    const isHome = String(teamData.team?.id) === homeTeamId;
    (teamData.players || []).forEach((p: any, idx: number) => {
      const stats = p.statistics?.[0];
      const total = stats?.shots?.total || 0;
      const onTarget = stats?.shots?.on || 0;
      const goals = stats?.goals?.total || 0;
      if (total === 0) return;

      const pos = stats?.games?.position?.[0] || "M";
      const seed = p.player?.id || idx;
      const x = 40 + seededRandom(seed) * 320;
      const y = getZoneY(pos, isHome) + (seededRandom(seed + 1) - 0.5) * 50;
      const r = Math.min(4 + total * 1.5, 14);

      let color = "hsl(var(--destructive))"; // off target
      if (goals > 0) color = "hsl(45, 100%, 50%)"; // gold for goals
      else if (onTarget > 0) color = "hsl(142, 71%, 45%)"; // green for on target

      allShots.push({ x, y, r, color, name: p.player?.name || "", goals, onTarget, total, isHome });
    });
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(45, 100%, 50%)" }} /> But</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(142, 71%, 45%)" }} /> Cadré</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-destructive" /> Non cadré</span>
      </div>
      <svg viewBox="0 0 400 300" className="w-full max-w-md mx-auto rounded-xl" style={{ background: "hsl(142, 40%, 30%)" }}>
        {/* Field lines */}
        <rect x="10" y="10" width="380" height="280" rx="4" fill="none" stroke="hsla(0,0%,100%,0.3)" strokeWidth="1.5" />
        <line x1="10" y1="150" x2="390" y2="150" stroke="hsla(0,0%,100%,0.3)" strokeWidth="1.5" />
        <circle cx="200" cy="150" r="30" fill="none" stroke="hsla(0,0%,100%,0.3)" strokeWidth="1.5" />
        {/* Top penalty area */}
        <rect x="120" y="10" width="160" height="55" fill="none" stroke="hsla(0,0%,100%,0.3)" strokeWidth="1.5" />
        <rect x="160" y="10" width="80" height="22" fill="none" stroke="hsla(0,0%,100%,0.2)" strokeWidth="1" />
        {/* Bottom penalty area */}
        <rect x="120" y="235" width="160" height="55" fill="none" stroke="hsla(0,0%,100%,0.3)" strokeWidth="1.5" />
        <rect x="160" y="268" width="80" height="22" fill="none" stroke="hsla(0,0%,100%,0.2)" strokeWidth="1" />
        {/* Team labels */}
        <text x="200" y="28" textAnchor="middle" fill="hsla(0,0%,100%,0.5)" fontSize="10" fontWeight="bold">{homeTeamName}</text>
        <text x="200" y="290" textAnchor="middle" fill="hsla(0,0%,100%,0.5)" fontSize="10" fontWeight="bold">{awayTeamName}</text>
        {/* Shots */}
        {allShots.map((s, i) => (
          <g key={i}>
            <circle cx={s.x} cy={s.y} r={s.r} fill={s.color} fillOpacity={0.8} stroke="white" strokeWidth="0.8" />
            <title>{`${s.name}: ${s.total} tir(s), ${s.onTarget} cadré(s), ${s.goals} but(s)`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default ShotMap;
