import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAdminAuditLogForUser } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ScrollText,
  Shield,
  User,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Download,
  Filter,
  Clock,
  Activity,
  Ban,
  Crown,
  Trash2,
  Loader2,
} from "lucide-react";

const ACTION_ICONS: Record<string, any> = {
  ban: Ban,
  unban: CheckCircle,
  grant_vip: Crown,
  revoke_vip: XCircle,
  delete_user: Trash2,
  moderation_approve: CheckCircle,
  moderation_reject: XCircle,
  feature_flag_set: Shield,
  partner_create: DollarSign,
  partner_update: DollarSign,
};

const ACTION_COLORS: Record<string, string> = {
  ban: "bg-red-500/10 text-red-400 border-red-500/30",
  unban: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  grant_vip: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  revoke_vip: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  delete_user: "bg-destructive/10 text-destructive border-destructive/30",
  moderation_approve: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  moderation_reject: "bg-red-500/10 text-red-400 border-red-500/30",
  feature_flag_set: "bg-blue-500/10 text-blue-400 border-blue-500/30",
};

const ACTION_LABELS: Record<string, string> = {
  ban: "Bannissement",
  unban: "Débannissement",
  grant_vip: "Attribution VIP",
  revoke_vip: "Révocation VIP",
  delete_user: "Suppression compte",
  moderation_approve: "Modération (OK)",
  moderation_reject: "Modération (Rejet)",
  feature_flag_set: "Feature Flag",
  partner_create: "Nouveau partenaire",
  partner_update: "MàJ partenaire",
};

// Mock data pour les logs système
const MOCK_SYSTEM_LOGS = [
  { id: 1, timestamp: new Date().toISOString(), level: "info", source: "api-football", message: "API quota: 85/100 remaining" },
  { id: 2, timestamp: new Date(Date.now() - 300000).toISOString(), level: "warning", source: "edge-function", message: "Slow response: ai-prediction (2.3s)" },
  { id: 3, timestamp: new Date(Date.now() - 600000).toISOString(), level: "error", source: "webhook", message: "Chariow webhook failed: timeout" },
  { id: 4, timestamp: new Date(Date.now() - 900000).toISOString(), level: "info", source: "auth", message: "New signup: user_12345@example.com" },
  { id: 5, timestamp: new Date(Date.now() - 1200000).toISOString(), level: "info", source: "database", message: "Auto-vacuum completed" },
];

export default function AdminLogs() {
  const [activeTab, setActiveTab] = useState("audit");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pour les logs d'audit, on utilise un userId fictif pour récupérer tous les logs
  // Dans la vraie vie, on aurait une RPC dédiée
  const { data: auditLogs, isLoading } = useAdminAuditLogForUser(null, 100);

  const filteredLogs = auditLogs?.filter((log) => {
    if (filterAction !== "all" && log.action !== filterAction) return false;
    if (searchQuery && !log.action.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleExport = () => {
    const dataStr = JSON.stringify(auditLogs || [], null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `audit-logs-${new Date().toISOString().split("T")[0]}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    toast.success("Logs exportés");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Logs & Audit</h1>
          <p className="text-sm text-slate-400 mt-1">
            Historique des actions et logs système
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exporter JSON
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
          <TabsTrigger value="audit" className="text-xs sm:text-sm">
            <ScrollText className="h-4 w-4 mr-2" />
            Logs d'audit
          </TabsTrigger>
          <TabsTrigger value="system" className="text-xs sm:text-sm">
            <Activity className="h-4 w-4 mr-2" />
            Logs système
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="mt-4 space-y-4">
          {/* Filters */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Rechercher une action..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700">
                      <SelectValue placeholder="Filtrer par action" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">Toutes les actions</SelectItem>
                      <SelectItem value="ban">Bannissements</SelectItem>
                      <SelectItem value="grant_vip">Attributions VIP</SelectItem>
                      <SelectItem value="delete_user">Suppressions</SelectItem>
                      <SelectItem value="moderation_approve">Modérations OK</SelectItem>
                      <SelectItem value="moderation_reject">Modérations Rejet</SelectItem>
                      <SelectItem value="feature_flag_set">Feature Flags</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs List */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-primary" />
                Historique des actions admin
                {filteredLogs && (
                  <Badge variant="outline" className="ml-2">
                    {filteredLogs.length} entrées
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="p-4 space-y-3">
                    {filteredLogs?.map((log) => {
                      const Icon = ACTION_ICONS[log.action] || Activity;
                      const colorClass = ACTION_COLORS[log.action] || "bg-slate-500/10 text-slate-400";
                      const label = ACTION_LABELS[log.action] || log.action;

                      return (
                        <div
                          key={log.id}
                          className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", colorClass.split(" ")[0])}>
                                <Icon className={cn("h-5 w-5", colorClass.includes("text-") ? colorClass.split("text-")[1].split("-")[0] : "slate-400")} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className={cn("text-xs", colorClass)}>
                                    {label}
                                  </Badge>
                                  <span className="text-xs text-slate-500">
                                    {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-400">
                                  Par {log.admin_email || "Admin"}
                                </p>
                                {log.target_type && log.target_id && (
                                  <p className="text-xs text-slate-500 mt-1">
                            {log.target_type}: {log.target_id.slice(0, 20)}...
                          </p>
                                )}
                                {log.details && Object.keys(log.details).length > 0 && (
                                  <div className="mt-2 p-2 bg-slate-950 rounded text-xs text-slate-500 font-mono">
                                    {JSON.stringify(log.details, null, 2)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {filteredLogs?.length === 0 && (
                      <div className="text-center py-12">
                        <ScrollText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">Aucun log trouvé</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Logs Système (Edge Functions, API)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-4 space-y-2 font-mono text-sm">
                  {MOCK_SYSTEM_LOGS.map((log) => (
                    <div
                      key={log.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        log.level === "error" && "bg-red-500/10 border-red-500/30 text-red-400",
                        log.level === "warning" && "bg-amber-500/10 border-amber-500/30 text-amber-400",
                        log.level === "info" && "bg-slate-800/50 border-slate-700 text-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-500">
                          {format(new Date(log.timestamp), "HH:mm:ss")}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            log.level === "error" && "border-red-500/30 text-red-400",
                            log.level === "warning" && "border-amber-500/30 text-amber-400",
                            log.level === "info" && "border-slate-500/30 text-slate-400"
                          )}
                        >
                          {log.level.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-slate-500">[{log.source}]</span>
                      </div>
                      <p className={cn(
                        log.level === "error" && "text-red-300",
                        log.level === "warning" && "text-amber-300",
                        log.level === "info" && "text-slate-300"
                      )}>
                        {log.message}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
