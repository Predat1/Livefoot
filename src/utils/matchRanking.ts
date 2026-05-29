/**
 * BeSoccer-style match ranking for LiveFoot.
 *
 * Order of intent:
 * - live matches first
 * - major competitions before secondary competitions
 * - famous teams before low-signal teams
 * - recent goals/cards and advanced live minutes get extra visibility
 * - scheduled matches sort by kickoff, finished matches by most recent
 */

export type RankedStatus = "scheduled" | "live" | "finished";

export interface RankingTeam {
  id?: string | number;
  name?: string;
  score?: number;
}

export interface RankingMatch {
  id?: string | number;
  fixture_id?: string | number;
  homeTeam?: RankingTeam;
  awayTeam?: RankingTeam;
  status?: RankedStatus;
  statusShort?: string;
  kickoffIso?: string;
  minute?: number;
  lastUpdatedAt?: string;
  isStale?: boolean;
  events?: Array<{ type?: string; minute?: number }>;
  fixture?: {
    id?: string | number;
    date?: string;
    status?: { short?: string; elapsed?: number | null };
  };
  teams?: {
    home?: RankingTeam;
    away?: RankingTeam;
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
  league?: {
    id?: string | number;
    name?: string;
    round?: string;
  };
}

export interface RankingLeague<TMatch extends RankingMatch = RankingMatch> {
  id: string;
  name: string;
  country?: string;
  matches: TMatch[];
}

export interface RankedMatch {
  fixture_id: number;
  score: number;
  rank: number;
  reason: string;
}

export type FavoriteSets = {
  teams?: Set<string>;
  competitions?: Set<string>;
};

const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "P", "BT", "LIVE", "INT"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);

const TOP_CLUBS_IDS = new Set([
  "541", "529", "50", "85", "157", "40", "42", "33", "496", "505",
  "489", "530", "165", "492", "548", "47", "34", "536", "211", "212",
  "499", "497", "157", "80", "66", "49", "46", "47", "81", "541",
]);

const ELITE_COMPETITION_IDS = new Set(["2", "3", "848", "39", "140", "135", "78", "61"]);
const STRONG_COMPETITION_IDS = new Set([
  "88", "94", "203", "253", "262", "307", "71", "128", "144", "179", "197",
]);

const TEAM_NAME_WEIGHTS: Record<string, number> = {
  "real madrid": 90,
  barcelona: 90,
  "manchester city": 88,
  liverpool: 86,
  arsenal: 84,
  "manchester united": 84,
  psg: 84,
  "paris saint germain": 84,
  bayern: 84,
  "bayern munich": 84,
  inter: 82,
  "inter milan": 82,
  juventus: 80,
  "ac milan": 80,
  chelsea: 78,
  tottenham: 76,
  dortmund: 76,
  napoli: 74,
  atletico: 74,
  roma: 72,
  benfica: 70,
  porto: 70,
  marseille: 68,
  lyon: 66,
  monaco: 66,
};

export const LEAGUE_PRIORITY_SCORES: Record<string, number> = {
  "2": 980,   // Champions League
  "39": 970,  // Premier League
  "140": 960, // La Liga
  "135": 950, // Serie A
  "78": 940,  // Bundesliga
  "61": 930,  // Ligue 1
  "3": 910,   // Europa League
  "848": 890, // Conference League
  "1": 760,   // World Cup
  "4": 750,   // Euro
  "5": 730,   // Nations League
  "9": 730,   // Copa America
  "88": 720,  // Eredivisie
  "94": 710,  // Primeira Liga
  "203": 690, // Super Lig
  "253": 670, // MLS
  "307": 660, // Saudi Pro League
  "262": 650, // Liga MX
  "71": 640,  // Brasileirao Serie A
  "128": 630, // Liga Profesional Argentina
  "144": 620, // Jupiler Pro League
  "179": 610, // Premiership Scotland
  "197": 600, // Super League Greece
};

function asId(value: unknown): string {
  return value == null ? "" : String(value);
}

function normalize(value?: string): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getRankingStatus(match: RankingMatch): RankedStatus {
  if (match.status) return match.status;
  const short = match.statusShort || match.fixture?.status?.short || "";
  if (LIVE_STATUSES.has(short)) return "live";
  if (FINISHED_STATUSES.has(short)) return "finished";
  return "scheduled";
}

function getKickoffTime(match: RankingMatch): number {
  const value = match.kickoffIso || match.fixture?.date || "";
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(time) ? time : 0;
}

function getLastSignalTime(match: RankingMatch): number {
  const value = match.lastUpdatedAt || match.kickoffIso || match.fixture?.date || "";
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(time) ? time : 0;
}

function getLeagueWeight(league?: Partial<RankingLeague> | RankingMatch["league"]): number {
  const id = asId(league?.id);
  if (LEAGUE_PRIORITY_SCORES[id] != null) return LEAGUE_PRIORITY_SCORES[id];
  const name = normalize(league?.name);
  if (name.includes("champions league")) return 830;
  if (name.includes("europa league")) return 810;
  if (name.includes("conference league")) return 790;
  if (name.includes("serie a")) return 920;
  if (name.includes("premier league")) return 900;
  if (name.includes("la liga")) return 880;
  if (name.includes("ligue 1")) return 860;
  if (name.includes("bundesliga")) return 840;
  if (name.includes("eredivisie")) return 720;
  if (name.includes("primeira liga") || name.includes("liga portugal")) return 710;
  if (name.includes("super lig")) return 690;
  if (name.includes("major league soccer") || name === "mls") return 670;
  if (name.includes("saudi pro")) return 660;
  if (name.includes("liga mx")) return 650;
  if (name.includes("brasileirao") || name.includes("serie a betano")) return 640;
  return 250;
}

function getCompetitionTierBoost(league?: Partial<RankingLeague> | RankingMatch["league"]): number {
  const id = asId(league?.id);
  if (ELITE_COMPETITION_IDS.has(id)) return 100000;
  if (STRONG_COMPETITION_IDS.has(id)) return 50000;
  const weight = getLeagueWeight(league);
  if (weight >= 890) return 100000;
  if (weight >= 600) return 50000;
  return 0;
}

function getTeamWeight(team?: RankingTeam): number {
  const id = asId(team?.id);
  if (TOP_CLUBS_IDS.has(id)) return 90;
  const name = normalize(team?.name);
  return Object.entries(TEAM_NAME_WEIGHTS).reduce((best, [needle, score]) => {
    return name.includes(needle) ? Math.max(best, score) : best;
  }, 12);
}

function getEventWeight(match: RankingMatch): number {
  const events = match.events || [];
  const eventScore = events.reduce((score, event) => {
    const type = normalize(event.type);
    if (type.includes("goal")) return score + 80;
    if (type.includes("red")) return score + 45;
    if (type.includes("yellow")) return score + 15;
    return score;
  }, 0);

  const homeScore = match.homeTeam?.score ?? match.goals?.home ?? 0;
  const awayScore = match.awayTeam?.score ?? match.goals?.away ?? 0;
  return eventScore + (Number(homeScore) + Number(awayScore)) * 18;
}

function getStatusWeight(match: RankingMatch): number {
  const status = getRankingStatus(match);
  if (status === "live") return 5000;
  if (status === "scheduled") return 2200;
  return 1200;
}

export function isFavoriteMatch(match: RankingMatch, leagueId?: string, favorites: FavoriteSets = {}): boolean {
  const teams = favorites.teams || new Set<string>();
  const competitions = favorites.competitions || new Set<string>();
  const homeId = asId(match.homeTeam?.id ?? match.teams?.home?.id);
  const awayId = asId(match.awayTeam?.id ?? match.teams?.away?.id);
  return competitions.has(asId(leagueId || match.league?.id)) || teams.has(homeId) || teams.has(awayId);
}

export function getMatchPriorityScore(
  match: RankingMatch,
  league?: Partial<RankingLeague>,
  favorites: FavoriteSets = {},
): number {
  const status = getRankingStatus(match);
  const minute = match.minute ?? match.fixture?.status?.elapsed ?? 0;
  const teamWeight = Math.max(
    getTeamWeight(match.homeTeam || match.teams?.home),
    getTeamWeight(match.awayTeam || match.teams?.away),
  );

  let score = getStatusWeight(match);
  score += getLeagueWeight(league || match.league);
  score += teamWeight * 8;
  score += getEventWeight(match);
  if (status === "live") score += Math.min(Number(minute) || 0, 120) * 4;
  if (isFavoriteMatch(match, league?.id, favorites)) score += 900;
  if (match.isStale) score -= 700;

  return score;
}

export function compareMatches<TMatch extends RankingMatch>(
  a: TMatch,
  b: TMatch,
  league?: Partial<RankingLeague>,
  favorites: FavoriteSets = {},
): number {
  const statusOrder: Record<RankedStatus, number> = { live: 0, scheduled: 1, finished: 2 };
  const statusDiff = statusOrder[getRankingStatus(a)] - statusOrder[getRankingStatus(b)];
  if (statusDiff !== 0) return statusDiff;

  const status = getRankingStatus(a);
  if (status === "scheduled") return getKickoffTime(a) - getKickoffTime(b);
  if (status === "finished") return getLastSignalTime(b) - getLastSignalTime(a);

  const scoreDiff = getMatchPriorityScore(b, league, favorites) - getMatchPriorityScore(a, league, favorites);
  if (scoreDiff !== 0) return scoreDiff;
  return (Number(b.minute || 0) - Number(a.minute || 0));
}

export function sortMatchesWithinLeague<TMatch extends RankingMatch>(
  matches: TMatch[] = [],
  league?: Partial<RankingLeague>,
  favorites: FavoriteSets = {},
): TMatch[] {
  return [...matches].sort((a, b) => compareMatches(a, b, league, favorites));
}

export function sortLeaguesByPriority<TLeague extends RankingLeague>(
  leagues: TLeague[] = [],
  favorites: FavoriteSets = {},
): TLeague[] {
  return [...leagues]
    .map((league) => ({
      ...league,
      matches: sortMatchesWithinLeague(league.matches, league, favorites),
    }))
    .sort((a, b) => {
      const best = (league: TLeague) => {
        const favoriteBoost = favorites.competitions?.has(league.id) ? 900 : 0;
        const bestMatch = Math.max(
          0,
          ...league.matches.map((match) => getMatchPriorityScore(match, league, favorites)),
        );
        const liveBoost = league.matches.some((match) => getRankingStatus(match) === "live") ? 5000 : 0;
        const scheduledBoost = league.matches.some((match) => getRankingStatus(match) === "scheduled") ? 1200 : 0;
        return getCompetitionTierBoost(league)
          + getLeagueWeight(league) * 100
          + liveBoost
          + scheduledBoost
          + Math.min(bestMatch, 2500)
          + favoriteBoost
          + league.matches.length * 0.1;
      };
      return best(b as TLeague) - best(a as TLeague);
    }) as TLeague[];
}

export function rankMatches(matches: RankingMatch[]): { ranked_matches: RankedMatch[] } {
  const ranked = [...matches].sort((a, b) => {
    const scoreDiff = getMatchPriorityScore(b) - getMatchPriorityScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return compareMatches(a, b);
  });

  return {
    ranked_matches: ranked.map((match, i) => ({
      fixture_id: Number(match.fixture?.id || match.id || match.fixture_id || 0),
      score: getMatchPriorityScore(match),
      rank: i + 1,
      reason: getRankingStatus(match) === "live" ? "Match en direct prioritaire" : "Match classe par importance",
    })),
  };
}
