/**
 * LiveFoot AI — AnalystePro Elite V4
 *
 * Moteur de prédiction football avancé :
 * - Double Poisson avec correction Dixon-Coles
 * - Pondération ELO exponentielle sur la forme (10 derniers matchs)
 * - Split domicile/extérieur pondéré
 * - Analyse H2H pondérée par ancienneté + tendance récente
 * - Calibration de confiance multi-modèles avec plafonds réalistes
 * - BTTS & Over/Under 0.5→4.5 via distribution de probabilités complète
 * - Score qualité données, accord modèles, volatilité, incertitudes
 */

// ─── Types ───────────────────────────────────────────────────

export interface TeamFormData {
  id: string;
  result: "W" | "D" | "L";
  goalsFor: number;
  goalsAgainst: number;
  opponent: string;
  opponentLogo: string;
  date: string;
  isHome?: boolean;
}

export interface LiveFootAIPredictionEvent {
  key: string;
  category: "result" | "goals" | "discipline" | "stats" | "special";
  label: string;
  value: string | number;
  confidence: number;
  risk: "low" | "medium" | "high";
  isVip?: boolean;
  probability?: number;
  rationale?: string;
}

export interface PredictionFactor {
  icon: string;
  label: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
  team: "home" | "away" | "both";
  weight?: number;
}

export interface BetSuggestion {
  type: string;
  label: string;
  confidence: number;
  emoji?: string;
  probability?: number;
  risk?: "low" | "medium" | "high";
  rationale?: string;
  odd?: number;
  valueScore?: number;
}

export interface LiveFootAIPrediction {
  outcome?: "home" | "draw" | "away";
  confidence: number;
  predictedScore: { home: number; away: number; probability?: number };
  probabilities: {
    home: number;
    draw: number;
    away: number;
    bttsYes?: number;
    bttsNo?: number;
    over05?: number;
    over15?: number;
    over25?: number;
    over35?: number;
    over45?: number;
    under05?: number;
    under15?: number;
    under25?: number;
    under35?: number;
    under45?: number;
  };
  factors?: PredictionFactor[];
  advice?: string;
  risk?: "low" | "medium" | "high";
  bestBets?: BetSuggestion[];
  xgHome?: number;
  xgAway?: number;
  valueBet?: string | null;
  matchState?: string;
  confidenceStars?: number;
  reasoning?: string;
  analysis?: string;
  dataQuality?: {
    level: "high" | "medium" | "low";
    usableSignals?: string[];
    missing?: string[];
  };
  safestPick?: string;
  avoidMarkets?: string[];
  marketEdges?: Array<{
    market: string;
    pick: string;
    modelProb: number;
    bookmakerProb?: number;
    edge?: number;
    confidence?: number;
  }>;
  detailedPredictions?: Record<string, string | number>;
  predictionEvents?: LiveFootAIPredictionEvent[];
  _provider?: string;

  // Elite fields
  modelVersion?: string;
  fixtureId?: string;
  predictionType?: "pre_match" | "live" | "post_match";
  dataQualityScore?: number;
  modelAgreementScore?: number;
  volatilityScore?: number;
  sampleSizeScore?: number;
  riskLevel?: "low" | "medium" | "high";
  calibrationNote?: string;
  uncertaintyReasons?: string[];
  topScores?: Array<{ score: string; probability: number }>;
  events?: Array<{
    key: string;
    category: "result" | "goals" | "discipline" | "stats" | "special";
    label: string;
    value: string | number;
    probability: number;
    confidence: number;
    risk: "low" | "medium" | "high";
    rationale: string;
    isVip: boolean;
  }>;
  keyFactors?: Array<{
    label: string;
    impact: "positive" | "negative" | "neutral";
    team: "home" | "away" | "both";
    weight: number;
    description: string;
  }>;
}

// ─── Configuration calibrée v4 ────────────────────────────────

const AI_CONFIG = {
  WEIGHTS: {
    FORM:      0.35,
    H2H:       0.12,
    RANK:      0.22,
    INJURIES:  0.13,
    MOMENTUM:  0.10,
    GOAL_DIFF: 0.08,
  },
  HOME_ADVANTAGE: 0.08,
  BASE_PROBS: { HOME: 40, DRAW: 25, AWAY: 35 },
  THRESHOLDS: { HIGH: 58, MEDIUM: 44 },
  ELO_WEIGHTS: [1.0, 0.85, 0.72, 0.61, 0.52, 0.44, 0.37, 0.32, 0.27, 0.23],
  LEAGUE_AVG_GOALS: 1.35,
};

// ─── Analyse de forme ELO avec split domicile/extérieur ───────

interface FormAnalysis {
  winRate: number;
  avgGoalsScored: number;
  avgGoalsConceded: number;
  streak: string;
  streakLength: number;
  formScore: number;
  momentum: number;
  consistency: number;
  goalDifference: number;
  xG: number;
  defensiveStrength: number;
  attackingStrength: number;
  eloRating: number;
  bttsRate: number;
  cleanSheetRate: number;
  scoringRate: number;
  volatilityScore: number;
}

function analyzeForm(form: TeamFormData[], isCurrentTeamHome: boolean = true): FormAnalysis {
  if (form.length === 0) {
    return {
      winRate: 0.33, avgGoalsScored: 1.2, avgGoalsConceded: 1.2,
      streak: "N", streakLength: 0, formScore: 50,
      momentum: 0, consistency: 0.5, goalDifference: 0,
      xG: 1.2, defensiveStrength: 50, attackingStrength: 50,
      eloRating: 50, bttsRate: 0.5, cleanSheetRate: 0.3, scoringRate: 0.7,
      volatilityScore: 0.5,
    };
  }

  const total = form.length;
  const wins  = form.filter(m => m.result === "W").length;

  // Moyennes globales
  const avgGoalsScored   = form.reduce((s, m) => s + m.goalsFor, 0) / total;
  const avgGoalsConceded = form.reduce((s, m) => s + m.goalsAgainst, 0) / total;
  const goalDifference   = form.reduce((s, m) => s + (m.goalsFor - m.goalsAgainst), 0);

  // Split home/away pondéré si disponible
  const specificMatches = form.filter(m => m.isHome !== undefined ? m.isHome === isCurrentTeamHome : true);
  const avgScoredSpec   = specificMatches.length >= 2
    ? specificMatches.reduce((s, m) => s + m.goalsFor, 0) / specificMatches.length
    : avgGoalsScored;
  const avgConcededSpec = specificMatches.length >= 2
    ? specificMatches.reduce((s, m) => s + m.goalsAgainst, 0) / specificMatches.length
    : avgGoalsConceded;

  // Blend global + spécifique (40/60 si assez de données)
  const blendedScored   = specificMatches.length >= 2
    ? avgGoalsScored * 0.4 + avgScoredSpec * 0.6
    : avgGoalsScored;
  const blendedConceded = specificMatches.length >= 2
    ? avgGoalsConceded * 0.4 + avgConcededSpec * 0.6
    : avgGoalsConceded;

  // Taux spéciaux
  const bttsRate       = form.filter(m => m.goalsFor > 0 && m.goalsAgainst > 0).length / total;
  const cleanSheetRate = form.filter(m => m.goalsAgainst === 0).length / total;
  const scoringRate    = form.filter(m => m.goalsFor > 0).length / total;

  // Streak
  const streak       = form[0]?.result || "N";
  let streakLength = 1;
  for (let i = 1; i < form.length; i++) {
    if (form[i].result === streak) streakLength++;
    else break;
  }

  // FormScore ELO pondéré
  let formScore   = 0;
  let totalWeight = 0;
  for (let i = 0; i < Math.min(form.length, 10); i++) {
    const w = AI_CONFIG.ELO_WEIGHTS[i] ?? 0.2;
    totalWeight += w;
    formScore += w * (form[i].result === "W" ? 100 : form[i].result === "D" ? 48 : 10);
  }
  formScore = totalWeight > 0 ? Math.round(formScore / totalWeight) : 50;

  // Momentum : 3 derniers vs 3 précédents
  const pts = (m: TeamFormData) => (m.result === "W" ? 3 : m.result === "D" ? 1 : 0);
  const recent3   = form.slice(0, Math.min(3, total));
  const previous3 = form.slice(3, Math.min(6, total));
  const recentPts = recent3.reduce((s, m) => s + pts(m), 0) / (recent3.length * 3);
  const prevPts   = previous3.length > 0
    ? previous3.reduce((s, m) => s + pts(m), 0) / (previous3.length * 3)
    : recentPts;
  const momentum = Math.min(1, Math.max(-1, (recentPts - prevPts) * 2.5));

  // Consistance
  const results  = form.map(pts);
  const mean     = results.reduce((a, b) => a + b, 0) / results.length;
  const variance = results.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / results.length;
  const consistency = Math.max(0, 1 - variance / 4.5);

  // xG proxy
  const xG = (blendedScored * 0.65)
    + (form.filter(m => m.goalsFor >= 2).length / total) * 0.6
    + (scoringRate * 0.3);

  // Forces normalisées 0-100
  const attackingStrength = Math.min(100, Math.max(15, blendedScored * 38 + scoringRate * 10));
  const defensiveStrength = Math.min(100, Math.max(15, (2.5 - blendedConceded) * 35 + cleanSheetRate * 15));

  // Volatilité offensive
  const goalsArr    = form.map(m => m.goalsFor);
  const avgGF       = goalsArr.reduce((a, b) => a + b, 0) / goalsArr.length;
  const varGF       = goalsArr.reduce((s, g) => s + Math.pow(g - avgGF, 2), 0) / goalsArr.length;
  const volatilityScore = Math.min(1, Math.max(0.15, Math.sqrt(varGF) / (avgGF || 1)));

  // ELO synthétique
  const eloRating = Math.round(
    formScore * 0.5
    + (wins / total) * 30
    + attackingStrength * 0.1
    + defensiveStrength * 0.1
  );

  return {
    winRate: wins / total, avgGoalsScored: blendedScored, avgGoalsConceded: blendedConceded,
    streak, streakLength, formScore,
    momentum, consistency, goalDifference,
    xG, defensiveStrength, attackingStrength,
    eloRating, bttsRate, cleanSheetRate, scoringRate,
    volatilityScore,
  };
}

// ─── Double Poisson (Dixon-Coles) ─────────────────────────────

function poissonProb(lambda: number, k: number): number {
  let logProb = -lambda + k * Math.log(lambda);
  for (let i = 2; i <= k; i++) logProb -= Math.log(i);
  return Math.exp(logProb);
}

function dixonColesRho(h: number, a: number, rho: number): number {
  if (h === 0 && a === 0) return 1 - rho;
  if (h === 1 && a === 0) return 1 + rho;
  if (h === 0 && a === 1) return 1 + rho;
  if (h === 1 && a === 1) return 1 - rho;
  return 1;
}

interface PoissonResult {
  home: number;
  away: number;
  lambdaHome: number;
  lambdaAway: number;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  bttsProb: number;
  over05Prob: number;
  over15Prob: number;
  over25Prob: number;
  over35Prob: number;
  over45Prob: number;
  under05Prob: number;
  under15Prob: number;
  under25Prob: number;
  under35Prob: number;
  under45Prob: number;
  scoreProbabilities: Array<{ score: string; probability: number }>;
}

function computeDoublePoissonDixonColes(
  hAttack: number,
  hDefense: number,
  aAttack: number,
  aDefense: number,
  homeAdv: number,
): PoissonResult {
  const mu       = AI_CONFIG.LEAGUE_AVG_GOALS;
  const hAtkMult = hAttack / 50;
  const hDefMult = hDefense / 50;
  const aAtkMult = aAttack / 50;
  const aDefMult = aDefense / 50;

  const lambdaHome = Math.max(0.25, mu * hAtkMult * (2 - aDefMult) * (1 + homeAdv));
  const lambdaAway = Math.max(0.25, mu * aAtkMult * (2 - hDefMult));

  const RHO   = -0.13;
  const MAX_G = 6;

  let homeWin = 0, draw = 0, awayWin = 0;
  let btts = 0, over05 = 0, over15 = 0, over25 = 0, over35 = 0, over45 = 0;
  const scoresList: Array<{ score: string; probability: number }> = [];

  for (let h = 0; h <= MAX_G; h++) {
    for (let a = 0; a <= MAX_G; a++) {
      const p = poissonProb(lambdaHome, h)
              * poissonProb(lambdaAway, a)
              * dixonColesRho(h, a, RHO);
      if (p < 0) continue;

      if (h > a)  homeWin += p;
      if (h === a) draw   += p;
      if (a > h)  awayWin += p;
      if (h > 0 && a > 0)  btts   += p;
      if (h + a > 0.5)     over05 += p;
      if (h + a > 1.5)     over15 += p;
      if (h + a > 2.5)     over25 += p;
      if (h + a > 3.5)     over35 += p;
      if (h + a > 4.5)     over45 += p;

      scoresList.push({ score: `${h}-${a}`, probability: Math.round(p * 100) });
    }
  }

  scoresList.sort((a, b) => b.probability - a.probability);
  const bestH = parseInt(scoresList[0]?.score?.split("-")[0] ?? "1");
  const bestA = parseInt(scoresList[0]?.score?.split("-")[1] ?? "0");

  return {
    home: bestH, away: bestA,
    lambdaHome, lambdaAway,
    homeWinProb: homeWin * 100,
    drawProb:    draw    * 100,
    awayWinProb: awayWin * 100,
    bttsProb:    btts    * 100,
    over05Prob:  over05  * 100,
    over15Prob:  over15  * 100,
    over25Prob:  over25  * 100,
    over35Prob:  over35  * 100,
    over45Prob:  over45  * 100,
    under05Prob: (1 - over05) * 100,
    under15Prob: (1 - over15) * 100,
    under25Prob: (1 - over25) * 100,
    under35Prob: (1 - over35) * 100,
    under45Prob: (1 - over45) * 100,
    scoreProbabilities: scoresList,
  };
}

// ─── Analyse H2H pondérée par ancienneté ─────────────────────

function analyzeH2H(
  h2hMatches: any[],
  homeTeamId: string,
): { homeWins: number; draws: number; awayWins: number; homeAdvantage: number; avgGoals: number; recentTrend: number } {
  if (!h2hMatches || h2hMatches.length === 0) {
    return { homeWins: 0, draws: 0, awayWins: 0, homeAdvantage: 0.5, avgGoals: 2.5, recentTrend: 0 };
  }

  let homeWins = 0, draws = 0, awayWins = 0, totalGoals = 0;
  let weightedHomeScore = 0, totalH2hWeight = 0;

  h2hMatches.forEach((m, idx) => {
    const w = Math.pow(0.8, idx);
    totalH2hWeight += w;
    const isHomeTeamHome = String(m.teams?.home?.id) === homeTeamId;
    const hg = m.goals?.home ?? 0;
    const ag = m.goals?.away ?? 0;
    totalGoals += hg + ag;
    let homeResult = 0;
    if (hg === ag) { draws++; homeResult = 0.5; }
    else if (isHomeTeamHome ? hg > ag : ag > hg) { homeWins++; homeResult = 1; }
    else { awayWins++; homeResult = 0; }
    weightedHomeScore += w * homeResult;
  });

  const total         = h2hMatches.length;
  const homeAdvantage = weightedHomeScore / totalH2hWeight;
  const avgGoals      = totalGoals / total;
  const recent2       = h2hMatches.slice(0, Math.min(2, total));
  const recentTrend   = recent2.reduce((s, m) => {
    const isHome = String(m.teams?.home?.id) === homeTeamId;
    const hg = m.goals?.home ?? 0, ag = m.goals?.away ?? 0;
    if (hg === ag) return s;
    return s + ((isHome ? hg > ag : ag > hg) ? 1 : -1);
  }, 0) / (recent2.length || 1);

  return { homeWins, draws, awayWins, homeAdvantage, avgGoals, recentTrend };
}

// ─── Analyse classement ──────────────────────────────────────

function analyzeStandings(
  standings: any[],
  homeTeamId: string,
  awayTeamId: string,
): { homeRank: number; awayRank: number; rankDiff: number; homePoints: number; awayPoints: number; ptsDiff: number } {
  if (!standings || standings.length === 0) {
    return { homeRank: 10, awayRank: 10, rankDiff: 0, homePoints: 0, awayPoints: 0, ptsDiff: 0 };
  }
  const hTeam      = standings.find((s: any) => String(s?.team?.id) === String(homeTeamId));
  const aTeam      = standings.find((s: any) => String(s?.team?.id) === String(awayTeamId));
  const homeRank   = hTeam?.rank   ?? 10;
  const awayRank   = aTeam?.rank   ?? 10;
  const homePoints = hTeam?.points ?? 0;
  const awayPoints = aTeam?.points ?? 0;
  return {
    homeRank, awayRank,
    rankDiff:  awayRank - homeRank,
    homePoints, awayPoints,
    ptsDiff:   homePoints - awayPoints,
  };
}

// ─── Moteur principal ─────────────────────────────────────────

export function generatePrediction(params: {
  homeForm: TeamFormData[];
  awayForm: TeamFormData[];
  h2hMatches?: any[];
  standings?: any[];
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  injuries?: { home: number; away: number };
}): LiveFootAIPrediction {
  const {
    homeForm, awayForm, h2hMatches, standings,
    homeTeamId, awayTeamId, homeTeamName, awayTeamName,
    injuries,
  } = params;

  const hForm = analyzeForm(homeForm, true);
  const aForm = analyzeForm(awayForm, false);
  const h2h   = analyzeH2H(h2hMatches || [], homeTeamId);
  const rank  = analyzeStandings(standings || [], homeTeamId, awayTeamId);

  const factors: PredictionFactor[] = [];

  // ─── 1. Forme ELO ────────────────────────────────────────
  let formWeight = 0;
  const formDelta = hForm.formScore - aForm.formScore;
  if (formDelta > 12) {
    formWeight = Math.min(formDelta * 0.75, 38);
    factors.push({ icon: "🔥", label: "Forme dominante",
      description: `${homeTeamName} nettement en meilleure forme (ELO ${hForm.eloRating} vs ${aForm.eloRating})`,
      impact: "positive", team: "home", weight: 8 });
  } else if (formDelta < -12) {
    formWeight = Math.max(formDelta * 0.75, -38);
    factors.push({ icon: "🔥", label: "Forme dominante",
      description: `${awayTeamName} nettement en meilleure forme (ELO ${aForm.eloRating} vs ${hForm.eloRating})`,
      impact: "positive", team: "away", weight: 8 });
  } else {
    factors.push({ icon: "⚖️", label: "Forme équilibrée",
      description: `Les deux équipes affichent un niveau de forme similaire`,
      impact: "neutral", team: "both", weight: 4 });
  }

  if (hForm.streak === "W" && hForm.streakLength >= 3) {
    formWeight += 9;
    factors.push({ icon: "⚡", label: "Série de victoires",
      description: `${homeTeamName} : ${hForm.streakLength} victoires consécutives`,
      impact: "positive", team: "home", weight: 6 });
  }
  if (aForm.streak === "W" && aForm.streakLength >= 3) {
    formWeight -= 9;
    factors.push({ icon: "⚡", label: "Série de victoires",
      description: `${awayTeamName} : ${aForm.streakLength} victoires consécutives`,
      impact: "positive", team: "away", weight: 6 });
  }
  if (hForm.streak === "L" && hForm.streakLength >= 2) {
    formWeight -= 7;
    factors.push({ icon: "📉", label: "Mauvaise passe",
      description: `${homeTeamName} enchaîne ${hForm.streakLength} défaites`,
      impact: "negative", team: "home", weight: 5 });
  }
  if (aForm.streak === "L" && aForm.streakLength >= 2) {
    formWeight += 7;
    factors.push({ icon: "📉", label: "Mauvaise passe",
      description: `${awayTeamName} enchaîne ${aForm.streakLength} défaites`,
      impact: "negative", team: "away", weight: 5 });
  }
  if (hForm.momentum > 0.35) {
    formWeight += 6;
    factors.push({ icon: "📈", label: "Momentum ascendant",
      description: `${homeTeamName} en nette progression sur ses derniers matchs`,
      impact: "positive", team: "home", weight: 5 });
  }
  if (aForm.momentum > 0.35) {
    formWeight -= 6;
    factors.push({ icon: "📈", label: "Momentum ascendant",
      description: `${awayTeamName} en nette progression sur ses derniers matchs`,
      impact: "positive", team: "away", weight: 5 });
  }

  // ─── 2. H2H ──────────────────────────────────────────────
  let h2hWeight = 0;
  const numH2h  = h2hMatches ? h2hMatches.length : 0;
  let wForm = AI_CONFIG.WEIGHTS.FORM;
  let wH2h  = AI_CONFIG.WEIGHTS.H2H;
  let wRank = AI_CONFIG.WEIGHTS.RANK;
  if (numH2h < 3) { wForm += 0.04; wRank += 0.03; wH2h = 0.05; }

  if (h2hMatches && h2hMatches.length > 0) {
    h2hWeight = (h2h.homeAdvantage - 0.5) * 28;
    if (h2h.homeWins > h2h.awayWins + 1) {
      factors.push({ icon: "⚔️", label: "Historique favorable",
        description: `${homeTeamName} domine les confrontations directes (${h2h.homeWins}V-${h2h.draws}N-${h2h.awayWins}D)`,
        impact: "positive", team: "home", weight: 6 });
    } else if (h2h.awayWins > h2h.homeWins + 1) {
      factors.push({ icon: "⚔️", label: "Historique favorable",
        description: `${awayTeamName} domine les confrontations directes (${h2h.awayWins}V-${h2h.draws}N-${h2h.homeWins}D)`,
        impact: "positive", team: "away", weight: 6 });
    }
    if (h2h.recentTrend > 0.5) {
      h2hWeight += 4;
      factors.push({ icon: "🔄", label: "Tendance H2H récente",
        description: `${homeTeamName} gagne les confrontations les plus récentes`,
        impact: "positive", team: "home", weight: 4 });
    }
  }

  // ─── 3. Classement ───────────────────────────────────────
  let rankWeight = 0;
  if (standings && standings.length > 0) {
    const combinedDiff = rank.rankDiff * 1.5 + rank.ptsDiff * 0.3;
    if (combinedDiff > 6) {
      rankWeight = Math.min(combinedDiff * 2.2, 24);
      factors.push({ icon: "🏆", label: "Écart au classement",
        description: `${homeTeamName} (${rank.homeRank}e, ${rank.homePoints}pts) supérieur à ${awayTeamName} (${rank.awayRank}e, ${rank.awayPoints}pts)`,
        impact: "positive", team: "home", weight: 7 });
    } else if (combinedDiff < -6) {
      rankWeight = Math.max(combinedDiff * 2.2, -24);
      factors.push({ icon: "🏆", label: "Écart au classement",
        description: `${awayTeamName} (${rank.awayRank}e, ${rank.awayPoints}pts) supérieur à ${homeTeamName} (${rank.homeRank}e, ${rank.homePoints}pts)`,
        impact: "positive", team: "away", weight: 7 });
    }
  }

  // ─── 4. Avantage domicile ─────────────────────────────────
  const homeBonus = AI_CONFIG.HOME_ADVANTAGE * 100;
  factors.push({ icon: "🏟️", label: "Avantage domicile",
    description: `${homeTeamName} joue à domicile (+8% historiquement)`,
    impact: "positive", team: "home", weight: 5 });

  // ─── 5. Blessures ────────────────────────────────────────
  let injuryWeight = 0;
  if (injuries) {
    const injDelta = injuries.home - injuries.away;
    if (injDelta >= 2) {
      injuryWeight = -Math.min(injDelta * 3.5, 14);
      factors.push({ icon: "🏥", label: "Absences importantes",
        description: `${homeTeamName} réduit avec ${injuries.home} absents vs ${injuries.away}`,
        impact: "negative", team: "home", weight: 6 });
    } else if (injDelta <= -2) {
      injuryWeight = Math.min(Math.abs(injDelta) * 3.5, 14);
      factors.push({ icon: "🏥", label: "Absences importantes",
        description: `${awayTeamName} réduit avec ${injuries.away} absents vs ${injuries.home}`,
        impact: "negative", team: "away", weight: 6 });
    }
  }

  // ─── 6. Différentiel de buts ─────────────────────────────
  const goalDiffScore = (hForm.goalDifference - aForm.goalDifference) * 0.8;

  // ─── Score combiné ───────────────────────────────────────
  const rawScore =
    (formWeight   * wForm) +
    (h2hWeight    * wH2h)  +
    (rankWeight   * wRank) +
    (injuryWeight * AI_CONFIG.WEIGHTS.INJURIES) +
    (hForm.momentum * AI_CONFIG.WEIGHTS.MOMENTUM * 30) -
    (aForm.momentum * AI_CONFIG.WEIGHTS.MOMENTUM * 30) +
    (goalDiffScore  * AI_CONFIG.WEIGHTS.GOAL_DIFF) +
    homeBonus;

  // ─── Probabilités statistiques ───────────────────────────
  let homeProbStat = Math.max(5, Math.min(88, AI_CONFIG.BASE_PROBS.HOME + rawScore));
  let drawProbStat = Math.max(8, Math.min(38, AI_CONFIG.BASE_PROBS.DRAW - Math.abs(rawScore) * 0.28));
  let awayProbStat = Math.max(5, Math.min(88, AI_CONFIG.BASE_PROBS.AWAY - rawScore));
  const totalStat  = homeProbStat + drawProbStat + awayProbStat;
  homeProbStat = Math.round((homeProbStat / totalStat) * 100);
  drawProbStat = Math.round((drawProbStat / totalStat) * 100);
  awayProbStat = 100 - homeProbStat - drawProbStat;

  // ─── Modèle Double Poisson ───────────────────────────────
  const poisson = computeDoublePoissonDixonColes(
    hForm.attackingStrength, hForm.defensiveStrength,
    aForm.attackingStrength, aForm.defensiveStrength,
    AI_CONFIG.HOME_ADVANTAGE,
  );

  // Fusion 60% stat + 40% Poisson
  const homeProb = Math.round(homeProbStat * 0.60 + poisson.homeWinProb * 0.40);
  const drawProb = Math.round(drawProbStat  * 0.60 + poisson.drawProb   * 0.40);
  const awayProb = 100 - homeProb - drawProb;

  // Outcome
  let outcome: "home" | "draw" | "away";
  if (homeProb >= drawProb && homeProb >= awayProb) outcome = "home";
  else if (awayProb >= homeProb && awayProb >= drawProb) outcome = "away";
  else outcome = "draw";

  // Score prédit
  let predictedHome = poisson.home;
  let predictedAway = poisson.away;
  if (outcome === "home" && predictedHome <= predictedAway) predictedHome = predictedAway + 1;
  else if (outcome === "away" && predictedAway <= predictedHome) predictedAway = predictedHome + 1;
  else if (outcome === "draw") {
    const avg = Math.round((predictedHome + predictedAway) / 2);
    predictedHome = avg; predictedAway = avg;
  }
  predictedHome = Math.max(0, Math.min(5, predictedHome));
  predictedAway = Math.max(0, Math.min(5, predictedAway));

  const xgHome = Number(poisson.lambdaHome.toFixed(2));
  const xgAway = Number(poisson.lambdaAway.toFixed(2));

  // ─── Qualité données & accord modèles ────────────────────
  const sampleSizeScore = Math.min(10, homeForm.length + awayForm.length) / 10;
  const dataQualityScore = parseFloat((
    sampleSizeScore * 0.5 +
    (standings && standings.length > 0 ? 0.3 : 0) +
    (h2hMatches && h2hMatches.length >= 3 ? 0.2 : 0)
  ).toFixed(2));

  const poissonOutcome = poisson.homeWinProb > poisson.awayWinProb && poisson.homeWinProb > poisson.drawProb
    ? "home" : poisson.awayWinProb > poisson.homeWinProb && poisson.awayWinProb > poisson.drawProb ? "away" : "draw";
  const eloOutcome     = hForm.formScore > aForm.formScore + 10 ? "home"
    : aForm.formScore > hForm.formScore + 10 ? "away" : "draw";
  const rankOutcome    = standings && standings.length > 0
    ? (rank.rankDiff > 4 ? "home" : rank.rankDiff < -4 ? "away" : "draw")
    : outcome;

  let agreementCount = 0;
  if (poissonOutcome === outcome) agreementCount++;
  if (eloOutcome     === outcome) agreementCount++;
  if (rankOutcome    === outcome) agreementCount++;
  const modelAgreementScore = parseFloat((agreementCount / 3).toFixed(2));

  const volatilityScore = parseFloat(((hForm.volatilityScore + aForm.volatilityScore) / 2).toFixed(2));

  // ─── Calibration de confiance ────────────────────────────
  let rawConf = Math.max(homeProb, awayProb, drawProb);
  const uncertaintyReasons: string[] = [];

  if (dataQualityScore < 0.6) {
    rawConf = Math.min(55, rawConf);
    uncertaintyReasons.push("Échantillon de données historique limité");
  }
  if (modelAgreementScore <= 0.33) {
    rawConf = Math.min(60, rawConf);
    uncertaintyReasons.push("Divergence entre les modèles Poisson, ELO et Classement");
  }
  if (volatilityScore > 0.65) {
    rawConf -= 6;
    uncertaintyReasons.push("Volatilité offensive élevée sur les derniers matchs");
  }
  if (injuries && (injuries.home >= 3 || injuries.away >= 3)) {
    rawConf -= 4;
    uncertaintyReasons.push("Absences de joueurs clés impactant les effectifs");
  }

  const capMax = modelAgreementScore >= 0.66 && dataQualityScore >= 0.8 ? 85 : 80;
  const finalConfidence = Math.round(Math.max(15, Math.min(capMax, rawConf)));

  const calibrationNote = modelAgreementScore >= 0.66
    ? "Modèle fortement convergent. Haute cohérence Poisson/ELO."
    : modelAgreementScore <= 0.33
      ? "Calibré avec réserve — divergences sur les dynamiques."
      : "Modèle stabilisé. Convergence moyenne.";

  const confidenceStars = Math.min(5, Math.max(1, Math.round((finalConfidence / 100) * 5)));

  // Risk
  const avgConsistency = (hForm.consistency + aForm.consistency) / 2;
  const riskIndex = finalConfidence * (0.75 + avgConsistency * 0.25);
  const risk: "low" | "medium" | "high" = riskIndex >= 58 ? "low" : riskIndex >= 44 ? "medium" : "high";

  // ─── Conseil ─────────────────────────────────────────────
  let advice: string;
  if (outcome === "home") {
    advice = finalConfidence >= 58
      ? `Victoire de ${homeTeamName} fortement probable (${finalConfidence}%) — ELO, domicile et classement convergent.`
      : `Légère tendance pour ${homeTeamName} (${finalConfidence}%) — match ouvert, Double Chance conseillée.`;
  } else if (outcome === "away") {
    advice = finalConfidence >= 55
      ? `${awayTeamName} favori (${finalConfidence}%) à l'extérieur — supériorité technique et de forme confirmée.`
      : `${awayTeamName} légèrement favori (${finalConfidence}%) — nul reste très possible.`;
  } else {
    advice = `Match très indécis — le partage des points est le scénario le plus probable (${finalConfidence}%). Privilégier BTTS ou Double Chance.`;
  }

  // ─── Meilleurs paris ─────────────────────────────────────
  const bestBets: BetSuggestion[] = [];

  if (outcome === "home")
    bestBets.push({ type: "1X2", label: `Victoire ${homeTeamName}`, confidence: homeProb, probability: homeProb, risk, emoji: "🏠", odd: 1.80, valueScore: 1.02 });
  else if (outcome === "away")
    bestBets.push({ type: "1X2", label: `Victoire ${awayTeamName}`, confidence: awayProb, probability: awayProb, risk, emoji: "✈️", odd: 1.80, valueScore: 1.01 });
  else
    bestBets.push({ type: "1X2", label: "Match Nul", confidence: drawProb, probability: drawProb, risk, emoji: "🤝", odd: 3.20, valueScore: 0.98 });

  if (poisson.over25Prob > 52) {
    bestBets.push({ type: "O/U", label: "Plus de 2.5 buts", confidence: Math.round(poisson.over25Prob), probability: Math.round(poisson.over25Prob), risk: poisson.over25Prob > 65 ? "low" : "medium", emoji: "⚽", odd: 1.90, valueScore: 1.05 });
  } else {
    bestBets.push({ type: "O/U", label: "Moins de 2.5 buts", confidence: Math.round(poisson.under25Prob), probability: Math.round(poisson.under25Prob), risk: poisson.under25Prob > 65 ? "low" : "medium", emoji: "🛡️", odd: 1.80, valueScore: 1.01 });
  }

  const bttsConf = Math.round(poisson.bttsProb);
  if (bttsConf > 52) {
    bestBets.push({ type: "BTTS", label: "Les deux équipes marquent", confidence: bttsConf, probability: bttsConf, risk: bttsConf > 65 ? "low" : "medium", emoji: "🎯", odd: 1.70, valueScore: 1.02 });
  } else {
    bestBets.push({ type: "BTTS Non", label: "Une seule équipe marque (ou 0-0)", confidence: 100 - bttsConf, probability: 100 - bttsConf, risk: "medium", emoji: "🚫", odd: 2.00, valueScore: 0.99 });
  }

  bestBets.push({ type: "Score Exact", label: `${predictedHome}-${predictedAway}`, confidence: Math.max(12, finalConfidence - 28), probability: Math.max(12, finalConfidence - 28), risk: "high", emoji: "🎯", odd: 6.50, valueScore: 1.10 });

  if (outcome === "home") {
    bestBets.push({ type: "Double Chance", label: `${homeTeamName} ou Nul (1X)`, confidence: Math.min(95, homeProb + drawProb), probability: Math.min(95, homeProb + drawProb), risk: "low", emoji: "🛡️", odd: 1.25, valueScore: 1.01 });
  } else if (outcome === "away") {
    bestBets.push({ type: "Double Chance", label: `${awayTeamName} ou Nul (X2)`, confidence: Math.min(95, awayProb + drawProb), probability: Math.min(95, awayProb + drawProb), risk: "low", emoji: "🛡️", odd: 1.30, valueScore: 1.02 });
  }

  const dnbTeam = homeProb > awayProb ? homeTeamName : awayTeamName;
  const dnbConf = Math.min(97, Math.max(homeProb, awayProb) + Math.round(drawProb * 0.35));
  bestBets.push({ type: "DNB", label: `DNB : ${dnbTeam}`, confidence: dnbConf, probability: dnbConf, risk: "medium", emoji: "🛡️", odd: 1.45, valueScore: 1.03 });

  if (outcome === "home" && aForm.avgGoalsScored < 0.75 && hForm.cleanSheetRate > 0.4) {
    bestBets.push({ type: "Spécial", label: `${homeTeamName} sans encaisser`, confidence: Math.round(hForm.cleanSheetRate * 85), probability: Math.round(hForm.cleanSheetRate * 85), risk: "medium", emoji: "🧤", odd: 2.20, valueScore: 1.00 });
  } else if (outcome === "away" && hForm.avgGoalsScored < 0.75 && aForm.cleanSheetRate > 0.4) {
    bestBets.push({ type: "Spécial", label: `${awayTeamName} sans encaisser`, confidence: Math.round(aForm.cleanSheetRate * 85), probability: Math.round(aForm.cleanSheetRate * 85), risk: "medium", emoji: "🧤", odd: 2.20, valueScore: 1.00 });
  }

  // ─── Prediction Events ───────────────────────────────────
  const getEventRisk = (conf: number): "low" | "medium" | "high" => {
    if (conf >= 70) return "low";
    if (conf >= 54) return "medium";
    return "high";
  };

  const predictionEvents: LiveFootAIPredictionEvent[] = [];
  const totalExpectedGoals = xgHome + xgAway;
  const htftLabel = outcome === "home" ? `${homeTeamName} / ${homeTeamName}` : outcome === "away" ? `${awayTeamName} / ${awayTeamName}` : "Nul / Nul";

  // Result
  predictionEvents.push({ key: "winner", category: "result", label: "Résultat 1X2", value: outcome === "home" ? homeTeamName : outcome === "away" ? awayTeamName : "Match Nul", confidence: finalConfidence, risk: getEventRisk(finalConfidence), isVip: false, probability: finalConfidence, rationale: `${calibrationNote}` });
  predictionEvents.push({ key: "exactScore", category: "result", label: "Score exact", value: `${predictedHome}-${predictedAway}`, confidence: Math.max(12, finalConfidence - 28), risk: "high", isVip: true, probability: Math.max(12, finalConfidence - 28), rationale: "Calculé par distribution Dixon-Coles" });
  const dcVal  = outcome === "home" ? "1X" : outcome === "away" ? "X2" : "12";
  const dcConf = Math.min(95, outcome === "home" ? homeProb + drawProb : outcome === "away" ? awayProb + drawProb : homeProb + awayProb);
  predictionEvents.push({ key: "doubleChance", category: "result", label: "Double chance", value: dcVal, confidence: dcConf, risk: "low", isVip: false, probability: dcConf, rationale: "Couverture standard" });
  predictionEvents.push({ key: "dnb", category: "result", label: "Draw no bet", value: dnbTeam, confidence: dnbConf, risk: "medium", isVip: true, probability: dnbConf, rationale: "Remboursé si match nul" });

  // Goals
  predictionEvents.push({ key: "overUnder05", category: "goals", label: "Buts +/- 0.5", value: "Plus de 0.5", confidence: Math.round(poisson.over05Prob), risk: "low", isVip: true, probability: Math.round(poisson.over05Prob), rationale: "Projection issue de la distribution de buts" });
  const ov15conf = Math.round(poisson.over15Prob > 50 ? poisson.over15Prob : 100 - poisson.over15Prob);
  predictionEvents.push({ key: "overUnder15", category: "goals", label: "Buts +/- 1.5", value: poisson.over15Prob > 50 ? "Plus de 1.5" : "Moins de 1.5", confidence: ov15conf, risk: getEventRisk(ov15conf), isVip: true, probability: ov15conf, rationale: "Rythme de jeu récent" });
  const ov25conf = Math.round(poisson.over25Prob > 50 ? poisson.over25Prob : 100 - poisson.over25Prob);
  predictionEvents.push({ key: "overUnder25", category: "goals", label: "Buts +/- 2.5", value: totalExpectedGoals > 2.5 ? "Plus de 2.5" : "Moins de 2.5", confidence: ov25conf, risk: getEventRisk(ov25conf), isVip: false, probability: ov25conf, rationale: "Seuil statistique clé" });
  const ov35conf = Math.round(poisson.over35Prob > 50 ? poisson.over35Prob : 100 - poisson.over35Prob);
  predictionEvents.push({ key: "overUnder35", category: "goals", label: "Buts +/- 3.5", value: totalExpectedGoals > 3.5 ? "Plus de 3.5" : "Moins de 3.5", confidence: ov35conf, risk: "high", isVip: true, probability: ov35conf, rationale: "Scénario offensif débridé" });
  const ov45conf = Math.round(poisson.over45Prob > 50 ? poisson.over45Prob : 100 - poisson.over45Prob);
  predictionEvents.push({ key: "overUnder45", category: "goals", label: "Buts +/- 4.5", value: totalExpectedGoals > 4.5 ? "Plus de 4.5" : "Moins de 4.5", confidence: ov45conf, risk: "low", isVip: true, probability: ov45conf, rationale: "Tendance buts historique" });
  const bttsEventConf = bttsConf > 52 ? bttsConf : 100 - bttsConf;
  predictionEvents.push({ key: "btts", category: "goals", label: "Les 2 marquent", value: poisson.bttsProb > 52 ? "Oui" : "Non", confidence: bttsEventConf, risk: getEventRisk(bttsEventConf), isVip: false, probability: bttsEventConf, rationale: "Capacités défensives croisées" });

  let csVal = "Aucune", csConf = 50;
  if (hForm.cleanSheetRate > 0.4 && aForm.avgGoalsScored < 0.8) { csVal = homeTeamName; csConf = Math.round(hForm.cleanSheetRate * 100); }
  else if (aForm.cleanSheetRate > 0.4 && hForm.avgGoalsScored < 0.8) { csVal = awayTeamName; csConf = Math.round(aForm.cleanSheetRate * 100); }
  predictionEvents.push({ key: "cleanSheet", category: "goals", label: "Clean sheet", value: csVal, confidence: csConf, risk: getEventRisk(csConf), isVip: true, probability: csConf, rationale: "Rigidité défensive sur les derniers matchs" });

  // Discipline
  const homeCorners  = Math.round(4.5 + (hForm.attackingStrength / 25));
  const awayCorners  = Math.round(4.0 + (aForm.attackingStrength / 25));
  const totalCorners = homeCorners + awayCorners;
  predictionEvents.push({ key: "corners", category: "discipline", label: "Corners total", value: totalCorners > 9.5 ? "Plus de 9.5" : "Moins de 9.5", confidence: 60, risk: "medium", isVip: true, probability: 60, rationale: "Volume de centres anticipé" });
  predictionEvents.push({ key: "cornersTeam", category: "discipline", label: "Corners par équipe", value: homeCorners > awayCorners ? `${homeTeamName} (+)` : awayCorners > homeCorners ? `${awayTeamName} (+)` : "Égalité", confidence: 58, risk: "medium", isVip: true, probability: 58, rationale: "Domination territoriale" });
  predictionEvents.push({ key: "cards", category: "discipline", label: "Cartons total", value: hForm.consistency > 0.6 ? "Moins de 4.5" : "Plus de 3.5", confidence: 62, risk: "medium", isVip: true, probability: 62, rationale: "Intensité du match" });
  predictionEvents.push({ key: "faults", category: "discipline", label: "Fautes total", value: "Plus de 21.5", confidence: 65, risk: "medium", isVip: true, probability: 65, rationale: "Rythme physique moyen" });

  // Stats
  const homePoss = Math.round(50 + (hForm.attackingStrength - aForm.attackingStrength) * 0.15);
  const clampedHomePoss = Math.max(38, Math.min(62, homePoss));
  predictionEvents.push({ key: "possession", category: "stats", label: "Possession prévue", value: `${clampedHomePoss}% - ${100 - clampedHomePoss}%`, confidence: 70, risk: "low", isVip: true, probability: 70, rationale: "Domination territoriale prévue" });
  const totalShots = Math.round(20 + (hForm.attackingStrength + aForm.attackingStrength) * 0.08);
  predictionEvents.push({ key: "shotsTotal", category: "stats", label: "Tirs totaux", value: `Plus de ${totalShots - 2.5}`, confidence: 63, risk: "medium", isVip: true, probability: 63, rationale: "Volume offensif estimé" });
  const shotsOnTarget = Math.round(7.5 + (hForm.attackingStrength + aForm.attackingStrength) * 0.03);
  predictionEvents.push({ key: "shotsOnTarget", category: "stats", label: "Tirs cadrés", value: `Plus de ${shotsOnTarget - 1.5}`, confidence: 60, risk: "medium", isVip: true, probability: 60, rationale: "Précision offensive" });

  // Special
  predictionEvents.push({ key: "htft", category: "special", label: "Mi-temps / Fin", value: htftLabel, confidence: Math.max(18, finalConfidence - 22), risk: getEventRisk(Math.max(18, finalConfidence - 22)), isVip: true, probability: Math.max(18, finalConfidence - 22), rationale: "Cohérence de la performance mi-temps/finale" });
  predictionEvents.push({ key: "firstScorerTeam", category: "special", label: "1er buteur équipe", value: outcome === "home" ? homeTeamName : outcome === "away" ? awayTeamName : "Aucun", confidence: Math.min(80, Math.max(homeProb, awayProb) + 5), risk: "medium", isVip: true, probability: Math.min(80, Math.max(homeProb, awayProb) + 5), rationale: "Favori offensif" });
  predictionEvents.push({ key: "timingFirstGoal", category: "special", label: "Temps 1er but", value: totalExpectedGoals > 2.5 ? "1-30 min" : "31-75 min", confidence: 58, risk: "high", isVip: true, probability: 58, rationale: "Intensité de début de match" });
  predictionEvents.push({ key: "highestScoringHalf", category: "special", label: "Mi-temps + prolifique", value: "2ème mi-temps", confidence: 58, risk: "medium", isVip: true, probability: 58, rationale: "Lecture prudente faute de stats de rythme par mi-temps" });
  const marginVal   = Math.abs(predictedHome - predictedAway);
  const marginLabel = marginVal === 0 ? "Match Nul" : `${marginVal} but(s)`;
  predictionEvents.push({ key: "winningMargin", category: "special", label: "Marge de victoire", value: marginLabel, confidence: Math.max(30, finalConfidence - 25), risk: getEventRisk(Math.max(30, finalConfidence - 25)), isVip: true, probability: Math.max(30, finalConfidence - 25), rationale: "Calculé par Poisson" });
  predictionEvents.push({ key: "penalty", category: "special", label: "Penalty accordé", value: "Non", confidence: 76, risk: "low", isVip: true, probability: 76, rationale: "Probabilité historique en l'absence de données live" });
  predictionEvents.push({ key: "var", category: "special", label: "Recours VAR", value: "Oui", confidence: 58, risk: "high", isVip: true, probability: 58, rationale: "Fréquence VAR dans les ligues modernes" });

  // ─── Elite output fields ──────────────────────────────────
  const topScores = poisson.scoreProbabilities.slice(0, 3).map(s => ({
    score: s.score, probability: s.probability
  }));

  const events = predictionEvents.map(e => ({
    key: e.key,
    category: e.category,
    label: e.label,
    value: e.value,
    probability: e.probability || e.confidence,
    confidence: e.confidence,
    risk: e.risk,
    rationale: e.rationale || "Calculé par modèle local",
    isVip: !!e.isVip
  }));

  const keyFactors = factors.map(f => ({
    label: f.label,
    impact: f.impact,
    team: f.team,
    weight: f.weight || 5,
    description: f.description
  }));

  return {
    outcome,
    confidence: finalConfidence,
    predictedScore: { home: predictedHome, away: predictedAway, probability: topScores[0]?.probability || 15 },
    probabilities: {
      home: homeProb, draw: drawProb, away: awayProb,
      bttsYes: bttsConf, bttsNo: 100 - bttsConf,
      over05: Math.round(poisson.over05Prob),
      over15: Math.round(poisson.over15Prob),
      over25: Math.round(poisson.over25Prob),
      over35: Math.round(poisson.over35Prob),
      over45: Math.round(poisson.over45Prob),
      under05: Math.round(poisson.under05Prob),
      under15: Math.round(poisson.under15Prob),
      under25: Math.round(poisson.under25Prob),
      under35: Math.round(poisson.under35Prob),
      under45: Math.round(poisson.under45Prob),
    },
    factors: factors.slice(0, 7),
    advice,
    risk,
    bestBets,
    xgHome,
    xgAway,
    predictionEvents,
    _provider: "local",

    // Elite
    modelVersion: "LiveFoot AnalystePro Elite V5",
    fixtureId: `${homeTeamId}_${awayTeamId}`,
    predictionType: "pre_match",
    dataQualityScore,
    modelAgreementScore,
    volatilityScore,
    sampleSizeScore: parseFloat(sampleSizeScore.toFixed(2)),
    riskLevel: risk,
    calibrationNote,
    uncertaintyReasons,
    topScores,
    events,
    keyFactors,
    confidenceStars,
    analysis: advice,
    reasoning: `Poisson λH=${xgHome}, λA=${xgAway} | Dixon-Coles ρ=-0.13 | ELO Δ=${formDelta} | Rank Δ=${rank.rankDiff} | DQ=${dataQualityScore} | Agreement=${modelAgreementScore}`,
  };
}
