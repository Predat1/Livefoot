import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Copy,
  Loader2,
  Share2,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Ticket,
  Trash2,
} from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHeadEnhanced";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePredictionTicket } from "@/contexts/PredictionTicketContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { PredictionTicket, PredictionTicketItem, TicketSummary } from "@/types/predictionTicket";
import { toast } from "sonner";

type StoredTicketRow = {
  id: string;
  user_id: string | null;
  title: string | null;
  status: "draft" | "saved" | "shared";
  items: PredictionTicketItem[];
  public_share_id: string | null;
  created_at: string;
  updated_at: string;
};

const riskConfig = {
  low: { icon: ShieldCheck, label: "Faible", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  medium: { icon: ShieldAlert, label: "Modere", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  high: { icon: ShieldOff, label: "Eleve", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
};

function summarizeItems(items: PredictionTicketItem[]): TicketSummary {
  if (!items.length) return { count: 0, avgConfidence: 0, globalRisk: "low", matchCount: 0, categories: [] };

  const avgConfidence = Math.round(
    items.reduce((sum, item) => sum + (item.confidence ?? 50), 0) / items.length,
  );
  const high = items.filter((item) => item.risk === "high").length;
  const medium = items.filter((item) => item.risk === "medium").length;
  const globalRisk: "low" | "medium" | "high" =
    high > items.length * 0.4 ? "high" : high + medium > items.length * 0.4 ? "medium" : "low";

  return {
    count: items.length,
    avgConfidence,
    globalRisk,
    matchCount: new Set(items.map((item) => item.fixtureId)).size,
    categories: [...new Set(items.map((item) => item.predictionKey))],
  };
}

function mapStoredTicket(row: StoredTicketRow): PredictionTicket {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    title: row.title ?? undefined,
    status: row.status,
    items: row.items || [],
    publicShareId: row.public_share_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const Tickets = () => {
  const { user } = useAuth();
  const { ticket, count, setOpen, saveTicket, shareTicket, clearTicket, isSaving } = usePredictionTicket();
  const [savedTickets, setSavedTickets] = useState<PredictionTicket[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeSummary = useMemo(() => summarizeItems(ticket.items), [ticket.items]);

  const loadSavedTickets = useCallback(async () => {
    if (!user) {
      setSavedTickets([]);
      return;
    }
    setLoadingSaved(true);
    try {
      const { data, error } = await supabase
        .from("prediction_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setSavedTickets(((data || []) as unknown as StoredTicketRow[]).map(mapStoredTicket));
    } catch (error: any) {
      toast.error("Impossible de charger vos tickets", { description: error?.message || "Reessayez plus tard." });
    } finally {
      setLoadingSaved(false);
    }
  }, [user]);

  useEffect(() => {
    loadSavedTickets();
  }, [loadSavedTickets]);

  const handleSaveActive = async () => {
    await saveTicket();
    await loadSavedTickets();
  };

  const handleShareActive = async () => {
    await shareTicket();
    await loadSavedTickets();
  };

  const copyTicketLink = async (shareId?: string) => {
    if (!shareId) {
      toast.error("Ce ticket n'a pas encore de lien public.");
      return;
    }
    const url = `${window.location.origin}/ticket/${shareId}`;
    await navigator.clipboard.writeText(url);
    toast.success("Lien du ticket copie");
  };

  const deleteSavedTicket = async (ticketId: string) => {
    if (!user) return;
    setDeletingId(ticketId);
    try {
      const { error } = await supabase
        .from("prediction_tickets")
        .delete()
        .eq("id", ticketId)
        .eq("user_id", user.id);
      if (error) throw error;
      setSavedTickets((items) => items.filter((item) => item.id !== ticketId));
      toast.success("Ticket supprime");
    } catch (error: any) {
      toast.error("Suppression impossible", { description: error?.message || "Reessayez." });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Mes tickets de predictions | LiveFoot"
        description="Consultez votre ticket actif, vos tickets sauvegardes et vos tickets partages LiveFoot."
      />

      <main className="container py-6 sm:py-8 pb-24 lg:pb-10">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary mb-3">
              <Ticket className="h-3.5 w-3.5" />
              Mes tickets
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">Tickets de predictions</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Organisez vos pronostics, sauvegardez vos choix et partagez-les avec un lien LiveFoot.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/daily-picks">
              Explorer les matchs <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-5 rounded-2xl bg-card border border-border/60 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border/60 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-black text-foreground">Ticket actif</h2>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground">
                {count} selection{count > 1 ? "s" : ""}
              </span>
            </div>

            <div className="p-4 space-y-4">
              {count === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto h-14 w-14 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-4">
                    <Ticket className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <p className="font-bold text-foreground mb-1">Aucun pronostic selectionne</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-4">
                    Ajoutez des predictions depuis une carte de match pour composer votre ticket.
                  </p>
                  <Button asChild size="sm">
                    <Link to="/daily-picks">Voir les picks du jour</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <TicketStats summary={activeSummary} />
                  <div className="space-y-2">
                    {ticket.items.slice(0, 5).map((item) => (
                      <TicketLine key={item.id} item={item} />
                    ))}
                    {ticket.items.length > 5 && (
                      <button
                        onClick={() => setOpen(true)}
                        className="w-full text-xs font-bold text-primary py-2 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors"
                      >
                        Voir les {ticket.items.length} selections
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => setOpen(true)} variant="outline">Ouvrir</Button>
                    <Button onClick={handleSaveActive} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Sauvegarder
                    </Button>
                    <Button onClick={handleShareActive} variant="secondary">
                      <Share2 className="h-4 w-4 mr-2" /> Partager
                    </Button>
                    <Button onClick={clearTicket} variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> Vider
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="lg:col-span-7 rounded-2xl bg-card border border-border/60 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border/60 bg-muted/20 flex items-center justify-between">
              <h2 className="text-sm font-black text-foreground">Tickets sauvegardes</h2>
              {user && (
                <button onClick={loadSavedTickets} className="text-[10px] font-bold text-primary hover:underline">
                  Actualiser
                </button>
              )}
            </div>

            <div className="p-4">
              {!user ? (
                <div className="py-12 text-center">
                  <p className="font-bold text-foreground mb-1">Connectez-vous pour retrouver vos tickets</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                    Votre ticket actif reste disponible sur cet appareil. La connexion permet de sauvegarder et retrouver vos tickets plus tard.
                  </p>
                  <Button asChild>
                    <Link to="/auth">Connexion / inscription</Link>
                  </Button>
                </div>
              ) : loadingSaved ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : savedTickets.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="font-bold text-foreground mb-1">Aucun ticket sauvegarde</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Sauvegardez votre ticket actif pour le retrouver ici.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedTickets.map((storedTicket) => (
                    <SavedTicketCard
                      key={storedTicket.id}
                      ticket={storedTicket}
                      deleting={deletingId === storedTicket.id}
                      onCopy={() => copyTicketLink(storedTicket.publicShareId)}
                      onDelete={() => deleteSavedTicket(storedTicket.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        </div>

        <div className="mt-5 rounded-xl border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
          Ticket de predictions a titre informatif. Aucun pari, depot, retrait ou transaction n'est effectue sur LiveFoot.
        </div>
      </main>
    </Layout>
  );
};

function TicketStats({ summary }: { summary: TicketSummary }) {
  const risk = riskConfig[summary.globalRisk];
  const RiskIcon = risk.icon;

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-xl bg-muted/30 border border-border/60 p-3 text-center">
        <p className="text-lg font-black text-foreground">{summary.count}</p>
        <p className="text-[9px] uppercase font-bold text-muted-foreground">Selections</p>
      </div>
      <div className="rounded-xl bg-muted/30 border border-border/60 p-3 text-center">
        <p className={cn("text-lg font-black", summary.avgConfidence >= 70 ? "text-emerald-500" : summary.avgConfidence >= 54 ? "text-amber-500" : "text-red-500")}>
          {summary.avgConfidence}%
        </p>
        <p className="text-[9px] uppercase font-bold text-muted-foreground">Confiance</p>
      </div>
      <div className={cn("rounded-xl border p-3 text-center", risk.bg)}>
        <RiskIcon className={cn("h-4 w-4 mx-auto mb-1", risk.color)} />
        <p className={cn("text-xs font-black", risk.color)}>{risk.label}</p>
        <p className="text-[9px] uppercase font-bold text-muted-foreground">Risque</p>
      </div>
    </div>
  );
}

function TicketLine({ item }: { item: PredictionTicketItem }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
      <p className="text-[10px] text-muted-foreground truncate">
        {item.homeTeam} vs {item.awayTeam}
      </p>
      <div className="flex items-end justify-between gap-3 mt-1">
        <div className="min-w-0">
          <p className="text-[9px] uppercase font-black text-muted-foreground">{item.predictionLabel}</p>
          <p className="text-sm font-black text-foreground truncate">{String(item.predictionValue)}</p>
        </div>
        <span className="text-xs font-black text-primary">{item.confidence ?? 50}%</span>
      </div>
    </div>
  );
}

function SavedTicketCard({
  ticket,
  deleting,
  onCopy,
  onDelete,
}: {
  ticket: PredictionTicket;
  deleting: boolean;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const summary = summarizeItems(ticket.items);
  const risk = riskConfig[summary.globalRisk];
  const RiskIcon = risk.icon;

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black text-foreground truncate">{ticket.title || "Ticket de predictions"}</p>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString("fr-FR")}
            </span>
            <span>{summary.count} selection{summary.count > 1 ? "s" : ""}</span>
            <span>{summary.matchCount} match{summary.matchCount > 1 ? "s" : ""}</span>
          </div>
        </div>
        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black", risk.bg, risk.color)}>
          <RiskIcon className="h-3 w-3" />
          {risk.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 my-3">
        <div className="rounded-lg bg-background/50 p-2 text-center">
          <p className="text-sm font-black text-foreground">{summary.count}</p>
          <p className="text-[8px] text-muted-foreground uppercase font-bold">Choix</p>
        </div>
        <div className="rounded-lg bg-background/50 p-2 text-center">
          <p className="text-sm font-black text-primary">{summary.avgConfidence}%</p>
          <p className="text-[8px] text-muted-foreground uppercase font-bold">Confiance</p>
        </div>
        <div className="rounded-lg bg-background/50 p-2 text-center">
          <p className="text-sm font-black text-foreground capitalize">{ticket.status}</p>
          <p className="text-[8px] text-muted-foreground uppercase font-bold">Statut</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {ticket.publicShareId && (
          <Button asChild size="sm" variant="default">
            <Link to={`/ticket/${ticket.publicShareId}`}>
              Ouvrir <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onCopy} disabled={!ticket.publicShareId}>
          <Copy className="h-3.5 w-3.5 mr-1" /> Copier lien
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete} disabled={deleting}>
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
          Supprimer
        </Button>
      </div>
    </div>
  );
}

export default Tickets;
