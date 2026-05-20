import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { PredictionTicket, PredictionTicketItem, TicketSummary } from "@/types/predictionTicket";

// ─── Storage key ─────────────────────────────────────────────────────────────

const LS_KEY = "livefoot_prediction_ticket";

function genId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function genShareId(): string {
  return `LF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

function blankTicket(): PredictionTicket {
  const now = new Date().toISOString();
  return { id: genId(), items: [], status: "draft", createdAt: now, updatedAt: now };
}

// ─── Context type ─────────────────────────────────────────────────────────────

interface PredictionTicketContextType {
  ticket: PredictionTicket;
  count: number;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  addItem: (item: Omit<PredictionTicketItem, "id" | "createdAt">) => void;
  removeItem: (id: string) => void;
  clearTicket: () => void;
  updateItem: (id: string, updates: Partial<PredictionTicketItem>) => void;
  isInTicket: (fixtureId: string, predictionKey: string) => boolean;
  getItemId: (fixtureId: string, predictionKey: string) => string | undefined;
  getTicketSummary: () => TicketSummary;
  saveTicket: () => Promise<void>;
  shareTicket: () => Promise<string>;
  isSaving: boolean;
}

const PredictionTicketContext = createContext<PredictionTicketContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const PredictionTicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<PredictionTicket>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw) as PredictionTicket;
    } catch { /* ignore */ }
    return blankTicket();
  });
  const [isOpen, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Persist to localStorage ─────────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(ticket)); } catch { /* ignore */ }
  }, [ticket]);

  // ─── Sync from Supabase on login ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    supabase
      .from("prediction_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data && data.status !== "shared") {
          const remote = data as any;
          setTicket(prev => {
            // Merge: keep local items not already in remote
            const remoteItems: PredictionTicketItem[] = remote.items || [];
            const remoteKeys = new Set(remoteItems.map((i: PredictionTicketItem) => `${i.fixtureId}__${i.predictionKey}`));
            const onlyLocal = prev.items.filter(i => !remoteKeys.has(`${i.fixtureId}__${i.predictionKey}`));
            return {
              ...remote,
              id: remote.id,
              items: [...remoteItems, ...onlyLocal],
              status: "draft",
              updatedAt: new Date().toISOString(),
            };
          });
        }
      });
  }, [user?.id]);

  // ─── addItem ─────────────────────────────────────────────────────────────
  const addItem = useCallback((item: Omit<PredictionTicketItem, "id" | "createdAt">) => {
    setTicket(prev => {
      // Avoid duplicate: same fixture + predictionKey
      const exists = prev.items.some(
        i => i.fixtureId === item.fixtureId && i.predictionKey === item.predictionKey,
      );
      if (exists) {
        toast.info("Déjà dans le ticket", { description: `${item.predictionLabel} est déjà sélectionné.` });
        return prev;
      }
      const newItem: PredictionTicketItem = { ...item, id: genId(), createdAt: new Date().toISOString() };
      toast.success("Ajouté au ticket ✓", { description: `${item.predictionLabel} : ${item.predictionValue}` });
      return { ...prev, items: [...prev.items, newItem], updatedAt: new Date().toISOString(), status: "draft" };
    });
  }, []);

  // ─── removeItem ──────────────────────────────────────────────────────────
  const removeItem = useCallback((id: string) => {
    setTicket(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id), updatedAt: new Date().toISOString() }));
  }, []);

  // ─── clearTicket ─────────────────────────────────────────────────────────
  const clearTicket = useCallback(() => {
    setTicket({ ...blankTicket(), id: genId() });
    toast.info("Ticket vidé");
  }, []);

  // ─── updateItem ──────────────────────────────────────────────────────────
  const updateItem = useCallback((id: string, updates: Partial<PredictionTicketItem>) => {
    setTicket(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, ...updates } : i),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // ─── isInTicket ──────────────────────────────────────────────────────────
  const isInTicket = useCallback((fixtureId: string, predictionKey: string) =>
    ticket.items.some(i => i.fixtureId === fixtureId && i.predictionKey === predictionKey),
  [ticket.items]);

  const getItemId = useCallback((fixtureId: string, predictionKey: string) =>
    ticket.items.find(i => i.fixtureId === fixtureId && i.predictionKey === predictionKey)?.id,
  [ticket.items]);

  // ─── getTicketSummary ────────────────────────────────────────────────────
  const getTicketSummary = useCallback((): TicketSummary => {
    const { items } = ticket;
    if (items.length === 0) return { count: 0, avgConfidence: 0, globalRisk: "low", matchCount: 0, categories: [] };

    const confs = items.map(i => i.confidence ?? 50);
    const avgConfidence = Math.round(confs.reduce((a, b) => a + b, 0) / confs.length);

    const highCount = items.filter(i => i.risk === "high").length;
    const medCount  = items.filter(i => i.risk === "medium").length;
    const globalRisk: "low" | "medium" | "high" =
      highCount > items.length * 0.4 ? "high"
      : highCount + medCount > items.length * 0.4 ? "medium"
      : "low";

    const matchCount = new Set(items.map(i => i.fixtureId)).size;
    const categories = [...new Set(items.map(i => i.predictionKey))];

    return { count: items.length, avgConfidence, globalRisk, matchCount, categories };
  }, [ticket.items]);

  // ─── saveTicket ──────────────────────────────────────────────────────────
  const saveTicket = useCallback(async () => {
    if (ticket.items.length === 0) { toast.error("Le ticket est vide"); return; }
    setIsSaving(true);
    try {
      const shareId = ticket.publicShareId || genShareId();
      const payload = {
        id: ticket.id,
        user_id: user?.id ?? null,
        title: ticket.title || `Mon ticket — ${new Date().toLocaleDateString("fr-FR")}`,
        status: "saved",
        items: ticket.items,
        public_share_id: shareId,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("prediction_tickets").upsert(payload, { onConflict: "id" });
      if (error) throw error;
      setTicket(prev => ({ ...prev, status: "saved", publicShareId: shareId, updatedAt: new Date().toISOString() }));
      toast.success("Ticket sauvegardé ✓", { description: "Retrouvez-le dans votre profil." });
    } catch (e: any) {
      toast.error("Erreur de sauvegarde", { description: e?.message || "Réessayez." });
    } finally {
      setIsSaving(false);
    }
  }, [ticket, user]);

  // ─── shareTicket ─────────────────────────────────────────────────────────
  const shareTicket = useCallback(async (): Promise<string> => {
    await saveTicket();
    const shareId = ticket.publicShareId || "";
    const url = `${window.location.origin}/ticket/${shareId}`;
    const summary = getTicketSummary();
    const text = `Mon ticket LiveFoot : ${summary.count} prédictions, confiance moyenne ${summary.avgConfidence}%. Consulte-le ici : ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mon ticket LiveFoot", text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Lien copié !", { description: url });
      }
    } catch { /* cancelled by user */ }
    return url;
  }, [saveTicket, ticket.publicShareId, getTicketSummary]);

  const count = ticket.items.length;

  return (
    <PredictionTicketContext.Provider value={{
      ticket, count, isOpen, setOpen,
      addItem, removeItem, clearTicket, updateItem,
      isInTicket, getItemId, getTicketSummary,
      saveTicket, shareTicket, isSaving,
    }}>
      {children}
    </PredictionTicketContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePredictionTicket(): PredictionTicketContextType {
  const ctx = useContext(PredictionTicketContext);
  if (!ctx) throw new Error("usePredictionTicket must be used within PredictionTicketProvider");
  return ctx;
}
