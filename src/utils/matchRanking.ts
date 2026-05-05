/**
 * LiveFoot Match Ranking Engine
 * 
 * Scores and ranks football matches based on:
 * 1. Status (40 pts)
 * 2. Competition Prestige (30 pts)
 * 3. Team Notoriety (20 pts)
 * 4. Sporting Stakes (10 pts)
 */

export interface RankedMatch {
  fixture_id: number;
  score: number;
  rank: number;
  reason: string;
}

const TOP_CLUBS_IDS = new Set([
  541, // Real Madrid
  529, // Barcelona
  50,  // Manchester City
  85,  // PSG
  157, // Bayern Munich
  40,  // Liverpool
  42,  // Arsenal
  33,  // Manchester United
  496, // Juventus
  505, // Inter Milan
  489, // AC Milan
  530, // Atletico Madrid
  165, // Borussia Dortmund
  492, // Napoli
  548, // Real Sociedad
  47,  // Tottenham
  34,  // Newcastle
  536, // Sevilla
  211, // Benfica
  212, // Porto
]);

const PRESTIGE_SCORES: Record<number, number> = {
  2: 30,   // Champions League
  1: 30,   // World Cup
  3: 25,   // Europa League
  4: 25,   // Euro
  9: 25,   // Copa America
  5: 25,   // Nations League
  39: 22,  // Premier League
  140: 22, // La Liga
  135: 22, // Serie A
  78: 22,  // Bundesliga
  61: 22,  // Ligue 1
  88: 16,  // Eredivisie
  94: 16,  // Primeira Liga
  262: 16, // Liga MX
  253: 16, // MLS
  307: 16, // Saudi Pro League
};

export function rankMatches(matches: any[]): { ranked_matches: RankedMatch[] } {
  const scoredMatches = matches.map((m) => {
    let score = 0;
    let reason = "";

    // 1. Status (40 pts)
    const status = m.fixture?.status?.short;
    const liveStates = ["1H", "2H", "HT", "ET", "P", "BT", "LIVE", "INT"];
    const now = new Date();
    const matchDate = new Date(m.fixture?.date);
    const diffMs = matchDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (liveStates.includes(status)) {
      score += 40;
      reason = "Match en direct";
    } else if (diffHours > 0 && diffHours < 3) {
      score += 25;
      reason = "Coup d'envoi imminent";
    } else if (diffHours < 0 && diffHours > -2) {
      score += 15;
      reason = "Match récent";
    } else if (diffHours <= -2) {
      score += 5;
      reason = "Match terminé";
    } else {
      score += 0;
      reason = "Match reporté ou futur";
    }

    // 2. Prestige (30 pts)
    const leagueId = m.league?.id;
    const prestige = PRESTIGE_SCORES[leagueId] || 12;
    score += prestige;
    if (prestige >= 25) reason += ` en ${m.league?.name}`;

    // 3. Notoriety (20 pts)
    const homeId = m.teams?.home?.id;
    const awayId = m.teams?.away?.id;
    const homeTop = TOP_CLUBS_IDS.has(homeId);
    const awayTop = TOP_CLUBS_IDS.has(awayId);

    if (homeTop && awayTop) {
      score += 20;
      reason += " entre deux géants";
    } else if (homeTop || awayTop) {
      score += 12;
      reason += " avec un club d'élite";
    } else {
      score += 4;
    }

    // 4. Enjeu (10 pts)
    const round = m.league?.round || "";
    const isFinal = /Final/i.test(round);
    const isSemi = /Semi-final/i.test(round);
    const isGroup = /Group Stage/i.test(round);
    const isFriendly = /Friendly/i.test(m.league?.name) || /Amical/i.test(m.league?.name);

    if (isFinal || isSemi) {
      score += 10;
      reason = "Choc au sommet décisif";
    } else if (isGroup || /Quarter/i.test(round) || /Round of 16/i.test(round)) {
      score += 7;
    } else if (isFriendly) {
      score += 1;
    } else {
      score += 4;
    }

    return {
      fixture_id: m.fixture?.id,
      score,
      status_rank: liveStates.includes(status) ? 2 : 1, // Tie-breaker
      reason: reason.length > 50 ? reason.substring(0, 47) + "..." : reason
    };
  });

  // Sort by score DESC, then by status_rank DESC
  const ranked = scoredMatches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.status_rank - a.status_rank;
  });

  return {
    ranked_matches: ranked.map((m, i) => ({
      fixture_id: m.fixture_id,
      score: m.score,
      rank: i + 1,
      reason: m.reason
    }))
  };
}
