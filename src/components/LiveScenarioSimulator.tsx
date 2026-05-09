import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Sliders, Lock, Crown, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface LiveScenarioSimulatorProps {
  homeTeamName: string;
  awayTeamName: string;
  currentMinute?: number;
  currentHomeScore?: number;
  currentAwayScore?: number;
  baseProbabilities: { home: number; draw: number; away: number };
  xgHome?: number;
  xgAway?: number;
}

// Poisson probability P(k; lambda)
function poissonProb(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let prob = Math.exp(-lambda) * Math.pow(lambda, k);
  for (let i = 1; i <= k; i++) prob /= i;
  return prob;
}

// Recalculate win/draw/loss given remaining xG rates
function calcProbs(xgH: number, xgA: number, homeGoals: number, awayGoals: number) {
  let homeWin = 0, draw = 0, awayWin = 0;
  for (let h = 0; h <= 6; h++) {
    for (let a = 0; a <= 6; a++) {
      const p = poissonProb(h, xgH) * poissonProb(a, xgA);
      const totalH = homeGoals + h;
      const totalA = awayGoals + a;
      if (totalH > totalA) homeWin += p;
      else if (totalH === totalA) draw += p;
      else awayWin += p;
    }
  }
  const total = homeWin + draw + awayWin;
  return {
    home: Math.round((homeWin / total) * 100),
    draw: Math.round((draw / total) * 100),
    away: Math.round((awayWin / total) * 100),
  };
}

const SCENARIOS = [
  { id: "goal_home_now", label: "But domicile maintenant", homeGoalDelta: 1, awayGoalDelta: 0, minuteDelta: 0, redCardHome: false, redCardAway: false },
  { id: "goal_away_now", label: "But extérieur maintenant", homeGoalDelta: 0, awayGoalDelta: 1, minuteDelta: 0, redCardHome: false, redCardAway: false },
  { id: "red_home", label: "Carton rouge domicile", homeGoalDelta: 0, awayGoalDelta: 0, minuteDelta: 0, redCardHome: true, redCardAway: false },
  { id: "red_away", label: "Carton rouge extérieur", homeGoalDelta: 0, awayGoalDelta: 0, minuteDelta: 0, redCardHome: false, redCardAway: true },
];

export default function LiveScenarioSimulator({
  homeTeamName, awayTeamName,
  currentMinute = 45,
  currentHomeScore = 0, currentAwayScore = 0,
  baseProbabilities,
  xgHome = 1.3, xgAway = 1.0,
}: LiveScenarioSimulatorProps) {
  const { isVip } = useAuth();
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [customMinute, setCustomMinute] = useState(currentMinute);

  const remainingFraction = useMemo(() => Math.max(0, (90 - customMinute) / 90), [customMinute]);

  const scenarioResult = useMemo(() => {
    if (!selectedScenario) return null;
    const sc = SCENARIOS.find(s => s.id === selectedScenario);
    if (!sc) return null;

    let adjXgH = xgHome * remainingFraction;
    let adjXgA = xgAway * remainingFraction;
    const newHomeGoals = currentHomeScore + sc.homeGoalDelta;
    const newAwayGoals = currentAwayScore + sc.awayGoalDelta;

    // Red card: reduce team's xG rate by ~35%
    if (sc.redCardHome) adjXgH *= 0.65;
    if (sc.redCardAway) adjXgA *= 0.65;

    return calcProbs(adjXgH, adjXgA, newHomeGoals, newAwayGoals);
  }, [selectedScenario, customMinute, currentHomeScore, currentAwayScore, xgHome, xgAway, remainingFraction]);

  const delta = useMemo(() => {
    if (!scenarioResult) return null;
    return {
      home: scenarioResult.home - baseProbabilities.home,
      draw: scenarioResult.draw - baseProbabilities.draw,
      away: scenarioResult.away - baseProbabilities.away,
    };
  }, [scenarioResult, baseProbabilities]);

  return (
    <div className="relative rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/60 to-[#0a0d14] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-blue-500/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <Sliders className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white">🔄 Simulateur de Scénarios</h4>
            <p className="text-[9px] text-blue-400/50">Recalcul Poisson en temps réel</p>
          </div>
        </div>
        {!isVip && (
          <Link to="/pricing" className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-400 hover:bg-amber-500/20 transition-colors">
            <Crown className="h-3 w-3" /> VIP
          </Link>
        )}
      </div>

      <div className="p-4 relative">
        {/* Non-VIP blur */}
        {!isVip && (
          <div className="absolute inset-0 z-10 backdrop-blur-sm bg-black/40 flex flex-col items-center justify-center gap-2 rounded-b-2xl">
            <Lock className="h-5 w-5 text-amber-400" />
            <p className="text-xs font-black text-white">Réservé aux membres VIP</p>
            <p className="text-[10px] text-white/50 text-center max-w-[200px]">Simulez l'impact de chaque événement sur les probabilités</p>
            <Link to="/pricing" className="mt-2 px-4 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black hover:bg-amber-400 transition-colors">
              Débloquer VIP
            </Link>
          </div>
        )}

        {/* Minute slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] text-white/40 mb-1.5">
            <span>Minute du match</span>
            <span className="font-black text-white">{customMinute}'</span>
          </div>
          <input
            type="range" min={1} max={90} value={customMinute}
            onChange={e => setCustomMinute(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-blue-400 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-white/20 mt-1">
            <span>1'</span><span>45'</span><span>90'</span>
          </div>
        </div>

        {/* Scenario buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {SCENARIOS.map(sc => (
            <button
              key={sc.id}
              onClick={() => setSelectedScenario(sc.id === selectedScenario ? null : sc.id)}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold text-left transition-all border ${
                selectedScenario === sc.id
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                  : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {scenarioResult && delta ? (
          <motion.div
            key={selectedScenario}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <p className="text-[10px] text-white/40 uppercase font-bold mb-2">Nouvelles probabilités</p>
            {[
              { label: homeTeamName, prob: scenarioResult.home, d: delta.home },
              { label: "Nul", prob: scenarioResult.draw, d: delta.draw },
              { label: awayTeamName, prob: scenarioResult.away, d: delta.away },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="text-[10px] text-white/60 w-28 truncate">{row.label}</span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${row.prob}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <span className="text-xs font-black text-white w-10 text-right">{row.prob}%</span>
                <span className={`text-[10px] font-black w-12 text-right flex items-center justify-end gap-0.5 ${row.d > 0 ? "text-emerald-400" : row.d < 0 ? "text-red-400" : "text-white/30"}`}>
                  {row.d > 0 ? <TrendingUp className="h-3 w-3" /> : row.d < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                  {row.d > 0 ? "+" : ""}{row.d}%
                </span>
              </div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-4 text-[11px] text-white/30">
            Sélectionnez un scénario pour simuler l'impact
          </div>
        )}
      </div>
    </div>
  );
}
