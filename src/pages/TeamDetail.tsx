import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { mockTeams } from "@/data/teamsData";
import { mockPlayers } from "@/data/playersData";
import { ArrowLeft, MapPin, Users, Trophy, Calendar, Star, Target } from "lucide-react";

const TeamDetail = () => {
  const { teamId } = useParams();
  const team = mockTeams.find(t => t.id === teamId);

  if (!team) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Team not found</h1>
          <Link to="/teams" className="text-primary hover:underline">Back to teams</Link>
        </div>
      </Layout>
    );
  }

  // Get players from this team
  const teamPlayers = mockPlayers.filter(p => p.team === team.name);

  return (
    <Layout>
      <div className="container py-8">
        {/* Back button */}
        <Link 
          to="/teams" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to teams
        </Link>

        {/* Team Header */}
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden mb-6">
          <div className="gradient-primary p-8 text-primary-foreground">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/20 text-5xl shadow-lg">
                {team.logo}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-black">{team.name}</h1>
                <p className="text-primary-foreground/80 mt-1">{team.league} • {team.country}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
            <div className="p-4 text-center">
              <Calendar className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-black text-foreground">{team.founded}</p>
              <p className="text-xs text-muted-foreground">Founded</p>
            </div>
            <div className="p-4 text-center">
              <MapPin className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">{team.stadium}</p>
              <p className="text-xs text-muted-foreground">Stadium</p>
            </div>
            <div className="p-4 text-center">
              <Users className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-black text-foreground">{team.capacity.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Capacity</p>
            </div>
            <div className="p-4 text-center">
              <Trophy className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">{team.manager}</p>
              <p className="text-xs text-muted-foreground">Manager</p>
            </div>
          </div>
        </div>

        {/* Players */}
        {teamPlayers.length > 0 && (
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="bg-league-header px-5 py-3 border-b border-border flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-foreground">Key Players</h3>
            </div>
            <div className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teamPlayers.map((player) => (
                <div 
                  key={player.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary text-lg font-black text-primary-foreground shadow-lg shadow-primary/20">
                    {player.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-foreground">{player.name}</h4>
                    <p className="text-sm text-muted-foreground">{player.position}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-primary">
                      <Target className="h-4 w-4" />
                      <span className="font-bold">{player.goals}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Goals</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {teamPlayers.length === 0 && (
          <div className="rounded-2xl bg-card border border-border/50 p-8 text-center">
            <p className="text-muted-foreground">No players data available for this team.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeamDetail;
