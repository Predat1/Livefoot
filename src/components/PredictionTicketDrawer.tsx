import { motion, AnimatePresence } from "framer-motion";
import {
  X, Trash2, Save, Share2, Copy, Download, ExternalLink,
  Ticket, MessageCircle, Twitter, Facebook, AlertCircle, Loader2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePredictionTicket } from "@/contexts/PredictionTicketContext";
import PredictionTicketItemCard from "./PredictionTicketItemCard";
import PredictionTicketSummary from "./PredictionTicketSummary";
import { downloadPredictionTicketImage } from "@/lib/predictionTicketShareImage";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const SITE_URL = "https://www.livefoot.fun";

const PredictionTicketDrawer = () => {
  const { user } = useAuth();
  const {
    ticket, count, isOpen, setOpen,
    removeItem, clearTicket, saveTicket, shareTicket,
    getTicketSummary, isSaving,
  } = usePredictionTicket();
  const [isDownloading, setIsDownloading] = useState(false);

  const summary = getTicketSummary();

  const handleSave = async () => {
    if (!user) { toast.error("Connectez-vous pour sauvegarder votre ticket."); return; }
    await saveTicket();
  };

  const handleShare = async () => {
    await shareTicket();
  };

  const handleCopyLink = async () => {
    if (!ticket.publicShareId) { await saveTicket(); }
    const url = `${window.location.origin}/ticket/${ticket.publicShareId || ""}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié !");
    } catch { toast.error("Impossible de copier le lien."); }
  };

  const handleDownloadImage = async () => {
    setIsDownloading(true);
    try {
      await downloadPredictionTicketImage(ticket);
      toast.success("Image téléchargée !");
    } catch { toast.error("Erreur lors de la génération de l'image."); }
    finally { setIsDownloading(false); }
  };

  const handleSocialShare = (network: "whatsapp" | "telegram" | "twitter" | "facebook") => {
    const shareUrl = ticket.publicShareId ? `${window.location.origin}/ticket/${ticket.publicShareId}` : SITE_URL;
    const text = `Mon ticket LiveFoot : ${summary.count} prédiction${summary.count > 1 ? "s" : ""}, confiance ${summary.avgConfidence}%. Consulte-le ici : ${shareUrl}`;
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`,
      twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    };
    window.open(urls[network], "_blank", "noopener,noreferrer,width=640,height=480");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Drawer — right panel on desktop, bottom sheet on mobile */}
          <motion.aside
            key="drawer"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className={cn(
              "fixed right-0 top-0 bottom-0 z-50",
              "w-full max-w-[420px] flex flex-col",
              "bg-[#0a1628] border-l border-white/8 shadow-2xl shadow-black/60",
            )}
          >
            {/* ─── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                  <Ticket className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">Mon Ticket</h2>
                  <p className="text-[10px] text-white/40">{count} sélection{count > 1 ? "s" : ""}</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ─── Body ────────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {count === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center h-full py-20 text-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                    <Ticket className="h-8 w-8 text-white/20" />
                  </div>
                  <div>
                    <p className="font-bold text-white/60 mb-1">Ticket vide</p>
                    <p className="text-sm text-white/30 max-w-[220px]">
                      Depuis la carte de prédictions d'un match, cliquez sur <strong className="text-white/50">Ajouter au ticket</strong>.
                    </p>
                  </div>
                  <Link
                    to="/daily-picks"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Voir les picks du jour
                  </Link>
                </div>
              ) : (
                <>
                  {/* Summary stats */}
                  <PredictionTicketSummary summary={summary} />

                  {/* Item list */}
                  <div className="space-y-2">
                    {ticket.items.map(item => (
                      <PredictionTicketItemCard key={item.id} item={item} onRemove={removeItem} />
                    ))}
                  </div>

                  {/* Share buttons */}
                  {ticket.publicShareId && (
                    <div className="pt-2">
                      <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest mb-2">Partager sur</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSocialShare("whatsapp")}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-[10px] font-bold hover:bg-[#25D366]/20 transition-colors"
                        >
                          <MessageCircle className="h-3 w-3" /> WhatsApp
                        </button>
                        <button
                          onClick={() => handleSocialShare("telegram")}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#229ED9]/10 border border-[#229ED9]/20 text-[#229ED9] text-[10px] font-bold hover:bg-[#229ED9]/20 transition-colors"
                        >
                          <MessageCircle className="h-3 w-3" /> Telegram
                        </button>
                        <button
                          onClick={() => handleSocialShare("twitter")}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-[10px] font-bold hover:bg-white/10 transition-colors"
                        >
                          <Twitter className="h-3 w-3" /> X
                        </button>
                        <button
                          onClick={() => handleSocialShare("facebook")}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#1877F2]/10 border border-[#1877F2]/20 text-[#1877F2] text-[10px] font-bold hover:bg-[#1877F2]/20 transition-colors"
                        >
                          <Facebook className="h-3 w-3" /> FB
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ─── Footer actions ───────────────────────────────────────────── */}
            {count > 0 && (
              <div className="shrink-0 border-t border-white/8 px-4 py-4 space-y-2">
                {/* Action row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 disabled:opacity-50 transition-all"
                  >
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Sauvegarder
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/15 border border-primary/25 text-primary text-xs font-bold hover:bg-primary/25 disabled:opacity-50 transition-all"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Partager
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 border border-white/8 text-white/60 text-xs font-bold hover:bg-white/10 transition-all"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copier lien
                  </button>
                  <button
                    onClick={handleDownloadImage}
                    disabled={isDownloading}
                    className="flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 border border-white/8 text-white/60 text-xs font-bold hover:bg-white/10 disabled:opacity-50 transition-all"
                  >
                    {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    Image PNG
                  </button>
                </div>

                <button
                  onClick={clearTicket}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400/70 text-xs font-bold hover:bg-red-500/15 hover:text-red-400 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Vider le ticket
                </button>

                {/* Disclaimer */}
                <div className="flex items-start gap-2 rounded-lg bg-white/3 border border-white/5 p-2.5">
                  <AlertCircle className="h-3 w-3 text-white/30 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-white/25 leading-relaxed">
                    Ticket de prédictions à titre informatif. Aucun pari ni transaction n'est effectué sur LiveFoot.
                    {ticket.publicShareId && (
                      <Link
                        to={`/ticket/${ticket.publicShareId}`}
                        target="_blank"
                        onClick={() => setOpen(false)}
                        className="ml-1 text-emerald-400/60 hover:text-emerald-400 underline"
                      >
                        Voir ticket partagé →
                      </Link>
                    )}
                  </p>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default PredictionTicketDrawer;
