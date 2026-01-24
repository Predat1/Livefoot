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

  const getStatusBadge = (status: string, type: string) => {
    if (type === "loan") {
      return (
        <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold text-blue-500">
          <RotateCw className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Loan
        </span>
      );
    }
    if (status === "official") {
      return (
        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold text-primary">
          <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Official
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold text-yellow-600">
        <HelpCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Rumor
      </span>
    );
  };

  return (
    <Layout>
      <div className="container py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
            <h1 className="text-xl sm:text-3xl font-black text-foreground">Transfers</h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground ml-3 sm:ml-4">Latest transfer news and deals</p>
        </div>

        {/* Filters */}
        <div className="mb-6 sm:mb-8 flex flex-wrap items-center gap-1.5 sm:gap-2">
          {transferFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300",
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
        <div className="space-y-3 sm:space-y-4">
          {filteredTransfers.map((transfer, index) => (
            <div
              key={transfer.id}
              className={cn(
                "group rounded-xl sm:rounded-2xl bg-card border border-border/50 p-3 sm:p-5 transition-all duration-300 hover-lift animate-fade-in",
                transfer.status === "rumor" && "border-l-4 border-l-yellow-500"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Player info - top row on mobile */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-lg sm:rounded-xl gradient-primary text-sm sm:text-lg font-black text-primary-foreground shadow-lg shadow-primary/20 flex-shrink-0">
                    {transfer.player.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-sm sm:text-lg truncate">{transfer.player}</h3>
                    <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                      {getStatusBadge(transfer.status, transfer.type)}
                    </div>
                  </div>
                  {/* Date - mobile: inline, desktop: separate */}
                  <div className="flex items-center gap-1 text-[10px] sm:text-sm text-muted-foreground sm:hidden">
                    <Calendar className="h-3 w-3" />
                    <span>{transfer.date.slice(5)}</span>
                  </div>
                </div>

                {/* Transfer Direction */}
                <div className="flex items-center gap-2 sm:gap-3 justify-center bg-muted/30 rounded-lg p-2 sm:p-3">
                  <div className="text-center flex-1">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-md sm:rounded-lg bg-card text-xs sm:text-sm font-bold mx-auto border border-border/50">
                      {transfer.fromTeam.substring(0, 3).toUpperCase()}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">{transfer.fromTeam}</p>
                  </div>
                  <div className="flex flex-col items-center flex-shrink-0">
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <span className="text-[10px] sm:text-xs font-bold text-primary mt-0.5 sm:mt-1">{transfer.fee}</span>
                  </div>
                  <div className="text-center flex-1">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-md sm:rounded-lg bg-primary/10 text-xs sm:text-sm font-bold text-primary mx-auto">
                      {transfer.toTeam.substring(0, 3).toUpperCase()}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">{transfer.toTeam}</p>
                  </div>
                </div>

                {/* Date - desktop only */}
                <div className="hidden sm:flex items-center justify-end gap-2 text-sm text-muted-foreground">
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
