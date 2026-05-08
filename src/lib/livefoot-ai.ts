/**
 * LiveFoot AI — Algorithme de Prédiction Intelligent
 * 
 * Analyse les données de forme récente, confrontations directes,
 * classements et blessures pour générer des prédictions fiables.
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
}

export interface LiveFootAIPrediction {
  /** Main predicted outcome */
  outcome: "home" | "draw" | "away";
  /** Confidence percentage 0–100 */
  confidence: number;
  /** Predicted score */
  predictedScore: { home: number; away: number };
  /** Win/Draw/Loss probabilities */
  probabilities: { home: number; draw: number; away: number };
  /** Key factors explaining the prediction */
  factors: PredictionFactor[];
  /** AI advice text (French) */
  advice: string;
  /** Risk level */
  risk: "low" | "medium" | "high";
  /** Best bet suggestions */
  bestBets: BetSuggestion[];
  /** Expected Goals Home (AnalystePro) */
  xgHome?: number;
  /** Expected Goals Away (AnalystePro) */
  xgAway?: number;
  /** Value bet detection */
  valueBet?: string | null;
  /** Real-time match state context */
  matchState?: string;
  /** 1-5 confidence scale */
  confidenceStars?: number;
  /** Detailed reasoning */
  reasoning?: string;
  /** Extra detailed predictions from AI */
  detailedPredictions?: Record<string, string | number>;
}

export interface PredictionFactor {
  icon: string;
  label: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
  team: "home" | "away" | "both";
}

export interface BetSuggestion {
  type: string;
  label: string;
  confidence: number;
  emoji: string;
}

// ─── AI Configuration ────────────────────────────────────────

const AI_CONFIG = {
  WEIGHTS: {
    FORM: 0.30,
    H2H: 0.15,
    RANK: 0.20,
    INJURIES: 0.15,
    HOME_BONUS: 6,
    MOMENTUM: 0.12,
    GOAL_DIFF: 0.08,
  },
  BASE_PROBS: {
    HOME: 38,
    DRAW: 26,
    AWAY: 36,
  },
  THRESHOLDS: {
    HIGH_CONFIDENCE: 60,
    MEDIUM_CONFIDENCE: 45,
    FORM_DOMINANCE: 12,
    RANK_DOMINANCE: 4,
  }
};


// ─── Advanced Form Analysis ─────────────────────────────────

interface FormAnalysis {
  winRate: number;
  avgGoalsScored: number;
  avgGoalsConceded: number;
  streak: string;
  streakLength: number;
  formScore: number;
  momentum: number; // -1 to 1, positive = trending up
  consistency: number; // 0-1, higher = more consistent
  goalDifference: number;
  xG: number; // Expected goals proxy
  defensiveStrength: number; // 0-100
  attackingStrength: number; // 0-100
}

function analyzeForm(form: TeamFormData[]): FormAnalysis {
  if (form.length === 0) {
    return { 
      winRate: 0.33, avgGoalsScored: 1.2, avgGoalsConceded: 1.2, 
      streak: "N", streakLength: 0, formScore: 50,
      momentum: 0, consistency: 0.5, goalDifference: 0,
      xG: 1.2, defensiveStrength: 50, attackingStrength: 50
    };
  }

  const wins = form.filter(m => m.result === "W").length;
  const draws = form.filter(m => m.result === "D").length;
  const losses = form.filter(m => m.result === "L").length;
  const total = form.length;

  const winRate = wins / total;
  const avgGoalsScored = form.reduce((s, m) => s + m.goalsFor, 0) / total;
  const avgGoalsConceded = form.reduce((s, m) => s + m.goalsAgainst, 0) / total;
  const goalDifference = form.reduce((s, m) => s + (m.goalsFor - m.goalsAgainst), 0);

  // Calculate streak
  let streak = form[0]?.result || "N";
  let streakLength = 1;
  for (let i = 1; i < form.length; i++) {
    if (form[i].result === streak) {
      streakLength++;
    } else break;
  }

  // Advanced form score with recency weights
  const weights = [5, 4, 3, 2, 1.5, 1, 0.8, 0.6, 0.4, 0.3];
  let formScore = 0;
  let totalWeight = 0;
  
  for (let i = 0; i < Math.min(form.length, 10); i++) {
    const w = weights[i] || 0.2;
    totalWeight += w;
    if (form[i].result === "W") formScore += w * 100;
    else if (form[i].result === "D") formScore += w * 50;
    else formScore += w * 15; // Loss still gives some points for playing
  }
  formScore = totalWeight > 0 ? Math.round(formScore / totalWeight) : 50;

  // Calculate momentum (trend over last 3 vs previous matches)
  const recent3 = form.slice(0, Math.min(3, form.length));
  const previous = form.slice(3, Math.min(6, form.length));
  
  const recentScore = recent3.reduce((s, m) => s + (m.result === "W" ? 3 : m.result === "D" ? 1 : 0), 0) / (recent3.length * 3);
  const prevScore = previous.length > 0 
    ? previous.reduce((s, m) => s + (m.result === "W" ? 3 : m.result === "D" ? 1 : 0), 0) / (previous.length * 3)
    : recentScore;
  
  const momentum = prevScore > 0 ? Math.min(1, Math.max(-1, (recentScore - prevScore) * 2)) : 0;

  // Calculate consistency (lower variance = higher consistency)
  const results = form.map(m => m.result === "W" ? 3 : m.result === "D" ? 1 : 0);
  const mean = results.reduce((a, b) => a + b, 0) / results.length;
  const variance = results.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / results.length;
  const consistency = Math.max(0, 1 - (variance / 4));

  // Calculate xG proxy based on shot quality indicators
  const xG = (avgGoalsScored * 0.7) + (form.filter(m => m.goalsFor >= 2).length / total * 1.5);

  // Defensive/Attacking strength (0-100)
  const defensiveStrength = Math.min(100, Math.max(20, 100 - (avgGoalsConceded * 25)));
  const attackingStrength = Math.min(100, Math.max(20, avgGoalsScored * 35));

  return { 
    winRate, avgGoalsScored, avgGoalsConceded, 
    streak, streakLength, formScore,
    momentum, consistency, goalDifference,
    xG, defensiveStrength, attackingStrength
  };
}

// ─── Poisson Distribution for Score Prediction ────────────────

function poissonProbability(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function predictScoreWithPoisson(
  homeAttack: number, 
  homeDefense: number,
  awayAttack: number, 
  awayDefense: number,
  homeBonus: number
): { home: number; away: number; probability: number } {
  // Adjusted attack/defense ratings
  const homeStrength = (homeAttack / 50) * (2 - awayDefense / 50) * (1 + homeBonus / 100);
  const awayStrength = (awayAttack / 50) * (2 - homeDefense / 50);
  
  // Base lambda for Poisson
  const lambdaHome = Math.max(0.3, homeStrength * 1.4);
  const lambdaAway = Math.max(0.3, awayStrength * 1.2);
  
  // Find most likely score
  let maxProb = 0;
  let bestHome = 0;
  let bestAway = 0;
  
  for (let h = 0; h <= 5; h++) {
    for (let a = 0; a <= 5; a++) {
      const prob = poissonProbability(lambdaHome, h) * poissonProbability(lambdaAway, a);
      if (prob > maxProb) {
        maxProb = prob;
        bestHome = h;
        bestAway = a;
      }
    }
  }
  
  return { home: bestHome, away: bestAway, probability: maxProb };
}

// ─── H2H Analysis ────────────────────────────────────────────

function analyzeH2H(
  h2hMatches: any[],
  homeTeamId: string,
  awayTeamId: string
): { homeWins: number; draws: number; awayWins: number; homeAdvantage: number; avgGoals: number } {
  if (!h2hMatches || h2hMatches.length === 0) {
    return { homeWins: 0, draws: 0, awayWins: 0, homeAdvantage: 0.5, avgGoals: 2.5 };
  }

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let totalGoals = 0;

  for (const m of h2hMatches) {
    const isHomeTeamHome = String(m.teams?.home?.id) === homeTeamId;
    const homeGoals = m.goals?.home ?? 0;
    const awayGoals = m.goals?.away ?? 0;
    totalGoals += homeGoals + awayGoals;

    if (homeGoals === awayGoals) {
      draws++;
    } else if (isHomeTeamHome) {
      if (homeGoals > awayGoals) homeWins++;
      else awayWins++;
    } else {
      if (awayGoals > homeGoals) homeWins++;
      else awayWins++;
    }
  }

  const total = h2hMatches.length;
  const homeAdvantage = total > 0 ? (homeWins + draws * 0.5) / total : 0.5;
  const avgGoals = total > 0 ? totalGoals / total : 2.5;

  return { homeWins, draws, awayWins, homeAdvantage, avgGoals };
}

// ─── Standings Analysis ──────────────────────────────────────

function analyzeStandings(
  standings: any[],
  homeTeamId: string,
  awayTeamId: string
): { homeRank: number; awayRank: number; rankDiff: number; homePoints: number; awayPoints: number } {
  const homeTeam = standings.find((s: any) => String(s.team?.id) === homeTeamId);
  const awayTeam = standings.find((s: any) => String(s.team?.id) === awayTeamId);

  const homeRank = homeTeam?.rank || 10;
  const awayRank = awayTeam?.rank || 10;
  const homePoints = homeTeam?.points || 0;
  const awayPoints = awayTeam?.points || 0;

  return {
    homeRank,
    awayRank,
    rankDiff: awayRank - homeRank, // Positive = home team is ranked higher
    homePoints,
    awayPoints,
  };
}

// ─── Main Prediction Engine ──────────────────────────────────

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

  // ─── Analyze each dimension ────────────────────────────────
  const hForm = analyzeForm(homeForm);
  const aForm = analyzeForm(awayForm);
  const h2h = analyzeH2H(h2hMatches || [], homeTeamId, awayTeamId);
  const rank = analyzeStandings(standings || [], homeTeamId, awayTeamId);

  const factors: PredictionFactor[] = [];

  // ─── Factor 1: Form ────────────────────────────────────────
  let formWeight = 0; // -100 to +100 (positive = home advantage)

  if (hForm.formScore > aForm.formScore + 15) {
    formWeight = Math.min((hForm.formScore - aForm.formScore) * 0.8, 40);
    factors.push({
      icon: "🔥",
      label: "Forme dominante",
      description: `${homeTeamName} en bien meilleure forme (${hForm.formScore}% vs ${aForm.formScore}%)`,
      impact: "positive",
      team: "home",
    });
  } else if (aForm.formScore > hForm.formScore + 15) {
    formWeight = -Math.min((aForm.formScore - hForm.formScore) * 0.8, 40);
    factors.push({
      icon: "🔥",
      label: "Forme dominante",
      description: `${awayTeamName} en bien meilleure forme (${aForm.formScore}% vs ${hForm.formScore}%)`,
      impact: "positive",
      team: "away",
    });
  } else {
    factors.push({
      icon: "⚖️",
      label: "Forme similaire",
      description: `Les deux équipes affichent une forme comparable`,
      impact: "neutral",
      team: "both",
    });
  }

  // Streak bonus
  if (hForm.streak === "W" && hForm.streakLength >= 3) {
    formWeight += 10;
    factors.push({
      icon: "⚡",
      label: "Série en cours",
      description: `${homeTeamName} sur une série de ${hForm.streakLength} victoires consécutives`,
      impact: "positive",
      team: "home",
    });
  }
  if (aForm.streak === "W" && aForm.streakLength >= 3) {
    formWeight -= 10;
    factors.push({
      icon: "⚡",
      label: "Série en cours",
      description: `${awayTeamName} sur une série de ${aForm.streakLength} victoires consécutives`,
      impact: "positive",
      team: "away",
    });
  }
  if (hForm.streak === "L" && hForm.streakLength >= 2) {
    formWeight -= 8;
    factors.push({
      icon: "📉",
      label: "Mauvaise passe",
      description: `${homeTeamName} : ${hForm.streakLength} défaites d'affilée`,
      impact: "negative",
      team: "home",
    });
  }
  if (aForm.streak === "L" && aForm.streakLength >= 2) {
    formWeight += 8;
    factors.push({
      icon: "📉",
      label: "Mauvaise passe",
      description: `${awayTeamName} : ${aForm.streakLength} défaites d'affilée`,
      impact: "negative",
      team: "away",
    });
  }

  // ─── Factor 2: H2H ────────────────────────────────────────
  let h2hWeight = 0;
  if (h2hMatches && h2hMatches.length >= 3) {
    h2hWeight = (h2h.homeAdvantage - 0.5) * 30;
    if (h2h.homeWins > h2h.awayWins) {
      factors.push({
        icon: "⚔️",
        label: "Historique favorable",
        description: `${homeTeamName} domine les confrontations directes (${h2h.homeWins}V-${h2h.draws}N-${h2h.awayWins}D)`,
        impact: "positive",
        team: "home",
      });
    } else if (h2h.awayWins > h2h.homeWins) {
      factors.push({
        icon: "⚔️",
        label: "Historique favorable",
        description: `${awayTeamName} domine les confrontations directes (${h2h.awayWins}V-${h2h.draws}N-${h2h.homeWins}D)`,
        impact: "positive",
        team: "away",
      });
    }
  }

  // ─── Factor 3: Standings ───────────────────────────────────
  let rankWeight = 0;
  if (standings && standings.length > 0) {
    if (rank.rankDiff > 5) {
      rankWeight = Math.min(rank.rankDiff * 2.5, 25);
      factors.push({
        icon: "🏆",
        label: "Écart de classement",
        description: `${homeTeamName} (${rank.homeRank}e) bien mieux classé que ${awayTeamName} (${rank.awayRank}e)`,
        impact: "positive",
        team: "home",
      });
    } else if (rank.rankDiff < -5) {
      rankWeight = Math.max(rank.rankDiff * 2.5, -25);
      factors.push({
        icon: "🏆",
        label: "Écart de classement",
        description: `${awayTeamName} (${rank.awayRank}e) bien mieux classé que ${homeTeamName} (${rank.homeRank}e)`,
        impact: "positive",
        team: "away",
      });
    }
  }

  // ─── Factor 4: Home advantage ──────────────────────────────
  const homeBonus = 8; // Slight bonus for playing at home
  factors.push({
    icon: "🏟️",
    label: "Avantage domicile",
    description: `${homeTeamName} joue à domicile`,
    impact: "positive",
    team: "home",
  });

  // ─── Factor 5: Injuries ────────────────────────────────────
  let injuryWeight = 0;
  if (injuries) {
    if (injuries.home > injuries.away + 2) {
      injuryWeight = -Math.min((injuries.home - injuries.away) * 4, 15);
      factors.push({
        icon: "🏥",
        label: "Absences clés",
        description: `${homeTeamName} affaibli avec ${injuries.home} joueurs absents`,
        impact: "negative",
        team: "home",
      });
    } else if (injuries.away > injuries.home + 2) {
      injuryWeight = Math.min((injuries.away - injuries.home) * 4, 15);
      factors.push({
        icon: "🏥",
        label: "Absences clés",
        description: `${awayTeamName} affaibli avec ${injuries.away} joueurs absents`,
        impact: "negative",
        team: "away",
      });
    }
  }

  // ─── Combine all weights ───────────────────────────────────
  const totalWeight = 
    (formWeight * AI_CONFIG.WEIGHTS.FORM) + 
    (h2hWeight * AI_CONFIG.WEIGHTS.H2H) + 
    (rankWeight * AI_CONFIG.WEIGHTS.RANK) + 
    (injuryWeight * AI_CONFIG.WEIGHTS.INJURIES) + 
    AI_CONFIG.WEIGHTS.HOME_BONUS;

  // Convert total weight to probabilities
  let homeProb = AI_CONFIG.BASE_PROBS.HOME + totalWeight;
  let drawProb = AI_CONFIG.BASE_PROBS.DRAW - Math.abs(totalWeight) * 0.3;
  let awayProb = AI_CONFIG.BASE_PROBS.AWAY - totalWeight;

  // Clamp and normalize
  homeProb = Math.max(5, Math.min(85, homeProb));
  drawProb = Math.max(8, Math.min(40, drawProb));
  awayProb = Math.max(5, Math.min(85, awayProb));

  const total = homeProb + drawProb + awayProb;
  homeProb = Math.round((homeProb / total) * 100);
  drawProb = Math.round((drawProb / total) * 100);
  awayProb = 100 - homeProb - drawProb;


  // ─── Determine outcome ─────────────────────────────────────
  let outcome: "home" | "draw" | "away";
  let confidence: number;

  if (homeProb > awayProb && homeProb > drawProb) {
    outcome = "home";
    confidence = homeProb;
  } else if (awayProb > homeProb && awayProb > drawProb) {
    outcome = "away";
    confidence = awayProb;
  } else {
    outcome = "draw";
    confidence = drawProb;
  }

  // ─── Advanced Score Prediction with Poisson ────────────────
  const poissonPrediction = predictScoreWithPoisson(
    hForm.attackingStrength,
    hForm.defensiveStrength,
    aForm.attackingStrength,
    aForm.defensiveStrength,
    AI_CONFIG.WEIGHTS.HOME_BONUS
  );
  
  let predictedHome = poissonPrediction.home;
  let predictedAway = poissonPrediction.away;
  
  // Adjust based on momentum
  if (hForm.momentum > 0.3) predictedHome = Math.min(5, predictedHome + 1);
  if (aForm.momentum > 0.3) predictedAway = Math.min(5, predictedAway + 1);
  
  // Ensure score consistency with outcome probability
  if (outcome === "home" && predictedHome <= predictedAway) {
    predictedHome = Math.min(5, predictedAway + Math.max(1, Math.round((homeProb - drawProb) / 20)));
  } else if (outcome === "away" && predictedAway <= predictedHome) {
    predictedAway = Math.min(5, predictedHome + Math.max(1, Math.round((awayProb - drawProb) / 20)));
  } else if (outcome === "draw") {
    // Find closest equal score to prediction
    const avg = Math.round((predictedHome + predictedAway) / 2);
    predictedHome = Math.min(5, avg);
    predictedAway = predictedHome;
  }

  // Clamp to reasonable score range
  predictedHome = Math.max(0, Math.min(5, predictedHome));
  predictedAway = Math.max(0, Math.min(5, predictedAway));
  
  // Calculate expected goals (xG) for display
  const xgHome = Number(((hForm.avgGoalsScored * 0.6 + aForm.avgGoalsConceded * 0.4) * (1 + (hForm.momentum * 0.2))).toFixed(2));
  const xgAway = Number(((aForm.avgGoalsScored * 0.6 + hForm.avgGoalsConceded * 0.4) * (1 + (aForm.momentum * 0.2))).toFixed(2));

  // ─── Risk Level with Consistency Factor ────────────────────
  let risk: "low" | "medium" | "high";
  const avgConsistency = (hForm.consistency + aForm.consistency) / 2;
  const adjustedConfidence = confidence * (0.8 + avgConsistency * 0.2);
  
  if (adjustedConfidence >= AI_CONFIG.THRESHOLDS.HIGH_CONFIDENCE) risk = "low";
  else if (adjustedConfidence >= AI_CONFIG.THRESHOLDS.MEDIUM_CONFIDENCE) risk = "medium";
  else risk = "high";

  // ─── Advice ────────────────────────────────────────────────
  let advice: string;
  if (outcome === "home") {
    if (confidence >= 55) {
      advice = `Victoire de ${homeTeamName} fortement probable — forme et classement en sa faveur.`;
    } else {
      advice = `Légère tendance pour ${homeTeamName}, mais le match reste ouvert.`;
    }
  } else if (outcome === "away") {
    if (confidence >= 55) {
      advice = `${awayTeamName} favori malgré le déplacement — attention au coup de maître !`;
    } else {
      advice = `${awayTeamName} pourrait créer la surprise — match indécis.`;
    }
  } else {
    advice = `Match très serré — le nul est le scénario le plus probable.`;
  }

  // ─── Best Bets ─────────────────────────────────────────────
  const bestBets: BetSuggestion[] = [];

  // Outcome bet
  if (outcome === "home") {
    bestBets.push({ type: "1X2", label: `Victoire ${homeTeamName}`, confidence: homeProb, emoji: "🏠" });
  } else if (outcome === "away") {
    bestBets.push({ type: "1X2", label: `Victoire ${awayTeamName}`, confidence: awayProb, emoji: "✈️" });
  } else {
    bestBets.push({ type: "1X2", label: "Match Nul", confidence: drawProb, emoji: "🤝" });
  }

  // Goals
  const expectedGoals = avgHomeGoals + avgAwayGoals;
  if (expectedGoals > 2.5) {
    bestBets.push({ type: "O/U", label: "Plus de 2.5 buts", confidence: Math.min(75, Math.round(expectedGoals * 22)), emoji: "⚽" });
  } else {
    bestBets.push({ type: "O/U", label: "Moins de 2.5 buts", confidence: Math.min(75, Math.round((4 - expectedGoals) * 22)), emoji: "🛡️" });
  }

  // BTTS (Both Teams To Score)
  const bttsProb = Math.round(
    ((hForm.avgGoalsScored > 0.8 ? 1 : 0.5) + (aForm.avgGoalsScored > 0.8 ? 1 : 0.5)) / 2 * 70
  );
  if (bttsProb > 55) {
    bestBets.push({ type: "BTTS", label: "Les deux équipes marquent", confidence: bttsProb, emoji: "🎯" });
  } else {
    bestBets.push({ type: "BTTS", label: "Une seule équipe marque", confidence: 100 - bttsProb, emoji: "🚫" });
  }

  // Exact Score
  bestBets.push({ type: "Score Exact", label: `${predictedHome} - ${predictedAway}`, confidence: Math.max(15, confidence - 25), emoji: "🎯" });

  // Double Chance
  if (outcome === "home") {
    bestBets.push({ type: "Double Chance", label: `${homeTeamName} ou Nul`, confidence: Math.min(95, homeProb + drawProb), emoji: "🛡️" });
  } else if (outcome === "away") {
    bestBets.push({ type: "Double Chance", label: `${awayTeamName} ou Nul`, confidence: Math.min(95, awayProb + drawProb), emoji: "🛡️" });
  } else {
    bestBets.push({ type: "Double Chance", label: "Les deux équipes peuvent gagner", confidence: Math.min(90, homeProb + awayProb), emoji: "⚖️" });
  }

  // HT/FT (Mi-temps / Fin de match)
  let htftLabel = "";
  if (outcome === "home") htftLabel = `${homeTeamName} / ${homeTeamName}`;
  else if (outcome === "away") htftLabel = `${awayTeamName} / ${awayTeamName}`;
  else htftLabel = "Nul / Nul";
  bestBets.push({ type: "HT/FT", label: htftLabel, confidence: Math.max(20, confidence - 20), emoji: "⏱️" });

  // 1. Draw No Bet (DNB)
  if (homeProb > awayProb) {
    bestBets.push({ type: "DNB", label: `DNB: ${homeTeamName}`, confidence: Math.min(98, homeProb + drawProb * 0.4), emoji: "🛡️" });
  } else {
    bestBets.push({ type: "DNB", label: `DNB: ${awayTeamName}`, confidence: Math.min(98, awayProb + drawProb * 0.4), emoji: "🛡️" });
  }

  // 2. Asian Handicap (Simplified)
  if (rank.rankDiff > 8 || hForm.formScore > aForm.formScore + 25) {
    bestBets.push({ type: "Handicap", label: `${homeTeamName} -1.5`, confidence: Math.max(30, confidence - 15), emoji: "📉" });
  } else if (rank.rankDiff < -8 || aForm.formScore > hForm.formScore + 25) {
    bestBets.push({ type: "Handicap", label: `${awayTeamName} -1.5`, confidence: Math.max(30, confidence - 15), emoji: "📉" });
  }

  // 3. Clean Sheet / Win to Nil
  if (outcome === "home" && aForm.avgGoalsScored < 0.7 && hForm.avgGoalsConceded < 0.9) {
    bestBets.push({ type: "Special", label: `${homeTeamName} Win to Nil`, confidence: Math.max(25, confidence - 10), emoji: "🧤" });
  } else if (hForm.avgGoalsConceded < 0.8) {
    bestBets.push({ type: "Special", label: `${homeTeamName} Clean Sheet`, confidence: 65, emoji: "🔒" });
  }

  // Add xG to result
  return {
    outcome,
    confidence: Math.round(adjustedConfidence),
    predictedScore: { home: predictedHome, away: predictedAway },
    probabilities: { home: homeProb, draw: drawProb, away: awayProb },
    factors: factors.slice(0, 6),
    advice,
    risk,
    bestBets,
    xgHome,
    xgAway,
  };
}
