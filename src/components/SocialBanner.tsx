import { useState } from "react";
import { motion } from "framer-motion";
import { X, ExternalLink } from "lucide-react";

export type SocialPlatform = "telegram" | "whatsapp" | "tiktok" | "facebook" | "youtube";

interface SocialBannerProps {
  platform: SocialPlatform;
  variant?: "inline" | "compact" | "card";
  dismissible?: boolean;
  className?: string;
}

const SOCIAL_CONFIGS = {
  telegram: {
    url: "https://t.me/ballwinpronos",
    borderClass: "border-[#229ED9]/25",
    textClass: "text-[#229ED9]",
    btnClass: "bg-[#229ED9] text-white hover:bg-[#1a8fc7]",
    badge: "Telegram",
    title: "Canal pronostics",
    subtitle: "Alertes value bets et selections avant match.",
    actionText: "Rejoindre",
    icon: (className: string) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.942z" />
      </svg>
    ),
  },
  whatsapp: {
    url: "https://whatsapp.com/channel/0029Vb7t7Lw1yT2720uLA10q",
    borderClass: "border-[#25D366]/25",
    textClass: "text-[#25D366]",
    btnClass: "bg-[#25D366] text-black hover:bg-[#20ba56]",
    badge: "WhatsApp",
    title: "Alertes buts & pronostics",
    subtitle: "Scores importants, pronostics et infos utiles en direct.",
    actionText: "Rejoindre",
    icon: (className: string) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.023-5.116-2.887-6.98-1.864-1.865-4.343-2.889-6.983-2.89-5.442 0-9.866 4.42-9.87 9.867-.001 1.767.487 3.49 1.414 4.993l-.998 3.64 3.733-.977zm11.308-7.712c-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.297.298-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.568-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z" />
      </svg>
    ),
  },
  tiktok: {
    url: "https://www.tiktok.com/@livefootia?_r=1&_t=ZS-96VnMCC0kfl",
    borderClass: "border-[#FE2C55]/25",
    textClass: "text-[#FE2C55]",
    btnClass: "bg-[#FE2C55] text-white hover:bg-[#e6264c]",
    badge: "TikTok",
    title: "Moments forts",
    subtitle: "Formats courts, tendances et actions marquantes.",
    actionText: "S'abonner",
    icon: (className: string) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.525.02c1.31-.03 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.99-1.72-.08-.07-.15-.15-.22-.23v6.47c-.04 2.01-.64 4.09-2.09 5.51-1.57 1.6-3.94 2.25-6.13 1.95-2.2-.28-4.22-1.61-5.18-3.64-1.09-2.2-.82-4.99.71-6.93 1.48-1.92 4.01-2.73 6.38-2.22v4.18c-1.23-.42-2.65-.12-3.56.84-.96.98-1.12 2.6-.42 3.82.68 1.25 2.14 1.98 3.56 1.78 1.34-.14 2.53-1.2 2.72-2.54.08-.47.06-.95.06-1.42V.02h-.79z" />
      </svg>
    ),
  },
  facebook: {
    url: "https://www.facebook.com/profile.php?id=61590057483465",
    borderClass: "border-[#1877F2]/25",
    textClass: "text-[#1877F2]",
    btnClass: "bg-[#1877F2] text-white hover:bg-[#1569d6]",
    badge: "Facebook",
    title: "Communaute foot",
    subtitle: "Actu, reactions aux scores et discussions entre fans.",
    actionText: "Suivre",
    icon: (className: string) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  youtube: {
    url: "https://youtube.com/@livefootia?si=Xx7bgrcOkvziAkYZ",
    borderClass: "border-[#FF0000]/25",
    textClass: "text-[#FF0000]",
    btnClass: "bg-[#FF0000] text-white hover:bg-[#cc0000]",
    badge: "YouTube",
    title: "Analyses video",
    subtitle: "Debriefs, tendances et lectures de match.",
    actionText: "S'abonner",
    icon: (className: string) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
};

export default function SocialBanner({
  platform,
  variant = "inline",
  dismissible = false,
  className = "",
}: SocialBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const config = SOCIAL_CONFIGS[platform];

  if (dismissed || !config) return null;

  if (variant === "compact") {
    return (
      <a
        href={config.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`group flex items-center gap-2.5 rounded-lg border border-border/80 bg-card px-3 py-2 transition-colors hover:border-slate-700 hover:bg-slate-900/40 ${className}`}
        id={`social-compact-${platform}`}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-950">
          {config.icon(`h-4 w-4 ${config.textClass}`)}
        </span>
        <span className="text-[11px] font-bold text-slate-300 transition-colors group-hover:text-white">
          {config.badge}
        </span>
        <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </a>
    );
  }

  if (variant === "card") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`group relative h-full overflow-hidden rounded-lg border ${config.borderClass} bg-card transition-colors hover:border-slate-600/70 hover:bg-slate-900/40 ${className}`}
        id={`social-card-${platform}`}
      >
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-3 top-3 z-10 text-white/30 transition-colors hover:text-white/70"
            id={`dismiss-card-${platform}`}
            aria-label="Masquer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="flex h-full items-center gap-3 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-slate-950/60">
            {config.icon(`h-5 w-5 ${config.textClass}`)}
          </div>
          <div className="min-w-0 flex-1">
            <span className={`mb-1 inline-flex rounded border border-slate-800 bg-slate-950 px-1.5 py-0.5 text-[9px] font-bold uppercase ${config.textClass}`}>
              {config.badge}
            </span>
            <p className="mb-0.5 text-sm font-bold leading-tight text-white">
              {config.title}
            </p>
            <p className="line-clamp-2 text-[11px] leading-snug text-white/50">
              {config.subtitle}
            </p>
          </div>
          <a
            href={config.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-[11px] font-bold transition-transform active:scale-95 sm:flex ${config.btnClass}`}
          >
            {config.actionText}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative flex items-center gap-3 overflow-hidden rounded-lg border ${config.borderClass} bg-card px-4 py-3 ${className}`}
      id={`social-inline-${platform}`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-slate-950/60">
        {config.icon(`h-4.5 w-4.5 ${config.textClass}`)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-white">
          <span>{config.title}</span>
          <span className={`rounded border border-slate-800 bg-slate-950 px-1.5 py-0.5 text-[8.5px] font-bold uppercase ${config.textClass}`}>
            {config.badge}
          </span>
        </p>
        <p className="truncate text-[10px] text-white/45">{config.subtitle}</p>
      </div>
      <a
        href={config.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex shrink-0 items-center gap-1 rounded-md px-3.5 py-1.5 text-[11px] font-bold transition-transform active:scale-95 ${config.btnClass}`}
      >
        <span>{config.actionText}</span>
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="ml-1 shrink-0 text-white/30 transition-colors hover:text-white/70"
          id={`dismiss-inline-${platform}`}
          aria-label="Masquer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
}
