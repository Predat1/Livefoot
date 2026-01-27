import { useState } from "react";
import Layout from "@/components/Layout";
import { mockTransfers, transferFilters } from "@/data/transfersData";
import { ArrowRight, Calendar, CheckCircle, HelpCircle, RotateCw, Search, TrendingUp, User, BadgeCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const Transfers = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransfers = mockTransfers
    .filter(transfer => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Official") return transfer.status === "official";
      if (activeFilter === "Rumors") return transfer.status === "rumor";
      if (activeFilter === "Loans") return transfer.type === "loan";
      return true;
    })
    .filter(transfer =>
      transfer.player.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.fromTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.toTeam.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 90) return "text-primary";
    if (reliability >= 70) return "text-green-500";
    if (reliability >= 50) return "text-yellow-500";
    return "text-destructive";
  };

  // Stats
  const officialCount = mockTransfers.filter(t => t.status === "official").length;
  const rumorCount = mockTransfers.filter(t => t.status === "rumor").length;
  const loanCount = mockTransfers.filter(t => t.type === "loan").length;
  const totalValue = mockTransfers
    .filter(t => t.fee !== "Free Transfer" && t.fee !== "Loan")
    .reduce((acc, t) => acc + parseInt(t.fee.replace(/[^0-9]/g, "") || "0"), 0);

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

        {/* Stats Bar */}
        <div className="mb-6 sm:mb-8 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-xs sm:text-sm text-muted-foreground">Official</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-foreground">{officialCount}</p>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <HelpCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Rumors</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-foreground">{rumorCount}</p>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <RotateCw className="h-4 w-4 text-blue-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Loans</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-foreground">{loanCount}</p>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs sm:text-sm text-muted-foreground">Total Value</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-primary">€{totalValue}M</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 sm:mb-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search players, teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-lg sm:rounded-xl border-border/50 bg-card text-sm"
          />
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
                "group rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden transition-all duration-300 hover-lift animate-fade-in",
                transfer.status === "rumor" && "border-l-4 border-l-yellow-500",
                transfer.status === "official" && "border-l-4 border-l-primary"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="p-3 sm:p-5">
                <div className="flex flex-col gap-3 sm:gap-4">
                  {/* Player info - top row */}
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-lg sm:rounded-xl gradient-primary text-sm sm:text-lg font-black text-primary-foreground shadow-lg shadow-primary/20 flex-shrink-0">
                      {transfer.playerImage}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-foreground text-sm sm:text-lg">{transfer.player}</h3>
                          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                            {getStatusBadge(transfer.status, transfer.type)}
                            <span className="text-base sm:text-lg">{transfer.nationalityFlag}</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">{transfer.position} • {transfer.age}y</span>
                          </div>
                        </div>
                        {/* Reliability indicator */}
                        <div className="hidden sm:flex flex-col items-end">
                          <div className={cn("flex items-center gap-1 text-sm font-bold", getReliabilityColor(transfer.reliability))}>
                            <BadgeCheck className="h-4 w-4" />
                            {transfer.reliability}%
                          </div>
                          <span className="text-[10px] text-muted-foreground">{transfer.source}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transfer Direction */}
                  <div className="flex items-center gap-2 sm:gap-4 bg-muted/30 rounded-lg p-3 sm:p-4">
                    <div className="flex-1 text-center">
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-card text-lg sm:text-xl mx-auto border border-border/50 shadow-sm">
                        {transfer.fromTeamLogo}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 truncate">{transfer.fromTeam}</p>
                    </div>
                    <div className="flex flex-col items-center flex-shrink-0">
                      <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      <div className="text-center mt-1">
                        <span className="text-xs sm:text-sm font-black text-primary">{transfer.fee}</span>
                        {transfer.loanOption && (
                          <p className="text-[8px] sm:text-[10px] text-muted-foreground mt-0.5">{transfer.loanOption}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10 text-lg sm:text-xl mx-auto border border-primary/20 shadow-sm">
                        {transfer.toTeamLogo}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 truncate">{transfer.toTeam}</p>
                    </div>
                  </div>

                  {/* Contract & Salary */}
                  <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{transfer.contractYears === 0.5 ? "6 months" : `${transfer.contractYears} years`}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{transfer.salary}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{transfer.date}</span>
                    </div>
                  </div>

                  {/* Mobile reliability */}
                  <div className="sm:hidden flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-[10px] text-muted-foreground">Source: {transfer.source}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={transfer.reliability} className="w-16 h-1.5" />
                      <span className={cn("text-xs font-bold", getReliabilityColor(transfer.reliability))}>
                        {transfer.reliability}%
                      </span>
                    </div>
                  </div>
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
