import { useState } from "react";
import Layout from "@/components/Layout";
import { mockTransfers, transferFilters } from "@/data/transfersData";
import { ArrowRight, Calendar, CheckCircle, HelpCircle, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

const Transfers = () => {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredTransfers = mockTransfers.filter(transfer => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Official") return transfer.status === "official";
    if (activeFilter === "Rumors") return transfer.status === "rumor";
    if (activeFilter === "Loans") return transfer.type === "loan";
    return true;
  });

  const getStatusIcon = (status: string) => {
    if (status === "official") return <CheckCircle className="h-4 w-4 text-primary" />;
    return <HelpCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = (status: string, type: string) => {
    if (type === "loan") {
      return (
        <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-500">
          <RotateCw className="h-3 w-3" /> Loan
        </span>
      );
    }
    if (status === "official") {
      return (
        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
          <CheckCircle className="h-3 w-3" /> Official
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-bold text-yellow-600">
        <HelpCircle className="h-3 w-3" /> Rumor
      </span>
    );
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 rounded-full gradient-primary" />
            <h1 className="text-3xl font-black text-foreground">Transfers</h1>
          </div>
          <p className="text-muted-foreground ml-4">Latest transfer news, rumors, and official deals</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {transferFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                activeFilter === filter
                  ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Transfers List */}
        <div className="space-y-4">
          {filteredTransfers.map((transfer, index) => (
            <div
              key={transfer.id}
              className={cn(
                "group rounded-2xl bg-card border border-border/50 p-5 transition-all duration-300 hover-lift animate-fade-in",
                transfer.status === "rumor" && "border-l-4 border-l-yellow-500"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Player */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-primary text-lg font-black text-primary-foreground shadow-lg shadow-primary/20">
                    {transfer.player.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{transfer.player}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(transfer.status, transfer.type)}
                    </div>
                  </div>
                </div>

                {/* Transfer Direction */}
                <div className="flex items-center gap-3 flex-1 justify-center">
                  <div className="text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/80 text-sm font-bold mx-auto">
                      {transfer.fromTeam.substring(0, 3).toUpperCase()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[80px] truncate">{transfer.fromTeam}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <ArrowRight className="h-5 w-5 text-primary" />
                    <span className="text-xs font-bold text-primary mt-1">{transfer.fee}</span>
                  </div>
                  <div className="text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary mx-auto">
                      {transfer.toTeam.substring(0, 3).toUpperCase()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[80px] truncate">{transfer.toTeam}</p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground sm:w-32 justify-end">
                  <Calendar className="h-4 w-4" />
                  <span>{transfer.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTransfers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No transfers found matching your filter.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Transfers;
