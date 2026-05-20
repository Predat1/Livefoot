import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  useAdminModerationStats,
  useAdminModerationQueue,
  useModerationAction,
} from "@/hooks/useAdmin";
import {
  FileText,
  Trophy,
  MessageSquare,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Flag,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Shield,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const mockContent = {
  matches: [
    { id: 1, title: "PSG vs Real Madrid", status: "live", date: "2024-01-15 20:45", views: 12500 },
    { id: 2, title: "Manchester City vs Arsenal", status: "upcoming", date: "2024-01-16 18:30", views: 8900 },
    { id: 3, title: "Barcelona vs Atletico Madrid", status: "finished", date: "2024-01-14 21:00", views: 15600 },
  ],
  news: [
    { id: 1, title: "Mercato: Mbappé vers le Real confirmé?", status: "published", author: "John Doe", views: 45000 },
    { id: 2, title: "Ligue 1: Les résultats du weekend", status: "draft", author: "Jane Smith", views: 0 },
    { id: 3, title: "Champions League: Analyse des groupes", status: "published", author: "John Doe", views: 32000 },
  ],
  comments: [
    { id: 1, user: "Admin", content: "Pronostic coherent et bien argumente.", match: "PSG vs Real Madrid", reports: 0 },
    { id: 2, user: "Moderateur", content: "Commentaire signale pour verification.", match: "Manchester City vs Arsenal", reports: 2 },
    { id: 3, user: "LiveFoot", content: "Message a valider avant publication.", match: "Barcelona vs Atletico Madrid", reports: 1 },
  ],
};

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState("moderation");
  const [searchQuery, setSearchQuery] = useState("");

  // Real moderation hooks
  const { data: moderationStats, isLoading: statsLoading } = useAdminModerationStats();
  const { data: moderationQueue, isLoading: queueLoading } = useAdminModerationQueue("pending");
  const moderationAction = useModerationAction();

  const handleModerationAction = async (reportId: string, action: "approve" | "reject") => {
    try {
      await moderationAction.mutateAsync({ reportId, action });
      toast.success(`Contenu ${action === "approve" ? "approuvé" : "rejeté"}`);
    } catch (e) {
      const error = e as Error;
      toast.error(error.message || "Erreur lors de la modération");
    }
  };

  const handleAction = (type: string, id: number) => {
    toast.info(`${type} pour l'élément #${id} (Simulé)`);
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
          <h1 className="text-2xl font-black text-white">Gestion du Contenu</h1>
          <p className="text-sm text-slate-400 mt-1">
            Matchs, actualités et modération
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau contenu
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Trophy} label="Matchs" value="156" color="bg-blue-500" />
        <StatCard icon={FileText} label="Articles" value="48" color="bg-emerald-500" />
        <StatCard icon={MessageSquare} label="Commentaires" value="2.4k" color="bg-amber-500" />
        <StatCard 
          icon={Flag} 
          label="À modérer" 
          value={moderationStats?.pending_count || 0} 
          color="bg-red-500" 
          loading={statsLoading}
          alert={(moderationStats?.pending_count || 0) > 0}
        />
      </div>

      {/* Main Content Tabs */}
      <Card className="bg-slate-900/50 border-slate-800">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="border-b border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList className="bg-slate-800">
                <TabsTrigger value="moderation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative">
                  <Shield className="h-4 w-4 mr-2" />
                  Modération
                  {(moderationStats?.pending_count || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
                      {moderationStats?.pending_count}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="matches" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Trophy className="h-4 w-4 mr-2" />
                  Matchs
                </TabsTrigger>
                <TabsTrigger value="news" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <FileText className="h-4 w-4 mr-2" />
                  Actualités
                </TabsTrigger>
                <TabsTrigger value="comments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Commentaires
                </TabsTrigger>
              </TabsList>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[200px] bg-slate-800/50 border-slate-700"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <TabsContent value="matches" className="m-0">
              <ContentTable
                headers={["Match", "Date", "Statut", "Vues", "Actions"]}
                data={mockContent.matches}
                renderRow={(match) => (
                  <>
                    <td className="px-4 py-3 font-medium text-slate-200">{match.title}</td>
                    <td className="px-4 py-3 text-slate-400">{match.date}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={match.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-400">{match.views.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleAction("Édition", match.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleAction("Suppression", match.id)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </>
                )}
              />
            </TabsContent>

            <TabsContent value="news" className="m-0">
              <ContentTable
                headers={["Titre", "Auteur", "Statut", "Vues", "Actions"]}
                data={mockContent.news}
                renderRow={(news) => (
                  <>
                    <td className="px-4 py-3 font-medium text-slate-200">{news.title}</td>
                    <td className="px-4 py-3 text-slate-400">{news.author}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={news.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-400">{news.views.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleAction("Édition", news.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleAction("Suppression", news.id)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </>
                )}
              />
            </TabsContent>

            <TabsContent value="comments" className="m-0">
              <ContentTable
                headers={["Utilisateur", "Commentaire", "Match", "Signalements", "Actions"]}
                data={mockContent.comments}
                renderRow={(comment) => (
                  <>
                    <td className="px-4 py-3 font-medium text-slate-200">{comment.user}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-[300px] truncate">{comment.content}</td>
                    <td className="px-4 py-3 text-slate-400">{comment.match}</td>
                    <td className="px-4 py-3">
                      {comment.reports > 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-400 text-sm">
                          <Flag className="h-3 w-3" />
                          {comment.reports}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleAction("Approbation", comment.id)}>
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleAction("Rejet", comment.id)}>
                          <XCircle className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </>
                )}
              />
            </TabsContent>

            <TabsContent value="moderation" className="m-0">
              {queueLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : moderationQueue?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="h-12 w-12 text-emerald-500/50 mb-4" />
                  <p className="text-lg font-medium text-white">Rien à modérer</p>
                  <p className="text-sm text-slate-400">La file d'attente est vide</p>
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  {moderationQueue?.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="capitalize">
                              {item.content_type}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn(
                                "capitalize",
                                item.report_reason === "spam" && "text-red-400 border-red-500/30",
                                item.report_reason === "inappropriate" && "text-amber-400 border-amber-500/30",
                              )}
                            >
                              {item.report_reason}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {format(new Date(item.created_at), "dd/MM HH:mm", { locale: fr })}
                            </span>
                          </div>
                          
                          <p className="text-sm text-slate-300 mb-2 line-clamp-2">
                            {item.content_preview || "Aperçu non disponible"}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.author_email || "Anonyme"}
                            </span>
                            {item.report_details && (
                              <span className="flex items-center gap-1 text-amber-400">
                                <AlertTriangle className="h-3 w-3" />
                                {item.report_details}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleModerationAction(item.id, "approve")}
                            disabled={moderationAction.isPending}
                          >
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleModerationAction(item.id, "reject")}
                            disabled={moderationAction.isPending}
                          >
                            <XCircle className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </motion.div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color,
  loading,
  alert,
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  value: string | number; 
  color: string;
  loading?: boolean;
  alert?: boolean;
}) {
  return (
    <Card className={cn("bg-slate-900/50 border-slate-800", alert && "border-red-500/30")}>
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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    live: "bg-red-500/10 text-red-400 border-red-500/20",
    upcoming: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    finished: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    draft: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  const labels: Record<string, string> = {
    live: "En direct",
    upcoming: "À venir",
    finished: "Terminé",
    published: "Publié",
    draft: "Brouillon",
    approved: "Approuvé",
    pending: "En attente",
  };

  return (
    <span className={cn("inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border", colors[status] || colors.pending)}>
      {labels[status] || status}
    </span>
  );
}

function ContentTable<T>({
  headers,
  data,
  renderRow,
}: {
  headers: string[];
  data: T[];
  renderRow: (item: T) => React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-800/30">
            {headers.map((header) => (
              <th key={header} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {data.map((item, index) => (
            <motion.tr
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="hover:bg-slate-800/30 transition-colors"
            >
              {renderRow(item)}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
