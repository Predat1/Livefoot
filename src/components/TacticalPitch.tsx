import { cn } from "@/lib/utils";

type Player = { name: string; number: number; pos: string };

interface TacticalPitchProps {
  homePlayers: Player[];
  awayPlayers: Player[];
  homeTeamName: string;
  awayTeamName: string;
  homeColor?: string;
  awayColor?: string;
}

// Derive formation string like "4-3-3" from the player list
function getFormation(players: Player[]): string {
  const outfield = players.filter((p) => p.pos !== "GK");
  const defs = outfield.filter((p) => p.pos === "DEF").length;
  const mids = outfield.filter((p) => p.pos === "MID").length;
  const fwds = outfield.filter((p) => p.pos === "FWD").length;
  return `${defs}-${mids}-${fwds}`;
}

// Position players on the pitch (0..1 coords)
function getPositions(players: Player[], side: "home" | "away"): { x: number; y: number; player: Player }[] {
  const groups: Record<string, Player[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of players) {
    if (groups[p.pos]) groups[p.pos].push(p);
    else groups["MID"].push(p);
  }

  const rows: { pos: string; yFrac: number }[] = [
    { pos: "GK", yFrac: 0.07 },
    { pos: "DEF", yFrac: 0.25 },
    { pos: "MID", yFrac: 0.50 },
    { pos: "FWD", yFrac: 0.75 },
  ];

  const result: { x: number; y: number; player: Player }[] = [];

  for (const { pos, yFrac } of rows) {
    const group = groups[pos] ?? [];
    if (group.length === 0) continue;
    const n = group.length;
    group.forEach((player, i) => {
      const x = (i + 1) / (n + 1);
      // For away team, mirror vertically (they attack from the top half)
      const y = side === "home" ? 1 - yFrac : yFrac;
      result.push({ x, y, player });
    });
  }
  return result;
}

const PITCH_W = 340;
const PITCH_H = 520;
// Player dot radius
const R = 13;

function PlayerDot({
  cx,
  cy,
  player,
  color,
  textColor = "white",
}: {
  cx: number;
  cy: number;
  player: Player;
  color: string;
  textColor?: string;
}) {
  // Truncate surname
  const shortName = player.name.split(" ").slice(-1)[0];
  return (
    <g>
      <circle cx={cx} cy={cy} r={R} fill={color} stroke="white" strokeWidth={1.5} className="drop-shadow-md" />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={8}
        fontWeight="bold"
        fill={textColor}
      >
        {player.number}
      </text>
      {/* Name label below the dot */}
      <text
        x={cx}
        y={cy + R + 9}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={7}
        fill="white"
        className="drop-shadow-sm"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
      >
        {shortName.length > 8 ? shortName.slice(0, 8) + "." : shortName}
      </text>
    </g>
  );
}

export default function TacticalPitch({
  homePlayers,
  awayPlayers,
  homeTeamName,
  awayTeamName,
}: TacticalPitchProps) {
  const homePositions = getPositions(homePlayers, "home");
  const awayPositions = getPositions(awayPlayers, "away");

  const homeFormation = getFormation(homePlayers);
  const awayFormation = getFormation(awayPlayers);

  // Pitch drawing constants
  const PW = PITCH_W;
  const PH = PITCH_H;
  const lw = 1.5; // line width
  const mx = 20; // margin x
  const my = 20; // margin y
  const fw = PW - mx * 2; // field width
  const fh = PH - my * 2; // field height

  // Penalty area dimensions (proportional to real pitch 105x68m)
  const penW = fw * (40.32 / 68);
  const penH = fh * (16.5 / 105);
  const goalW = fw * (18.32 / 68);
  const goalH = fh * (5.5 / 105);
  const spotY = fh * (11 / 105);
  const circleR = fh * (9.15 / 105);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Formation labels */}
      <div className="w-full flex justify-between px-2 text-xs font-bold text-foreground">
        <div className="flex flex-col items-start">
          <span className="text-[10px] text-muted-foreground">HOME</span>
          <span>{homeTeamName.split(" ").slice(-1)[0]}</span>
          <span className="text-primary">{homeFormation}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground">AWAY</span>
          <span>{awayTeamName.split(" ").slice(-1)[0]}</span>
          <span className="text-primary">{awayFormation}</span>
        </div>
      </div>

      {/* Pitch SVG */}
      <div className="w-full overflow-hidden rounded-xl">
        <svg
          viewBox={`0 0 ${PW} ${PH}`}
          className="w-full h-auto"
          style={{ maxHeight: 480 }}
        >
          {/* Grass gradient background */}
          <defs>
            <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a6b2e" />
              <stop offset="50%" stopColor="#1e7a34" />
              <stop offset="100%" stopColor="#1a6b2e" />
            </linearGradient>
            {/* Stripe pattern */}
            <pattern id="stripes" x="0" y="0" width={fw / 8} height={fh} patternUnits="userSpaceOnUse" patternTransform={`translate(${mx},${my})`}>
              <rect width={fw / 16} height={fh} fill="rgba(255,255,255,0.04)" />
            </pattern>
          </defs>

          {/* Pitch background */}
          <rect x={0} y={0} width={PW} height={PH} fill="#164d22" rx={12} />
          <rect x={mx} y={my} width={fw} height={fh} fill="url(#grassGrad)" />
          <rect x={mx} y={my} width={fw} height={fh} fill="url(#stripes)" />

          {/* Outer boundary */}
          <rect x={mx} y={my} width={fw} height={fh} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={lw} />

          {/* Halfway line */}
          <line x1={mx} y1={my + fh / 2} x2={mx + fw} y2={my + fh / 2} stroke="rgba(255,255,255,0.7)" strokeWidth={lw} />

          {/* Center circle */}
          <circle cx={mx + fw / 2} cy={my + fh / 2} r={circleR} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={lw} />
          <circle cx={mx + fw / 2} cy={my + fh / 2} r={3} fill="rgba(255,255,255,0.7)" />

          {/* Top penalty area */}
          <rect x={mx + (fw - penW) / 2} y={my} width={penW} height={penH} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={lw} />
          {/* Top goal area */}
          <rect x={mx + (fw - goalW) / 2} y={my} width={goalW} height={goalH} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={lw} />
          {/* Top penalty spot */}
          <circle cx={mx + fw / 2} cy={my + spotY} r={2.5} fill="rgba(255,255,255,0.7)" />
          {/* Top penalty arc */}
          <path
            d={`M ${mx + (fw - penW) / 2} ${my + penH} A ${circleR} ${circleR} 0 0 0 ${mx + (fw + penW) / 2} ${my + penH}`}
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth={lw}
          />

          {/* Bottom penalty area */}
          <rect x={mx + (fw - penW) / 2} y={my + fh - penH} width={penW} height={penH} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={lw} />
          {/* Bottom goal area */}
          <rect x={mx + (fw - goalW) / 2} y={my + fh - goalH} width={goalW} height={goalH} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={lw} />
          {/* Bottom penalty spot */}
          <circle cx={mx + fw / 2} cy={my + fh - spotY} r={2.5} fill="rgba(255,255,255,0.7)" />
          {/* Bottom penalty arc */}
          <path
            d={`M ${mx + (fw - penW) / 2} ${my + fh - penH} A ${circleR} ${circleR} 0 0 1 ${mx + (fw + penW) / 2} ${my + fh - penH}`}
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth={lw}
          />

          {/* Corner arcs */}
          {[
            { cx: mx, cy: my, start: 0, end: 90 },
            { cx: mx + fw, cy: my, start: 90, end: 180 },
            { cx: mx + fw, cy: my + fh, start: 180, end: 270 },
            { cx: mx, cy: my + fh, start: 270, end: 360 },
          ].map(({ cx, cy, start, end }, i) => {
            const r = 8;
            const a1 = (start * Math.PI) / 180;
            const a2 = (end * Math.PI) / 180;
            return (
              <path
                key={i}
                d={`M ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(a2)} ${cy + r * Math.sin(a2)}`}
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth={lw}
              />
            );
          })}

          {/* Away team players (top half, attacking downward) */}
          {awayPositions.map(({ x, y, player }, i) => (
            <PlayerDot
              key={`away-${i}`}
              cx={mx + x * fw}
              cy={my + y * fh}
              player={player}
              color="#e63946"
            />
          ))}

          {/* Home team players (bottom half, attacking upward) */}
          {homePositions.map(({ x, y, player }, i) => (
            <PlayerDot
              key={`home-${i}`}
              cx={mx + x * fw}
              cy={my + y * fh}
              player={player}
              color="#2563eb"
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-600 border border-white" />
          <span>{homeTeamName}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 border border-white" />
          <span>{awayTeamName}</span>
        </div>
      </div>
    </div>
  );
}
