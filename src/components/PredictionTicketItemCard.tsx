import { X, ShieldCheck, ShieldAlert, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PredictionTicketItem } from "@/types/predictionTicket";

interface PredictionTicketItemCardProps {
  item: PredictionTicketItem;
  onRemove: (id: string) => void;
}

const riskConfig = {
  low:    { icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Faible risque" },
  medium: { icon: ShieldAlert, color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",   label: "Risque modéré" },
  high:   { icon: ShieldOff,   color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",        label: "Risque élevé" },
};

const sourceLabels: Record<string, string> = {
  ai: "IA Expert",
  api: "API Football",
  local: "Analyse locale",
  user: "Manuel",
};

const PredictionTicketItemCard = ({ item, onRemove }: PredictionTicketItemCardProps) => {
  const risk = riskConfig[item.risk ?? "medium"];
  const RiskIcon = risk.icon;
  const conf = item.confidence ?? 50;

  return (
    <div className="group relative rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-200 overflow-hidden">
      {/* Left accent strip */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl",
        item.risk === "low" ? "bg-emerald-500" : item.risk === "high" ? "bg-red-500" : "bg-amber-500")} />

      <div className="p-3 pl-4">
        {/* Match header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {item.homeLogo && (
              <img src={item.homeLogo} alt="" className="h-4 w-4 object-contain shrink-0" onError={e => (e.currentTarget.style.display = "none")} />
            )}
            <p className="text-[10px] text-white/50 font-medium truncate">
              {item.homeTeam} <span className="text-white/30">vs</span> {item.awayTeam}
            </p>
            {item.awayLogo && (
              <img src={item.awayLogo} alt="" className="h-4 w-4 object-contain shrink-0" onError={e => (e.currentTarget.style.display = "none")} />
            )}
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="shrink-0 h-5 w-5 rounded-md bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/30 flex items-center justify-center transition-colors"
            aria-label="Supprimer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* League + date */}
        {(item.leagueName || item.matchDate) && (
          <p className="text-[9px] text-white/30 mb-2 truncate">
            {item.leagueName}{item.leagueName && item.matchDate ? " · " : ""}{item.matchDate}
          </p>
        )}

        {/* Prediction */}
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] text-white/40 uppercase font-black tracking-wider mb-0.5">{item.predictionLabel}</p>
            <p className="text-sm font-black text-white truncate">{String(item.predictionValue)}</p>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-bold", risk.bg, risk.color)}>
              <RiskIcon className="h-2.5 w-2.5" />
              {risk.label}
            </div>
            <span className={cn("text-xs font-black",
              conf >= 70 ? "text-emerald-400" : conf >= 54 ? "text-amber-400" : "text-red-400")}>
              {conf}%
            </span>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mt-2 h-1 rounded-full bg-white/8 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all",
              item.risk === "low" ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
              : item.risk === "high" ? "bg-gradient-to-r from-red-500 to-red-400"
              : "bg-gradient-to-r from-amber-500 to-amber-400")}
            style={{ width: `${conf}%` }}
          />
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between mt-1.5">
          {item.source && (
            <span className="text-[8px] text-white/25 font-medium">{sourceLabels[item.source] ?? item.source}</span>
          )}
          {item.odd && (
            <span className="text-[8px] text-white/30 font-medium">Cote indicative : {item.odd}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionTicketItemCard;
