import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Ticket, Share2, Copy, ArrowLeft, AlertCircle,
  ShieldCheck, ShieldAlert, ShieldOff, ExternalLink, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { PredictionTicket } from "@/types/predictionTicket";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHeadEnhanced";

const SITE_URL = "https://www.livefoot.fun";

const riskConfig = {
  low:    { icon: ShieldCheck, color: "text-emerald-400", label: "Faible risque" },
  medium: { icon: ShieldAlert, color: "text-amber-400",   label: "Risque modéré" },
  high:   { icon: ShieldOff,   color: "text-red-400",     label: "Risque élevé" },
};

const PredictionTicketShare = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [ticket, setTicket] = useState<PredictionTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareId) { setError("Identifiant de ticket manquant."); setLoading(false); return; }
    supabase
      .from("prediction_tickets")
      .select("*")
      .eq("public_share_id", shareId)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err || !data) { setError("Ticket introuvable ou lien expiré."); }
        else setTicket(data as unknown as PredictionTicket);
        setLoading(false);
      });
  }, [shareId]);

  const shareUrl = `${window.location.origin}/ticket/${shareId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Lien copié !");
    } catch { toast.error("Impossible de copier le lien."); }
  };

  const handleShare = async () => {
    const summary = ticket?.items.length ?? 0;
    const text = `Mon ticket LiveFoot : ${summary} prédictions. Consulte-le ici : ${shareUrl}`;
    try {
      if (navigator.share) await navigator.share({ title: "Ticket LiveFoot", text, url: shareUrl });
      else await navigator.clipboard.writeText(shareUrl);
    } catch { /* cancelled */ }
  };

  const avgConfidence = ticket?.items.length
    ? Math.round(ticket.items.reduce((s, i) => s + (i.confidence ?? 50), 0) / ticket.items.length)
    : 0;

  const globalRisk: "low" | "medium" | "high" = (() => {
    if (!ticket?.items.length) return "low";
    const hi = ticket.items.filter(i => i.risk === "high").length;
    const me = ticket.items.filter(i => i.risk === "medium").length;
    return hi > ticket.items.length * 0.4 ? "high"
      : hi + me > ticket.items.length * 0.4 ? "medium"
      : "low";
  })();

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#06101e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-white/40">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Chargement du ticket…</p>
        </div>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-[#06101e] flex flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Ticket className="h-8 w-8 text-white/20" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white mb-2">Ticket introuvable</h1>
          <p className="text-white/40 text-sm max-w-sm">{error ?? "Ce ticket a peut-être été supprimé ou le lien est invalide."}</p>
        </div>
        <Link to="/" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
        </Link>
      </div>
    );
  }

  // ─── Ticket view ───────────────────────────────────────────────────────────
  const Risk = riskConfig[globalRisk];
  const RiskIcon = Risk.icon;

  return (
    <>
      <SEOHead
        title={`Ticket LiveFoot — ${ticket.items.length} prédictions | Confiance ${avgConfidence}%`}
        description={`Ticket de pronostics partagé sur LiveFoot. ${ticket.items.length} prédictions. Confiance moyenne : ${avgConfidence}%. Consulte et crée ton propre ticket sur ${SITE_URL}`}
        canonical={shareUrl}
      />
      <div className="min-h-screen bg-[#06101e]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#06101e]/90 backdrop-blur border-b border-white/6 px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-emerald-400 font-black">LiveFoot</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs font-bold hover:bg-white/10 transition-colors"
            >
              <Copy className="h-3 w-3" /> Copier
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-colors"
            >
              <Share2 className="h-3 w-3" /> Partager
            </button>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-8 space-y-5">
          {/* Ticket card header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-br from-[#0c1f38] to-[#080f1e] border border-white/8 overflow-hidden"
          >
            {/* Accent top */}
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-600" />

            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                  <Ticket className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h1 className="font-black text-white text-base">{ticket.title ?? "Ticket de prédictions"}</h1>
                  <p className="text-[10px] text-white/40">
                    Partagé le {new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="text-center rounded-xl bg-white/4 border border-white/8 py-3">
                  <p className="text-xl font-black text-white">{ticket.items.length}</p>
                  <p className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Sélections</p>
                </div>
                <div className="text-center rounded-xl bg-white/4 border border-white/8 py-3">
                  <p className={cn("text-xl font-black",
                    avgConfidence >= 70 ? "text-emerald-400" : avgConfidence >= 54 ? "text-amber-400" : "text-red-400")}>
                    {avgConfidence}%
                  </p>
                  <p className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Confiance</p>
                </div>
                <div className="text-center rounded-xl bg-white/4 border border-white/8 py-3">
                  <RiskIcon className={cn("h-5 w-5 mx-auto mb-1", Risk.color)} />
                  <p className="text-[9px] text-white/40 uppercase font-bold tracking-wider">{Risk.label}</p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {ticket.items.map((item, idx) => {
                  const risk = riskConfig[item.risk ?? "medium"];
                  const RIcon = risk.icon;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-xl bg-white/[0.03] border border-white/8 p-3"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-[10px] text-white/45 font-medium truncate">
                          {item.homeTeam} <span className="text-white/25">vs</span> {item.awayTeam}
                          {item.leagueName ? ` · ${item.leagueName}` : ""}
                        </p>
                        <div className={cn("flex items-center gap-1 text-[8px] font-bold shrink-0", risk.color)}>
                          <RIcon className="h-2.5 w-2.5" />
                          {risk.label}
                        </div>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[9px] text-white/35 uppercase font-black tracking-wider">{item.predictionLabel}</p>
                          <p className="text-sm font-black text-white">{String(item.predictionValue)}</p>
                        </div>
                        <span className={cn("text-sm font-black", risk.color)}>{item.confidence ?? 50}%</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/6 bg-white/[0.015]">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-3 w-3 text-white/25 shrink-0 mt-0.5" />
                <p className="text-[9px] text-white/25 leading-relaxed">
                  Ticket de prédictions à titre informatif. Aucun pari ni transaction n'est effectué sur LiveFoot.
                </p>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 p-5 text-center"
          >
            <p className="text-sm font-bold text-white mb-1">Crée ton propre ticket de prédictions !</p>
            <p className="text-xs text-white/40 mb-4">Accède aux matchs, analyse les prédictions IA et partage tes pronostics.</p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/daily-picks"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-black text-sm hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/25"
              >
                <Ticket className="h-4 w-4" /> Créer mon ticket
              </Link>
              <a
                href={SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors"
              >
                <ExternalLink className="h-3 w-3" /> LiveFoot.fun
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default PredictionTicketShare;
