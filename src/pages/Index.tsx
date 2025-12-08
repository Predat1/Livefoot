import Header from "@/components/Header";
import DatePicker from "@/components/DatePicker";
import LeagueSection from "@/components/LeagueSection";
import { mockLeagues } from "@/data/mockData";
import { Calendar } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <DatePicker />

      <main className="container py-6">
        {/* Section Header */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            « Live score match today
          </span>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            See other dates
            <Calendar className="h-4 w-4" />
          </button>
        </div>

        {/* Leagues */}
        <div className="space-y-4">
          {mockLeagues.map((league) => (
            <LeagueSection key={league.id} league={league} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-primary-foreground">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <span className="text-lg font-bold text-foreground">BESOCCER</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Live scores, results, fixtures, tables, statistics and news.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            © 2024 BeSoccer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
