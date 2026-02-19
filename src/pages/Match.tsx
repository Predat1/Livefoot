import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { mockLeagues } from "@/data/mockData";
import { mockTeams } from "@/data/teamsData";
import { mockPlayers } from "@/data/playersData";
import { ArrowLeft, Clock, MapPin, Users, Target, User, AlertTriangle, Repeat2, MessageSquare, Swords, LayoutGrid, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TeamLogo from "@/components/TeamLogo";
import LeagueLogo from "@/components/LeagueLogo";
import CountryFlag from "@/components/CountryFlag";
import TacticalPitch from "@/components/TacticalPitch";
import ShareButton from "@/components/ShareButton";

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

// Mock H2H data
const h2hData: Record<string, { homeWins: number; draws: number; awayWins: number; lastMeetings: { date: string; homeScore: number; awayScore: number; competition: string }[] }> = {};

const generateH2H = (home: string, away: string) => ({
  homeWins: Math.floor(Math.random() * 8) + 2,
  draws: Math.floor(Math.random() * 5) + 1,
  awayWins: Math.floor(Math.random() * 8) + 2,
  lastMeetings: [
    { date: "Oct 2023", homeScore: 2, awayScore: 1, competition: "League" },
    { date: "Apr 2023", homeScore: 0, awayScore: 0, competition: "League" },
    { date: "Dec 2022", homeScore: 1, awayScore: 3, competition: "Cup" },
    { date: "Aug 2022", homeScore: 2, awayScore: 2, competition: "League" },
    { date: "Mar 2022", homeScore: 1, awayScore: 0, competition: "League" },
  ],
});

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

  const h2h = generateH2H(match.homeTeam.name, match.awayTeam.name);

  // Generate commentary from events
  const commentary = events
    .sort((a, b) => b.minute - a.minute)
    .map((event) => {
      const team = event.team === "home" ? match.homeTeam.name : match.awayTeam.name;
      let text = "";
      if (event.type === "goal") text = `⚽ GOAL! ${event.player} scores for ${team}!${event.assist ? ` Assisted by ${event.assist}.` : ""}`;
      else if (event.type === "yellow") text = `🟨 Yellow card shown to ${event.player} (${team}).`;
      else if (event.type === "red") text = `🟥 Red card! ${event.player} (${team}) is sent off!`;
      else if (event.type === "substitution") text = `🔄 Substitution for ${team}: ${event.player}.`;
      else text = `${event.player} (${team}).`;
      return { minute: event.minute, text };
    });

  return (
    <Layout>
      <SEOHead
        title={`${match.homeTeam.name} vs ${match.awayTeam.name} - ${isLive ? "Live Score" : isFinished ? "Result" : "Preview"}`}
        description={`${match.homeTeam.name} vs ${match.awayTeam.name} - ${match.league.name}. ${isFinished ? `Final score: ${match.homeTeam.score}-${match.awayTeam.score}` : isLive ? `Live: ${match.homeTeam.score}-${match.awayTeam.score} (${match.minute}')` : `Kickoff: ${match.time}`}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          name: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
          homeTeam: { "@type": "SportsTeam", name: match.homeTeam.name },
          awayTeam: { "@type": "SportsTeam", name: match.awayTeam.name },
          location: { "@type": "Place", name: match.stadium },
        }}
      />
      <div className="container py-4 sm:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to matches
          </Link>
          <ShareButton
            title={`${match.homeTeam.name} vs ${match.awayTeam.name} | LiveFoot`}
            text={`${match.homeTeam.name} ${hasStats ? `${match.homeTeam.score}-${match.awayTeam.score}` : "vs"} ${match.awayTeam.name} - ${match.league.name}`}
          />
        </div>

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
              {/* Home team - clickable */}
              {(() => {
                const homeTeamData = mockTeams.find((t) => t.name === match.homeTeam.name);
                const homeHref = homeTeamData ? `/teams/${homeTeamData.id}` : null;
                const content = (
                  <>
                    <TeamLogo teamName={match.homeTeam.name} size="xl" className="mx-auto mb-2 sm:mb-3" />
                    <h2 className="text-sm sm:text-xl font-bold text-foreground">{match.homeTeam.name}</h2>
                  </>
                );
                return homeHref ? (
                  <Link to={homeHref} className="flex-1 text-center hover:opacity-80 transition-opacity">{content}</Link>
                ) : <div className="flex-1 text-center">{content}</div>;
              })()}

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

              {/* Away team - clickable */}
              {(() => {
                const awayTeamData = mockTeams.find((t) => t.name === match.awayTeam.name);
                const awayHref = awayTeamData ? `/teams/${awayTeamData.id}` : null;
                const content = (
                  <>
                    <TeamLogo teamName={match.awayTeam.name} size="xl" className="mx-auto mb-2 sm:mb-3" />
                    <h2 className="text-sm sm:text-xl font-bold text-foreground">{match.awayTeam.name}</h2>
                  </>
                );
                return awayHref ? (
                  <Link to={awayHref} className="flex-1 text-center hover:opacity-80 transition-opacity">{content}</Link>
                ) : <div className="flex-1 text-center">{content}</div>;
              })()}
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
            <TabsList className="w-full grid grid-cols-7 bg-card border border-border/50 rounded-xl p-1 mb-4">
              <TabsTrigger value="events" className="rounded-lg text-[10px] sm:text-sm px-0.5">Events</TabsTrigger>
              <TabsTrigger value="stats" className="rounded-lg text-[10px] sm:text-sm px-0.5">Stats</TabsTrigger>
              <TabsTrigger value="lineups" className="rounded-lg text-[10px] sm:text-sm px-0.5">Lineups</TabsTrigger>
              <TabsTrigger value="formation" className="rounded-lg text-[10px] sm:text-sm px-0.5">Field</TabsTrigger>
              <TabsTrigger value="odds" className="rounded-lg text-[10px] sm:text-sm px-0.5">Odds</TabsTrigger>
              <TabsTrigger value="h2h" className="rounded-lg text-[10px] sm:text-sm px-0.5">H2H</TabsTrigger>
              <TabsTrigger value="commentary" className="rounded-lg text-[10px] sm:text-sm px-0.5">Live</TabsTrigger>
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
                            {lineup.map((player, i) => {
                                const playerData = mockPlayers.find(
                                  (p) => p.name === player.name
                                );
                                const content = (
                                  <div key={i} className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <span className="w-5 sm:w-6 text-center text-[10px] sm:text-xs font-bold text-muted-foreground">{player.number}</span>
                                    <span className="text-xs sm:text-sm text-foreground flex-1">{player.name}</span>
                                    <span className="text-[10px] sm:text-xs text-muted-foreground">{player.pos}</span>
                                  </div>
                                );
                                return playerData ? (
                                  <Link key={i} to={`/players/${playerData.id}`}>{content}</Link>
                                ) : (
                                  <div key={i}>{content}</div>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Formation Tab */}
            <TabsContent value="formation" className="mt-0">
              <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-4 sm:px-5 py-2 sm:py-3 border-b border-border flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-sm sm:text-base text-foreground">Tactical Formation</h3>
                </div>
                <div className="p-4 sm:p-6">
                  <TacticalPitch
                    homePlayers={teamLineups[match.homeTeam.name] || defaultLineup}
                    awayPlayers={teamLineups[match.awayTeam.name] || defaultLineup}
                    homeTeamName={match.homeTeam.name}
                    awayTeamName={match.awayTeam.name}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Odds Tab */}
            <TabsContent value="odds" className="mt-0">
              {(() => {
                // Generate deterministic odds from team names
                const seed = (match.homeTeam.name.length * 7 + match.awayTeam.name.length * 13) % 100;
                const homeWin = (1.5 + (seed % 30) / 20).toFixed(2);
                const draw    = (2.8 + (seed % 15) / 20).toFixed(2);
                const awayWin = (2.0 + ((seed + 17) % 35) / 20).toFixed(2);
                const bttsYes = (1.6 + (seed % 20) / 25).toFixed(2);
                const bttsNo  = (2.1 + (seed % 18) / 25).toFixed(2);
                const over    = (1.7 + (seed % 22) / 25).toFixed(2);
                const under   = (2.0 + (seed % 18) / 25).toFixed(2);

                const bookmakers = [
                  { name: "William Hill", logo: "WH", homeWin, draw, awayWin, bttsYes, bttsNo, over, under },
                  {
                    name: "Betclic",      logo: "BC",
                    homeWin: (parseFloat(homeWin) + 0.05).toFixed(2),
                    draw:    (parseFloat(draw)    - 0.05).toFixed(2),
                    awayWin: (parseFloat(awayWin) + 0.10).toFixed(2),
                    bttsYes: (parseFloat(bttsYes) + 0.05).toFixed(2),
                    bttsNo:  (parseFloat(bttsNo)  - 0.03).toFixed(2),
                    over:    (parseFloat(over)    + 0.04).toFixed(2),
                    under:   (parseFloat(under)   - 0.05).toFixed(2),
                  },
                  {
                    name: "Unibet",       logo: "UB",
                    homeWin: (parseFloat(homeWin) - 0.03).toFixed(2),
                    draw:    (parseFloat(draw)    + 0.08).toFixed(2),
                    awayWin: (parseFloat(awayWin) - 0.05).toFixed(2),
                    bttsYes: (parseFloat(bttsYes) - 0.04).toFixed(2),
                    bttsNo:  (parseFloat(bttsNo)  + 0.06).toFixed(2),
                    over:    (parseFloat(over)    - 0.06).toFixed(2),
                    under:   (parseFloat(under)   + 0.08).toFixed(2),
                  },
                  {
                    name: "Bet365",       logo: "B3",
                    homeWin: (parseFloat(homeWin) + 0.10).toFixed(2),
                    draw:    (parseFloat(draw)    + 0.03).toFixed(2),
                    awayWin: (parseFloat(awayWin) + 0.05).toFixed(2),
                    bttsYes: (parseFloat(bttsYes) + 0.08).toFixed(2),
                    bttsNo:  (parseFloat(bttsNo)  - 0.06).toFixed(2),
                    over:    (parseFloat(over)    + 0.09).toFixed(2),
                    under:   (parseFloat(under)   + 0.04).toFixed(2),
                  },
                  {
                    name: "PMU",          logo: "PM",
                    homeWin: (parseFloat(homeWin) - 0.06).toFixed(2),
                    draw:    (parseFloat(draw)    - 0.08).toFixed(2),
                    awayWin: (parseFloat(awayWin) + 0.02).toFixed(2),
                    bttsYes: (parseFloat(bttsYes) - 0.02).toFixed(2),
                    bttsNo:  (parseFloat(bttsNo)  + 0.03).toFixed(2),
                    over:    (parseFloat(over)    - 0.03).toFixed(2),
                    under:   (parseFloat(under)   - 0.02).toFixed(2),
                  },
                ];

                // Find best odds per column
                const bestHome    = Math.max(...bookmakers.map(b => parseFloat(b.homeWin)));
                const bestDraw    = Math.max(...bookmakers.map(b => parseFloat(b.draw)));
                const bestAway    = Math.max(...bookmakers.map(b => parseFloat(b.awayWin)));
                const bestBttsY   = Math.max(...bookmakers.map(b => parseFloat(b.bttsYes)));
                const bestBttsN   = Math.max(...bookmakers.map(b => parseFloat(b.bttsNo)));
                const bestOver    = Math.max(...bookmakers.map(b => parseFloat(b.over)));
                const bestUnder   = Math.max(...bookmakers.map(b => parseFloat(b.under)));

                const OddCell = ({ val, best }: { val: string; best: number }) => (
                  <div className={cn(
                    "text-center px-2 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-colors",
                    parseFloat(val) === best
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "text-foreground"
                  )}>
                    {val}
                  </div>
                );

                return (
                  <div className="space-y-4">
                    {/* Disclaimer */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 text-[10px] sm:text-xs text-muted-foreground">
                      <TrendingUp className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                      Odds are indicative and for informational purposes only. Best odds highlighted in green.
                    </div>

                    {/* 1X2 Market */}
                    <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                      <div className="bg-league-header px-4 sm:px-5 py-2.5 border-b border-border flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <h3 className="font-bold text-sm text-foreground">Match Result — 1 X 2</h3>
                      </div>
                      <div className="p-3 sm:p-4">
                        {/* Header */}
                        <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 mb-2 px-1">
                          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Bookmaker</div>
                          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center">{match.homeTeam.name.split(" ").slice(-1)[0]}</div>
                          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center">Draw</div>
                          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center">{match.awayTeam.name.split(" ").slice(-1)[0]}</div>
                        </div>
                        <div className="space-y-1.5">
                          {bookmakers.map((bk) => (
                            <div key={bk.name} className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 items-center bg-muted/20 rounded-lg px-1 py-1">
                              <div className="flex items-center gap-2">
                                <span className="flex h-6 w-8 items-center justify-center rounded-md bg-muted text-[9px] font-black text-foreground shrink-0">{bk.logo}</span>
                                <span className="text-[10px] sm:text-xs font-medium text-foreground truncate">{bk.name}</span>
                              </div>
                              <OddCell val={bk.homeWin} best={bestHome} />
                              <OddCell val={bk.draw}    best={bestDraw} />
                              <OddCell val={bk.awayWin} best={bestAway} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Both Teams Score */}
                    <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                      <div className="bg-league-header px-4 sm:px-5 py-2.5 border-b border-border">
                        <h3 className="font-bold text-sm text-foreground">Both Teams to Score</h3>
                      </div>
                      <div className="p-3 sm:p-4">
                        <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 mb-2 px-1">
                          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Bookmaker</div>
                          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center">Yes</div>
                          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center">No</div>
                        </div>
                        <div className="space-y-1.5">
                          {bookmakers.map((bk) => (
                            <div key={bk.name} className="grid grid-cols-[1fr_1fr_1fr] gap-2 items-center bg-muted/20 rounded-lg px-1 py-1">
                              <div className="flex items-center gap-2">
                                <span className="flex h-6 w-8 items-center justify-center rounded-md bg-muted text-[9px] font-black text-foreground shrink-0">{bk.logo}</span>
                                <span className="text-[10px] sm:text-xs font-medium text-foreground truncate">{bk.name}</span>
                              </div>
                              <OddCell val={bk.bttsYes} best={bestBttsY} />
                              <OddCell val={bk.bttsNo}  best={bestBttsN} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Over/Under 2.5 */}
                    <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                      <div className="bg-league-header px-4 sm:px-5 py-2.5 border-b border-border">
                        <h3 className="font-bold text-sm text-foreground">Total Goals — Over / Under 2.5</h3>
                      </div>
                      <div className="p-3 sm:p-4">
                        <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 mb-2 px-1">
                          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Bookmaker</div>
                          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center">Over 2.5</div>
                          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center">Under 2.5</div>
                        </div>
                        <div className="space-y-1.5">
                          {bookmakers.map((bk) => (
                            <div key={bk.name} className="grid grid-cols-[1fr_1fr_1fr] gap-2 items-center bg-muted/20 rounded-lg px-1 py-1">
                              <div className="flex items-center gap-2">
                                <span className="flex h-6 w-8 items-center justify-center rounded-md bg-muted text-[9px] font-black text-foreground shrink-0">{bk.logo}</span>
                                <span className="text-[10px] sm:text-xs font-medium text-foreground truncate">{bk.name}</span>
                              </div>
                              <OddCell val={bk.over}  best={bestOver} />
                              <OddCell val={bk.under} best={bestUnder} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </TabsContent>

            {/* H2H Tab */}
            <TabsContent value="h2h" className="mt-0">
              <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-4 sm:px-5 py-2 sm:py-3 border-b border-border flex items-center gap-2">
                  <Swords className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-sm sm:text-base text-foreground">Head to Head</h3>
                </div>
                <div className="p-4 sm:p-6">
                  {/* Overall Record */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 rounded-xl bg-primary/10">
                      <p className="text-2xl sm:text-3xl font-black text-primary">{h2h.homeWins}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{match.homeTeam.name} Wins</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/30">
                      <p className="text-2xl sm:text-3xl font-black text-foreground">{h2h.draws}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Draws</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-primary/10">
                      <p className="text-2xl sm:text-3xl font-black text-primary">{h2h.awayWins}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{match.awayTeam.name} Wins</p>
                    </div>
                  </div>

                  {/* Last Meetings */}
                  <h4 className="font-bold text-sm text-foreground mb-3">Last 5 Meetings</h4>
                  <div className="space-y-2">
                    {h2h.lastMeetings.map((meeting, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                        <span className="text-xs text-muted-foreground w-20">{meeting.date}</span>
                        <div className="flex items-center gap-3 flex-1 justify-center">
                          <span className="text-xs sm:text-sm font-medium text-foreground text-right flex-1">{match.homeTeam.name}</span>
                          <span className={cn(
                            "px-2 py-1 rounded-md text-xs font-bold",
                            meeting.homeScore > meeting.awayScore ? "bg-primary/10 text-primary" :
                            meeting.homeScore < meeting.awayScore ? "bg-destructive/10 text-destructive" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {meeting.homeScore} - {meeting.awayScore}
                          </span>
                          <span className="text-xs sm:text-sm font-medium text-foreground text-left flex-1">{match.awayTeam.name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground w-12 text-right">{meeting.competition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Commentary Tab */}
            <TabsContent value="commentary" className="mt-0">
              <div className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="bg-league-header px-4 sm:px-5 py-2 sm:py-3 border-b border-border flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-sm sm:text-base text-foreground">Live Commentary</h3>
                  {isLive && (
                    <span className="ml-auto flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-live live-pulse" />
                      <span className="text-xs font-bold text-live">LIVE</span>
                    </span>
                  )}
                </div>
                <div className="p-4 sm:p-6">
                  {commentary.length > 0 ? (
                    <div className="space-y-3">
                      {commentary.map((entry, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-xl bg-muted/30">
                          <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                            {entry.minute}'
                          </span>
                          <p className="text-xs sm:text-sm text-foreground leading-relaxed pt-2">{entry.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No commentary available yet.</p>
                  )}
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
