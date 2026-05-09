import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Lock, Crown, X, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PredictiveAlertsProps {
  fixtureId: string;
  homeTeamName: string;
  awayTeamName: string;
  alerts?: AlertItem[];
}

interface AlertItem {
  type: "injury" | "odds_move" | "weather" | "lineup" | "value_bet";
  icon: string;
  text: string;
  time: string;
  severity: "high" | "medium" | "low";
}

const SEVERITY_COLORS = {
  high: "border-red-500/20 bg-red-500/5 text-red-400",
  medium: "border-amber-500/20 bg-amber-500/5 text-amber-400",
  low: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
};

async function subscribeToPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    toast.error("Votre navigateur ne supporte pas les notifications push");
    return false;
  }
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export default function PredictiveAlerts({
  fixtureId, homeTeamName, awayTeamName, alerts = [],
}: PredictiveAlertsProps) {
  const { isVip } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dismissed, setDismissed] = useState<number[]>([]);

  useEffect(() => {
    if (!isVip) return;
    if ("Notification" in window && Notification.permission === "granted") {
      setIsSubscribed(true);
    }
  }, [isVip]);

  const handleSubscribe = async () => {
    if (!isVip) return;
    setIsLoading(true);
    const ok = await subscribeToPush();
    setIsLoading(false);
    if (ok) {
      setIsSubscribed(true);
      toast.success("Alertes push activées pour ce match !");
    } else {
      toast.error("Permission refusée — activez les notifications dans votre navigateur");
    }
  };

  // Demo alerts if none provided
  const displayAlerts: AlertItem[] = alerts.length > 0 ? alerts : [
    { type: "injury", icon: "🏥", text: `Blessure possible côté ${homeTeamName} — gardien incertain`, time: "2h avant", severity: "high" },
    { type: "odds_move", icon: "📉", text: `Mouvement de cote suspect sur ${homeTeamName} (1.95→1.62 en 30min)`, time: "1h avant", severity: "medium" },
    { type: "weather", icon: "🌧️", text: "Conditions météo défavorables — pelouse lourde, BTTS recalibré", time: "3h avant", severity: "low" },
  ];

  const visibleAlerts = displayAlerts.filter((_, i) => !dismissed.includes(i));

  return (
    <div className="relative rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/40 to-[#0a0d14] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-red-500/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center relative">
            <Bell className="h-4 w-4 text-red-400" />
            {visibleAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 border border-[#0a0d14] flex items-center justify-center text-[8px] font-black text-white">
                {visibleAlerts.length}
              </span>
            )}
          </div>
          <div>
            <h4 className="text-xs font-black text-white flex items-center gap-2">
              ⚡ Alertes Prédictives
              {!isVip && <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-black"><Crown className="h-2 w-2 inline" /> VIP</span>}
            </h4>
            <p className="text-[9px] text-red-400/50">Blessures · Cotes · Météo</p>
          </div>
        </div>

        {isVip && (
          <button
            onClick={isSubscribed ? () => { setIsSubscribed(false); toast.info("Alertes push désactivées"); } : handleSubscribe}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black transition-colors ${
              isSubscribed
                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400"
                : "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
            }`}
          >
            {isSubscribed ? <><CheckCircle className="h-3 w-3" /> Activé</> : <><Bell className="h-3 w-3" /> Activer</>}
          </button>
        )}
      </div>

      <div className="p-4 relative">
        {/* Non-VIP lock */}
        {!isVip && (
          <div className="absolute inset-0 z-10 backdrop-blur-sm bg-black/40 flex flex-col items-center justify-center gap-2 rounded-b-2xl">
            <Lock className="h-5 w-5 text-amber-400" />
            <p className="text-xs font-black text-white">Réservé aux membres Annuels</p>
            <p className="text-[10px] text-white/50 text-center max-w-[200px]">Recevez les alertes avant tout le monde</p>
            <Link to="/pricing" className="mt-2 px-4 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black hover:bg-amber-400 transition-colors">
              Plan Annuel
            </Link>
          </div>
        )}

        {/* Alerts list */}
        <AnimatePresence>
          {visibleAlerts.length > 0 ? visibleAlerts.map((alert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10, height: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-3 p-2.5 rounded-xl border mb-2 last:mb-0 ${SEVERITY_COLORS[alert.severity]}`}
            >
              <span className="text-sm shrink-0">{alert.icon}</span>
              <span className="text-[11px] text-white/70 flex-1 leading-relaxed">{alert.text}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] font-bold opacity-70">{alert.time}</span>
                <button onClick={() => setDismissed(d => [...d, i])} className="opacity-40 hover:opacity-70 transition-opacity">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          )) : (
            <div className="text-center py-3 text-[11px] text-white/30">
              <BellOff className="h-5 w-5 mx-auto mb-1 opacity-30" />
              Aucune alerte pour ce match
            </div>
          )}
        </AnimatePresence>

        {/* Push subscribe prompt */}
        {isVip && !isSubscribed && (
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="mt-3 w-full py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <Bell className="h-3.5 w-3.5" />
            {isLoading ? "Activation..." : "Activer les notifications push pour ce match"}
          </button>
        )}
      </div>
    </div>
  );
}
