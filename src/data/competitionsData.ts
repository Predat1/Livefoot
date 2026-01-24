export const mockCompetitions = [
  {
    id: "premier-league",
    name: "Premier League",
    country: "England",
    logo: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    teams: 20,
    currentMatchday: 22,
    topScorer: "E. Haaland",
    topScorerGoals: 18,
  },
  {
    id: "la-liga",
    name: "La Liga",
    country: "Spain",
    logo: "🇪🇸",
    teams: 20,
    currentMatchday: 21,
    topScorer: "R. Lewandowski",
    topScorerGoals: 15,
  },
  {
    id: "serie-a",
    name: "Serie A",
    country: "Italy",
    logo: "🇮🇹",
    teams: 20,
    currentMatchday: 22,
    topScorer: "V. Osimhen",
    topScorerGoals: 14,
  },
  {
    id: "bundesliga",
    name: "Bundesliga",
    country: "Germany",
    logo: "🇩🇪",
    teams: 18,
    currentMatchday: 19,
    topScorer: "H. Kane",
    topScorerGoals: 20,
  },
  {
    id: "ligue-1",
    name: "Ligue 1",
    country: "France",
    logo: "🇫🇷",
    teams: 18,
    currentMatchday: 20,
    topScorer: "K. Mbappé",
    topScorerGoals: 16,
  },
  {
    id: "champions-league",
    name: "Champions League",
    country: "Europe",
    logo: "⭐",
    teams: 32,
    currentMatchday: 6,
    topScorer: "E. Haaland",
    topScorerGoals: 8,
  },
  {
    id: "europa-league",
    name: "Europa League",
    country: "Europe",
    logo: "🌍",
    teams: 32,
    currentMatchday: 5,
    topScorer: "R. Lukaku",
    topScorerGoals: 5,
  },
  {
    id: "primeira-liga",
    name: "Primeira Liga",
    country: "Portugal",
    logo: "🇵🇹",
    teams: 18,
    currentMatchday: 18,
    topScorer: "V. Gyökeres",
    topScorerGoals: 22,
  },
];

export const standingsData: Record<string, Array<{
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}>> = {
  "premier-league": [
    { position: 1, team: "Liverpool", played: 22, won: 17, drawn: 4, lost: 1, gf: 52, ga: 18, gd: 34, points: 55 },
    { position: 2, team: "Arsenal", played: 22, won: 15, drawn: 5, lost: 2, gf: 48, ga: 20, gd: 28, points: 50 },
    { position: 3, team: "Manchester City", played: 22, won: 14, drawn: 5, lost: 3, gf: 50, ga: 22, gd: 28, points: 47 },
    { position: 4, team: "Chelsea", played: 22, won: 12, drawn: 6, lost: 4, gf: 42, ga: 25, gd: 17, points: 42 },
    { position: 5, team: "Aston Villa", played: 22, won: 11, drawn: 5, lost: 6, gf: 38, ga: 30, gd: 8, points: 38 },
  ],
  "la-liga": [
    { position: 1, team: "Real Madrid", played: 21, won: 15, drawn: 4, lost: 2, gf: 45, ga: 15, gd: 30, points: 49 },
    { position: 2, team: "Barcelona", played: 21, won: 14, drawn: 5, lost: 2, gf: 48, ga: 20, gd: 28, points: 47 },
    { position: 3, team: "Atlético Madrid", played: 21, won: 13, drawn: 4, lost: 4, gf: 40, ga: 22, gd: 18, points: 43 },
    { position: 4, team: "Athletic Bilbao", played: 21, won: 10, drawn: 7, lost: 4, gf: 32, ga: 18, gd: 14, points: 37 },
    { position: 5, team: "Real Sociedad", played: 21, won: 9, drawn: 6, lost: 6, gf: 28, ga: 22, gd: 6, points: 33 },
  ],
};
