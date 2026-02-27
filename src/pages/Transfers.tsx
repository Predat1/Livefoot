import { useState } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { useTransfersByTeam } from "@/hooks/useApiFootball";
import { ArrowRight, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const TOP_TEAMS = [
  { id: "541", name: "Real Madrid" },
  { id: "529", name: "Barcelona" },
  { id: "50",  name: "Man City" },
  { id: "40",  name: "Liverpool" },
  { id: "42",  name: "Arsenal" },
  { id: "157", name: "Bayern" },
  { id: "85",  name: "PSG" },
  { id: "489", name: "AC Milan" },
  { id: "496", name: "Juventus" },
  { id: "47",  name: "Chelsea" },
];

const Transfers = () => {
  const [selectedTeam, setSelectedTeam] = useState(TOP_TEAMS[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: transfers, isLoading } = useTransfersByTeam(selectedTeam.id);

  // Flatten and sort transfers (most recent first)
  const allTransfers = (transfers || [])
    .flatMap((t) =>
      t.transfers.map((tr) => ({
        playerId: t.player.id,
        playerName: t.player.name,
        date: tr.date,
        type: tr.type,
        fromTeam: tr.teams.out,
        toTeam: tr.teams.in,
      }))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50);

  const filteredTransfers = allTransfers.filter(
    (t) =>
      t.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.fromTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.toTeam.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <SEOHead
        title="Transferts Football - Mercato en Direct"
        description="Derniers transferts de football : arrivées, départs et rumeurs mercato des plus grands clubs européens. Real Madrid, Barça, PSG, Liverpool et plus."
        keywords="transfert football, mercato, transfert psg, transfert real madrid, rumeur mercato, transfert ligue 1"
      />
      <div className="container py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="h-6 sm:h-8 w-1 rounded-full gradient-primary" />
            <h1 className="text-xl sm:text-3xl font-black text-foreground">Transfers</h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground ml-3 sm:ml-4">Latest transfer moves from top clubs</p>
        </div>

        {/* Team selector */}
        <div className="mb-4 sm:mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
            {TOP_TEAMS.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className={cn(
                  "rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap",
                  selectedTeam.id === team.id
                    ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {team.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 sm:mb-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search players, teams..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-lg sm:rounded-xl border-border/50 bg-card text-sm" />
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="space-y-3 sm:space-y-4">
            {filteredTransfers.map((transfer, index) => (
              <div
                key={`${transfer.playerId}-${transfer.date}-${index}`}
                className="group rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden transition-all duration-300 hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="p-3 sm:p-5">
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-foreground text-sm sm:text-lg">{transfer.playerName}</h3>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-bold",
                          transfer.type === "Free" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {transfer.type || "Transfer"}
                        </span>
                        <span className="text-xs text-muted-foreground">{new Date(transfer.date).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 bg-muted/30 rounded-lg p-3 sm:p-4">
                      <div className="flex-1 text-center">
                        {transfer.fromTeam.logo && (
                          <img src={transfer.fromTeam.logo} alt={transfer.fromTeam.name} className="h-10 w-10 sm:h-12 sm:w-12 object-contain mx-auto" />
                        )}
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 truncate">{transfer.fromTeam.name}</p>
                      </div>
                      <div className="flex flex-col items-center flex-shrink-0">
                        <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="flex-1 text-center">
                        {transfer.toTeam.logo && (
                          <img src={transfer.toTeam.logo} alt={transfer.toTeam.name} className="h-10 w-10 sm:h-12 sm:w-12 object-contain mx-auto" />
                        )}
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 truncate">{transfer.toTeam.name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredTransfers.length === 0 && (
          <div className="text-center py-12"><p className="text-muted-foreground">No transfers found.</p></div>
        )}
      </div>
    </Layout>
  );
};

export default Transfers;
