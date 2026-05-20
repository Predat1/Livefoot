import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminApiUsageStats, useAdminStats, usePurgeCache } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";
import {
  Activity,
  Brain,
  CheckCircle,
  Cpu,
  Loader2,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const modules = [
  {
    name: "Pronostics IA",
    description: "Analyse pre-match, probabilites et score exact.",
    status: "operationnel",
    icon: Trophy,
  },
  {
    name: "Chat match",
    description: "Assistant conversationnel pour les pages de match.",
    status: "operationnel",
    icon: MessageSquare,
  },
  {
    name: "Value bets",
    description: "Detection des ecarts entre probabilites et cotes.",
    status: "surveille",
    icon: Target,
  },
  {
    name: "Alertes integrite",
    description: "Signalement des anomalies et mouvements suspects.",
    status: "operationnel",
    icon: ShieldCheck,
  },
];

export default function AdminAI() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: apiStats, isLoading: apiLoading } = useAdminApiUsageStats(7);
  const purgeCache = usePurgeCache();

  const handleRefresh = async () => {
    try {
      await purgeCache.mutateAsync();
      toast.success("Cache IA et prédictions purgé");
    } catch (e) {
      const error = e as Error;
      toast.error(error.message || "Impossible de purger le cache");
    }
  };

  const checkEdgeFunctionsStatus = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
    if (!supabaseUrl) {
      toast.error("VITE_SUPABASE_URL non configuré");
      return;
    }
    toast.loading("Vérification des Edge Functions...", { id: "check-fns" });
    try {
      const start = Date.now();
      await Promise.all([
        fetch(`${supabaseUrl}/functions/v1/api-football`, { method: "OPTIONS" }).catch(() => ({ ok: false })),
        fetch(`${supabaseUrl}/functions/v1/ai-prediction`, { method: "OPTIONS" }).catch(() => ({ ok: false }))
      ]);
      const latency = Date.now() - start;
      toast.success(`Edge Functions opérationnelles ! Latence: ${latency}ms`, { id: "check-fns" });
    } catch (e) {
      toast.error("Erreur de connexion aux Edge Functions", { id: "check-fns" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">IA & Predictions</h1>
          <p className="text-sm text-slate-400 mt-1">
            Pilotage des modules intelligents LiveFoot
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={purgeCache.isPending}>
          {purgeCache.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Rafraichir les caches
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={Brain} label="Pronostics" value={stats?.total_predictions || 0} loading={statsLoading} color="bg-purple-500" />
        <MetricCard icon={Activity} label="Quota restant" value={`${apiStats?.quota_remaining_today ?? 0}/${apiStats?.quota_limit ?? 7000}`} loading={apiLoading} color="bg-blue-500" />
        <MetricCard icon={Zap} label="Cache hits jour" value={apiStats?.cache_hits_today || 0} loading={apiLoading} color="bg-amber-500" />
        <MetricCard icon={Cpu} label="Temps moyen" value={`${apiStats?.avg_response_time || 0}ms`} loading={apiLoading} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={Activity} label="Requetes API 7j" value={apiStats?.total_requests || 0} loading={apiLoading} color="bg-sky-500" />
        <MetricCard icon={ShieldCheck} label="Erreurs API" value={apiStats?.total_errors || 0} loading={apiLoading} color="bg-red-500" />
        <MetricCard icon={RefreshCw} label="Stale servis" value={apiStats?.stale_hits_today || 0} loading={apiLoading} color="bg-indigo-500" />
        <MetricCard icon={ShieldCheck} label="Quota bloque" value={apiStats?.quota_exceeded_today || 0} loading={apiLoading} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Card key={module.name} className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-bold text-white">{module.name}</h2>
                      <p className="text-sm text-slate-400 mt-1">{module.description}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize",
                      module.status === "operationnel"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    )}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {module.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Actions de contrôle
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ControlAction 
            title="Vérifier les fonctions" 
            value="Tester l'état de api-football, ai-prediction, ai-chat" 
            onClick={checkEdgeFunctionsStatus}
          />
          <ControlAction 
            title="Surveiller les quotas" 
            value="Consulter les requêtes et erreurs API sur 7 jours" 
            onClick={() => navigate("/admin/logs")}
          />
          <ControlAction 
            title="Purger les caches" 
            value="Forcer une régénération des résultats IA" 
            onClick={handleRefresh}
            disabled={purgeCache.isPending}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  loading,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  loading?: boolean;
  color: string;
}) {
  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-lg font-black text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : value}
          </p>
          <p className="text-xs text-slate-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ControlAction({ 
  title, 
  value, 
  onClick, 
  disabled 
}: { 
  title: string; 
  value: string; 
  onClick?: () => void; 
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className="text-left w-full rounded-lg border border-slate-800 bg-slate-800/40 p-4 hover:bg-slate-800/80 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
    >
      <p className="font-bold text-white">{title}</p>
      <p className="text-sm text-slate-400 mt-1">{value}</p>
    </button>
  );
}
