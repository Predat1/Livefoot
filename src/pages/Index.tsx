import Header from "@/components/Header";
import DatePicker from "@/components/DatePicker";
import LeagueSection from "@/components/LeagueSection";
import { mockLeagues } from "@/data/mockData";
import { Trophy, TrendingUp, Zap } from "lucide-react";

const Index = () => {
  const stats = [
    { icon: Trophy, label: "Competitions", value: "156" },
    { icon: TrendingUp, label: "Live Matches", value: "12" },
    { icon: Zap, label: "Goals Today", value: "87" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <DatePicker />

      <main className="container py-8">
        {/* Stats bar */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm border border-border/50 hover-lift animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/20">
                <stat.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground">{stat.value}</p>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Section Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full gradient-primary" />
            <h2 className="text-lg font-bold text-foreground">Today's Matches</h2>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-300">
            View All
          </button>
        </div>

        {/* Leagues */}
        <div className="space-y-4">
          {mockLeagues.map((league, index) => (
            <LeagueSection key={league.id} league={league} index={index} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12 mt-8">
        <div className="container text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/30">
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-primary-foreground">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                <polygon points="12,6 13.5,10 18,10 14.5,13 16,18 12,15 8,18 9.5,13 6,10 10.5,10" fill="currentColor" />
              </svg>
            </div>
            <span className="text-2xl font-black text-foreground tracking-tight">BESOCCER</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Your ultimate destination for live scores, results, fixtures, tables, statistics and football news from around the world.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6">
            {["About", "Contact", "Privacy", "Terms"].map((link) => (
              <a 
                key={link}
                href="#" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
          <p className="mt-8 text-xs text-muted-foreground/60">
            © 2024 BeSoccer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
