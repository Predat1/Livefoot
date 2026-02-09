import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { mockLeagues } from "@/data/mockData";
import { ArrowLeft, Clock, MapPin, Users, Target, User, AlertTriangle, Repeat2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TeamLogo from "@/components/TeamLogo";
import LeagueLogo from "@/components/LeagueLogo";
import CountryFlag from "@/components/CountryFlag";

type LineupPlayer = { name: string; number: number; pos: string };

const teamLineups: Record<string, LineupPlayer[]> = {
  "Manchester City": [
    { name: "Ederson", number: 31, pos: "GK" },
    { name: "Kyle Walker", number: 2, pos: "DEF" },
    { name: "Rúben Dias", number: 3, pos: "DEF" },
    { name: "Nathan Aké", number: 6, pos: "DEF" },
    { name: "João Cancelo", number: 7, pos: "DEF" },
    { name: "Rodri", number: 16, pos: "MID" },
    { name: "Kevin De Bruyne", number: 17, pos: "MID" },
    { name: "Bernardo Silva", number: 20, pos: "MID" },
    { name: "Phil Foden", number: 47, pos: "FWD" },
    { name: "Erling Haaland", number: 9, pos: "FWD" },
    { name: "Jack Grealish", number: 10, pos: "FWD" },
  ],
  "Liverpool": [
    { name: "Alisson Becker", number: 1, pos: "GK" },
    { name: "Trent Alexander-Arnold", number: 66, pos: "DEF" },
    { name: "Virgil van Dijk", number: 4, pos: "DEF" },
    { name: "Ibrahima Konaté", number: 5, pos: "DEF" },
    { name: "Andrew Robertson", number: 26, pos: "DEF" },
    { name: "Alexis Mac Allister", number: 10, pos: "MID" },
    { name: "Dominik Szoboszlai", number: 8, pos: "MID" },
    { name: "Curtis Jones", number: 17, pos: "MID" },
    { name: "Mohamed Salah", number: 11, pos: "FWD" },
    { name: "Darwin Núñez", number: 9, pos: "FWD" },
    { name: "Luis Díaz", number: 7, pos: "FWD" },
  ],
  "Arsenal": [
    { name: "David Raya", number: 22, pos: "GK" },
    { name: "Ben White", number: 4, pos: "DEF" },
    { name: "William Saliba", number: 2, pos: "DEF" },
    { name: "Gabriel Magalhães", number: 6, pos: "DEF" },
    { name: "Oleksandr Zinchenko", number: 35, pos: "DEF" },
    { name: "Declan Rice", number: 41, pos: "MID" },
    { name: "Martin Ødegaard", number: 8, pos: "MID" },
    { name: "Kai Havertz", number: 29, pos: "MID" },
    { name: "Bukayo Saka", number: 7, pos: "FWD" },
    { name: "Gabriel Jesus", number: 9, pos: "FWD" },
    { name: "Leandro Trossard", number: 19, pos: "FWD" },
  ],
  "Real Madrid": [
    { name: "Thibaut Courtois", number: 1, pos: "GK" },
    { name: "Dani Carvajal", number: 2, pos: "DEF" },
    { name: "Éder Militão", number: 3, pos: "DEF" },
    { name: "Antonio Rüdiger", number: 22, pos: "DEF" },
    { name: "Ferland Mendy", number: 23, pos: "DEF" },
    { name: "Toni Kroos", number: 8, pos: "MID" },
    { name: "Eduardo Camavinga", number: 12, pos: "MID" },
    { name: "Jude Bellingham", number: 5, pos: "MID" },
    { name: "Vinícius Júnior", number: 7, pos: "FWD" },
    { name: "Rodrygo", number: 11, pos: "FWD" },
    { name: "Joselu", number: 14, pos: "FWD" },
  ],
  "FC Barcelona": [
    { name: "Marc-André ter Stegen", number: 1, pos: "GK" },
    { name: "Jules Koundé", number: 23, pos: "DEF" },
    { name: "Ronald Araújo", number: 4, pos: "DEF" },
    { name: "Andreas Christensen", number: 15, pos: "DEF" },
    { name: "Alejandro Balde", number: 3, pos: "DEF" },
    { name: "Frenkie de Jong", number: 21, pos: "MID" },
    { name: "Pedri", number: 8, pos: "MID" },
    { name: "Gavi", number: 6, pos: "MID" },
    { name: "Lamine Yamal", number: 19, pos: "FWD" },
    { name: "Robert Lewandowski", number: 9, pos: "FWD" },
    { name: "Raphinha", number: 11, pos: "FWD" },
  ],
  "Bayern Munich": [
    { name: "Manuel Neuer", number: 1, pos: "GK" },
    { name: "Joshua Kimmich", number: 6, pos: "DEF" },
    { name: "Dayot Upamecano", number: 2, pos: "DEF" },
    { name: "Matthijs de Ligt", number: 4, pos: "DEF" },
    { name: "Alphonso Davies", number: 19, pos: "DEF" },
    { name: "Leon Goretzka", number: 8, pos: "MID" },
    { name: "Jamal Musiala", number: 42, pos: "MID" },
    { name: "Leroy Sané", number: 10, pos: "MID" },
    { name: "Serge Gnabry", number: 7, pos: "FWD" },
    { name: "Harry Kane", number: 9, pos: "FWD" },
    { name: "Kingsley Coman", number: 11, pos: "FWD" },
  ],
  "Paris Saint-Germain": [
    { name: "Gianluigi Donnarumma", number: 99, pos: "GK" },
    { name: "Achraf Hakimi", number: 2, pos: "DEF" },
    { name: "Marquinhos", number: 5, pos: "DEF" },
    { name: "Lucas Hernández", number: 21, pos: "DEF" },
    { name: "Nuno Mendes", number: 25, pos: "DEF" },
    { name: "Vitinha", number: 17, pos: "MID" },
    { name: "Warren Zaïre-Emery", number: 33, pos: "MID" },
    { name: "Ousmane Dembélé", number: 10, pos: "MID" },
    { name: "Kylian Mbappé", number: 7, pos: "FWD" },
    { name: "Gonçalo Ramos", number: 9, pos: "FWD" },
    { name: "Bradley Barcola", number: 29, pos: "FWD" },
  ],
  "Inter Milan": [
    { name: "Yann Sommer", number: 1, pos: "GK" },
    { name: "Matteo Darmian", number: 36, pos: "DEF" },
    { name: "Francesco Acerbi", number: 15, pos: "DEF" },
    { name: "Alessandro Bastoni", number: 95, pos: "DEF" },
    { name: "Denzel Dumfries", number: 2, pos: "DEF" },
    { name: "Nicolò Barella", number: 23, pos: "MID" },
    { name: "Hakan Çalhanoğlu", number: 20, pos: "MID" },
    { name: "Henrikh Mkhitaryan", number: 22, pos: "MID" },
    { name: "Lautaro Martínez", number: 10, pos: "FWD" },
    { name: "Marcus Thuram", number: 9, pos: "FWD" },
    { name: "Federico Dimarco", number: 32, pos: "FWD" },
  ],
  "Chelsea": [
    { name: "Robert Sánchez", number: 1, pos: "GK" },
    { name: "Reece James", number: 24, pos: "DEF" },
    { name: "Thiago Silva", number: 6, pos: "DEF" },
    { name: "Levi Colwill", number: 26, pos: "DEF" },
    { name: "Marc Cucurella", number: 3, pos: "DEF" },
    { name: "Enzo Fernández", number: 8, pos: "MID" },
    { name: "Moisés Caicedo", number: 25, pos: "MID" },
    { name: "Cole Palmer", number: 20, pos: "MID" },
    { name: "Raheem Sterling", number: 7, pos: "FWD" },
    { name: "Nicolas Jackson", number: 15, pos: "FWD" },
    { name: "Mykhailo Mudryk", number: 10, pos: "FWD" },
  ],
  "Manchester United": [
    { name: "André Onana", number: 24, pos: "GK" },
    { name: "Diogo Dalot", number: 20, pos: "DEF" },
    { name: "Raphaël Varane", number: 19, pos: "DEF" },
    { name: "Lisandro Martínez", number: 6, pos: "DEF" },
    { name: "Luke Shaw", number: 23, pos: "DEF" },
    { name: "Casemiro", number: 18, pos: "MID" },
    { name: "Bruno Fernandes", number: 8, pos: "MID" },
    { name: "Mason Mount", number: 7, pos: "MID" },
    { name: "Marcus Rashford", number: 10, pos: "FWD" },
    { name: "Rasmus Højlund", number: 11, pos: "FWD" },
    { name: "Alejandro Garnacho", number: 17, pos: "FWD" },
  ],
  "Juventus": [
    { name: "Wojciech Szczęsny", number: 1, pos: "GK" },
    { name: "Danilo", number: 6, pos: "DEF" },
    { name: "Gleison Bremer", number: 3, pos: "DEF" },
    { name: "Federico Gatti", number: 4, pos: "DEF" },
    { name: "Andrea Cambiaso", number: 27, pos: "DEF" },
    { name: "Manuel Locatelli", number: 5, pos: "MID" },
    { name: "Adrien Rabiot", number: 25, pos: "MID" },
    { name: "Filip Kostić", number: 17, pos: "MID" },
    { name: "Federico Chiesa", number: 7, pos: "FWD" },
    { name: "Dušan Vlahović", number: 9, pos: "FWD" },
    { name: "Kenan Yıldız", number: 10, pos: "FWD" },
  ],
};

const defaultLineup: LineupPlayer[] = [
  { name: "Goalkeeper", number: 1, pos: "GK" },
  { name: "Right Back", number: 2, pos: "DEF" },
  { name: "Center Back", number: 4, pos: "DEF" },
  { name: "Center Back", number: 5, pos: "DEF" },
  { name: "Left Back", number: 3, pos: "DEF" },
  { name: "Central Mid", number: 6, pos: "MID" },
  { name: "Central Mid", number: 8, pos: "MID" },
  { name: "Attacking Mid", number: 10, pos: "MID" },
  { name: "Right Wing", number: 7, pos: "FWD" },
  { name: "Striker", number: 9, pos: "FWD" },
  { name: "Left Wing", number: 11, pos: "FWD" },
];

const Match = () => {
  const { matchId } = useParams();

  const match = mockLeagues
    .flatMap((league) => league.matches.map((m) => ({ ...m, league })))
    .find((m) => m.id === matchId);

  if (!match) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Match not found</h1>
          <Link to="/" className="text-primary hover:underline">Back to home</Link>
        </div>
      </Layout>
    );
  }

  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const hasStats = isLive || isFinished;

  const events = match.events || [];
  const stats = match.stats || { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0], passes: [0, 0], passAccuracy: [0, 0] };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "goal": return <Target className="h-4 w-4" />;
      case "yellow": return <div className="w-3 h-4 bg-yellow-500 rounded-sm" />;
      case "red": return <div className="w-3 h-4 bg-red-500 rounded-sm" />;
      case "substitution": return <Repeat2 className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="container py-4 sm:py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to matches
        </Link>

        {/* Match Header */}
        <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden mb-4 sm:mb-6">
          <div className="bg-league-header px-4 sm:px-6 py-2 sm:py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CountryFlag country={match.league.country} size="sm" />
              <LeagueLogo leagueId={match.league.id} size="sm" className="!h-5 !w-5" />
              <span className="font-bold text-sm sm:text-base text-foreground">{match.league.name}</span>
            </div>
            {isLive && (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-live live-pulse" />
                <span className="text-xs sm:text-sm font-bold text-live">LIVE {match.minute}'</span>
              </div>
            )}
            {isFinished && <span className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase">Full Time</span>}
          </div>

          <div className="p-4 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-center">
                <TeamLogo teamName={match.homeTeam.name} size="xl" className="mx-auto mb-2 sm:mb-3" />
                <h2 className="text-sm sm:text-xl font-bold text-foreground">{match.homeTeam.name}</h2>
              </div>

              <div className="text-center flex-shrink-0">
                {hasStats ? (
                  <div className="flex items-center gap-2 sm:gap-4">
                    <span className={cn("text-3xl sm:text-5xl font-black", isLive ? "text-live" : "text-foreground")}>{match.homeTeam.score}</span>
                    <span className="text-xl sm:text-3xl text-muted-foreground">-</span>
                    <span className={cn("text-3xl sm:text-5xl font-black", isLive ? "text-live" : "text-foreground")}>{match.awayTeam.score}</span>
                  </div>
                ) : (
                  <div className="rounded-xl sm:rounded-2xl bg-primary/10 px-4 sm:px-6 py-3 sm:py-4">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-1 sm:mb-2" />
                    <span className="text-xl sm:text-3xl font-black text-primary">{match.time}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 text-center">
                <TeamLogo teamName={match.awayTeam.name} size="xl" className="mx-auto mb-2 sm:mb-3" />
                <h2 className="text-sm sm:text-xl font-bold text-foreground">{match.awayTeam.name}</h2>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1 sm:gap-2"><MapPin className="h-3 w-3 sm:h-4 sm:w-4" /><span>{match.stadium}</span></div>
              <div className="flex items-center gap-1 sm:gap-2"><Users className="h-3 w-3 sm:h-4 sm:w-4" /><span>{match.attendance?.toLocaleString()}</span></div>
              <div className="flex items-center gap-1 sm:gap-2"><User className="h-3 w-3 sm:h-4 sm:w-4" /><span>{match.referee}</span></div>
            </div>
          </div>
        </div>

        {hasStats ? (
          <Tabs defaultValue="events" className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-card border border-border/50 rounded-xl p-1 mb-4">
              <TabsTrigger value="events" className="rounded-lg text-xs sm:text-sm">Events</TabsTrigger>
              <TabsTrigger value="stats" className="rounded-lg text-xs sm:text-sm">Statistics</TabsTrigger>
              <TabsTrigger value="lineups" className="rounded-lg text-xs sm:text-sm">Lineups</TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="mt-0">
              <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-4 sm:px-5 py-2 sm:py-3 border-b border-border">
                  <h3 className="font-bold text-sm sm:text-base text-foreground">Match Events</h3>
                </div>
                <div className="p-3 sm:p-4">
                  {events.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {events.map((event, index) => (
                        <div key={index} className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-muted/30">
                          {event.team === "home" ? (
                            <>
                              <span className="w-10 sm:w-12 text-center font-bold text-xs sm:text-sm text-muted-foreground">{event.minute}'</span>
                              <div className={cn("flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full", event.type === "goal" ? "bg-primary text-primary-foreground" : "bg-muted")}>{getEventIcon(event.type)}</div>
                              <div className="flex-1">
                                <span className="font-medium text-xs sm:text-sm text-foreground">{event.player}</span>
                                {event.assist && <span className="text-[10px] sm:text-xs text-muted-foreground ml-2">(assist: {event.assist})</span>}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex-1 text-right">
                                <span className="font-medium text-xs sm:text-sm text-foreground">{event.player}</span>
                                {event.assist && <span className="text-[10px] sm:text-xs text-muted-foreground mr-2">(assist: {event.assist})</span>}
                              </div>
                              <div className={cn("flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full", event.type === "goal" ? "bg-primary text-primary-foreground" : "bg-muted")}>{getEventIcon(event.type)}</div>
                              <span className="w-10 sm:w-12 text-center font-bold text-xs sm:text-sm text-muted-foreground">{event.minute}'</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No events yet</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="mt-0">
              <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-4 sm:px-5 py-2 sm:py-3 border-b border-border">
                  <h3 className="font-bold text-sm sm:text-base text-foreground">Match Statistics</h3>
                </div>
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {[
                    { label: "Possession", values: stats.possession, suffix: "%" },
                    { label: "Shots", values: stats.shots },
                    { label: "Shots on Target", values: stats.shotsOnTarget },
                    { label: "Corners", values: stats.corners },
                    { label: "Fouls", values: stats.fouls },
                    { label: "Passes", values: stats.passes },
                    { label: "Pass Accuracy", values: stats.passAccuracy, suffix: "%" },
                  ].map(({ label, values, suffix = "" }) => {
                    const [home, away] = values;
                    const total = home + away;
                    const homePercent = total > 0 ? (home / total) * 100 : 50;
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                          <span className="font-bold text-foreground">{home}{suffix}</span>
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-bold text-foreground">{away}{suffix}</span>
                        </div>
                        <div className="flex h-2 sm:h-3 rounded-full overflow-hidden bg-muted">
                          <div className="bg-primary transition-all duration-500" style={{ width: `${homePercent}%` }} />
                          <div className="bg-muted-foreground/30 transition-all duration-500" style={{ width: `${100 - homePercent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lineups" className="mt-0">
              <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-4 sm:px-5 py-2 sm:py-3 border-b border-border">
                  <h3 className="font-bold text-sm sm:text-base text-foreground">Lineups</h3>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-2 gap-4 sm:gap-8">
                    {[{ team: match.homeTeam }, { team: match.awayTeam }].map(({ team }, tIdx) => {
                      const lineup = teamLineups[team.name] || defaultLineup;
                      return (
                        <div key={tIdx}>
                          <h4 className="font-bold text-sm sm:text-base text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                            <TeamLogo teamName={team.name} size="xs" />
                            {team.name}
                          </h4>
                          <div className="space-y-1.5 sm:space-y-2">
                            {lineup.map((player, i) => (
                              <div key={i} className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-muted/30">
                                <span className="w-5 sm:w-6 text-center text-[10px] sm:text-xs font-bold text-muted-foreground">{player.number}</span>
                                <span className="text-xs sm:text-sm text-foreground">{player.name}</span>
                                <span className="text-[10px] sm:text-xs text-muted-foreground ml-auto">{player.pos}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-4 sm:px-5 py-2 sm:py-3 border-b border-border">
              <h3 className="font-bold text-sm sm:text-base text-foreground">Match Information</h3>
            </div>
            <div className="p-4 sm:p-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-muted/30">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Stadium</p>
                  <p className="font-medium text-sm sm:text-base text-foreground">{match.stadium}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-muted/30">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Capacity</p>
                  <p className="font-medium text-sm sm:text-base text-foreground">{match.attendance?.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-muted/30">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Referee</p>
                  <p className="font-medium text-sm sm:text-base text-foreground">{match.referee}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Match;
