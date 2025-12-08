export const mockLeagues = [
  {
    id: "premier-league",
    name: "Premier League",
    country: "England",
    matches: [
      {
        id: "pl-1",
        homeTeam: { name: "Wolves" },
        awayTeam: { name: "Manchester United" },
        time: "15:00",
        status: "scheduled" as const,
      },
      {
        id: "pl-2",
        homeTeam: { name: "Arsenal", score: 2 },
        awayTeam: { name: "Chelsea", score: 1 },
        time: "12:30",
        status: "live" as const,
        minute: 67,
      },
    ],
  },
  {
    id: "laliga",
    name: "LaLiga",
    country: "Spain",
    matches: [
      {
        id: "ll-1",
        homeTeam: { name: "Osasuna" },
        awayTeam: { name: "Levante" },
        time: "15:00",
        status: "scheduled" as const,
      },
      {
        id: "ll-2",
        homeTeam: { name: "Real Madrid", score: 3 },
        awayTeam: { name: "Barcelona", score: 2 },
        time: "21:00",
        status: "finished" as const,
      },
    ],
  },
  {
    id: "serie-a",
    name: "Serie A",
    country: "Italy",
    matches: [
      {
        id: "sa-1",
        homeTeam: { name: "Pisa SC" },
        awayTeam: { name: "Parma" },
        time: "09:00",
        status: "scheduled" as const,
      },
      {
        id: "sa-2",
        homeTeam: { name: "Udinese" },
        awayTeam: { name: "Genoa" },
        time: "12:00",
        status: "scheduled" as const,
      },
      {
        id: "sa-3",
        homeTeam: { name: "Torino" },
        awayTeam: { name: "Milan" },
        time: "14:45",
        status: "scheduled" as const,
      },
    ],
  },
  {
    id: "laliga2",
    name: "LaLiga 2",
    country: "Spain",
    matches: [
      {
        id: "ll2-1",
        homeTeam: { name: "Burgos" },
        awayTeam: { name: "Albacete" },
        time: "10:15",
        status: "scheduled" as const,
      },
      {
        id: "ll2-2",
        homeTeam: { name: "Las Palmas" },
        awayTeam: { name: "Mirandés" },
        time: "12:30",
        status: "scheduled" as const,
      },
      {
        id: "ll2-3",
        homeTeam: { name: "Málaga" },
        awayTeam: { name: "Real Zaragoza" },
        time: "14:30",
        status: "scheduled" as const,
      },
    ],
  },
  {
    id: "bundesliga",
    name: "Bundesliga",
    country: "Germany",
    matches: [
      {
        id: "bl-1",
        homeTeam: { name: "Bayern Munich", score: 4 },
        awayTeam: { name: "Dortmund", score: 1 },
        time: "18:30",
        status: "finished" as const,
      },
      {
        id: "bl-2",
        homeTeam: { name: "RB Leipzig" },
        awayTeam: { name: "Leverkusen" },
        time: "20:30",
        status: "scheduled" as const,
      },
    ],
  },
  {
    id: "ligue1",
    name: "Ligue 1",
    country: "France",
    matches: [
      {
        id: "l1-1",
        homeTeam: { name: "PSG" },
        awayTeam: { name: "Lyon" },
        time: "21:00",
        status: "scheduled" as const,
      },
      {
        id: "l1-2",
        homeTeam: { name: "Marseille" },
        awayTeam: { name: "Monaco" },
        time: "17:00",
        status: "scheduled" as const,
      },
    ],
  },
];
