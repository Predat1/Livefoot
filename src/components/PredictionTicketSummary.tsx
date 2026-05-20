import { BarChart3, Shield, Swords, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TicketSummary } from "@/types/predictionTicket";

interface PredictionTicketSummaryProps {
  summary: TicketSummary;
  className?: string;
}

const riskLabel: Record<string, { label: string; color: string; bg: string }> = {
  low:    { label: "Faible",  color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  medium: { label: "Modéré",  color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
  high:   { label: "Élevé",   color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20" },
};

const PredictionTicketSummary = ({ summary, className }: PredictionTicketSummaryProps) => {
  if (summary.count === 0) return null;

  const risk = riskLabel[summary.globalRisk];

  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {/* Sélections */}
      <div className="flex flex-col items-center gap-1 rounded-xl bg-white/[0.04] border border-white/8 p-3">
        <BarChart3 className="h-4 w-4 text-primary" />
        <span className="text-lg font-black text-white">{summary.count}</span>
        <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Sélection{summary.count > 1 ? "s" : ""}</span>
      </div>

      {/* Confiance moyenne */}
      <div className="flex flex-col items-center gap-1 rounded-xl bg-white/[0.04] border border-white/8 p-3">
        <TrendingUp className={cn("h-4 w-4",
          summary.avgConfidence >= 70 ? "text-emerald-400" : summary.avgConfidence >= 54 ? "text-amber-400" : "text-red-400")} />
        <span className={cn("text-lg font-black",
          summary.avgConfidence >= 70 ? "text-emerald-400" : summary.avgConfidence >= 54 ? "text-amber-400" : "text-red-400")}>
          {summary.avgConfidence}%
        </span>
        <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Confiance</span>
      </div>

      {/* Risque global */}
      <div className={cn("flex flex-col items-center gap-1 rounded-xl border p-3", risk.bg)}>
        <Shield className={cn("h-4 w-4", risk.color)} />
        <span className={cn("text-lg font-black", risk.color)}>{risk.label}</span>
        <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Risque</span>
      </div>
    </div>
  );
};

export default PredictionTicketSummary;
