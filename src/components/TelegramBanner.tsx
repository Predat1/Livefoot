import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface TelegramBannerProps {
  variant?: "inline" | "compact" | "card";
  dismissible?: boolean;
}

const TELEGRAM_URL = "https://t.me/ballwinpronos";

export default function TelegramBanner({ variant = "inline", dismissible = true }: TelegramBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  if (variant === "compact") {
    return (
      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/20 hover:bg-[#229ED9]/20 transition-all group"
      >
        <svg className="h-4 w-4 text-[#229ED9] shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.942z"/>
        </svg>
        <span className="text-[11px] font-bold text-[#229ED9]">Rejoindre la communauté</span>
        <span className="ml-auto text-[9px] text-[#229ED9]/50 group-hover:text-[#229ED9]/80 transition-colors">→</span>
      </a>
    );
  }

  if (variant === "card") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl border border-[#229ED9]/25 bg-gradient-to-r from-[#229ED9]/10 to-[#0a0d14] overflow-hidden"
      >
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 text-white/20 hover:text-white/50 transition-colors z-10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Telegram icon */}
          <div className="h-12 w-12 rounded-2xl bg-[#229ED9]/15 border border-[#229ED9]/30 flex items-center justify-center shrink-0">
            <svg className="h-6 w-6 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.942z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-white mb-0.5">
              📣 Rejoins notre communauté Telegram
            </p>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Signaux exclusifs avant publication, alertes live, analyses VIP partagées par la communauté — <span className="text-[#229ED9] font-bold">+2000 parieurs actifs</span>
            </p>
          </div>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#229ED9] text-white text-xs font-black hover:bg-[#1a8fc7] transition-colors shadow-lg shadow-[#229ED9]/20"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.942z"/>
            </svg>
            Rejoindre
          </a>
        </div>
      </motion.div>
    );
  }

  // Default: inline banner (dismissible strip)
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex items-center gap-3 px-4 py-3 rounded-2xl border border-[#229ED9]/20 bg-gradient-to-r from-[#229ED9]/8 to-[#0a0d14] overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#229ED9]/5 to-transparent pointer-events-none" />
      <div className="h-8 w-8 rounded-xl bg-[#229ED9]/15 border border-[#229ED9]/25 flex items-center justify-center shrink-0">
        <svg className="h-4 w-4 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.942z"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-white">
          🔥 +2000 parieurs sur notre Telegram — Signaux exclusifs, alertes live
        </p>
        <p className="text-[10px] text-white/40">Analyses VIP partagées avant tout le monde</p>
      </div>
      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 px-3 py-1.5 rounded-xl bg-[#229ED9] text-white text-[11px] font-black hover:bg-[#1a8fc7] transition-colors"
      >
        Rejoindre
      </a>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-white/20 hover:text-white/50 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
}
