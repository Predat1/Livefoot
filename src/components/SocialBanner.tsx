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
    color: "#229ED9",
    bgClass: "from-[#229ED9]/10 to-[#0a0d14]",
    borderClass: "border-[#229ED9]/20",
    textClass: "text-[#229ED9]",
    btnClass: "bg-[#229ED9] hover:bg-[#1a8fc7] text-white",
    badge: "🔥 +2000 parieurs",
    title: "Rejoins notre canal Telegram VIP",
    subtitle: "Signaux exclusifs en direct, alertes de value bets et pronostics de dernière minute par notre communauté.",
    actionText: "Rejoindre Telegram",
    icon: (className: string) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.942z"/>
      </svg>
    )
  },
  whatsapp: {
    url: "https://whatsapp.com/channel/0029Vb7t7Lw1yT2720uLA10q",
    color: "#25D366",
    bgClass: "from-[#25D366]/10 to-[#0a0d14]",
    borderClass: "border-[#25D366]/20",
    textClass: "text-[#25D366]",
    btnClass: "bg-[#25D366] hover:bg-[#20ba56] text-black font-black",
    badge: "🟢 Canal Officiel",
    title: "Alerte Pronostics & Buts sur WhatsApp",
    subtitle: "Ne ratez aucun pronostic IA ! Recevez les analyses directement sur votre téléphone avec alertes instantanées.",
    actionText: "Rejoindre la Chaîne",
    icon: (className: string) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.023-5.116-2.887-6.98-1.864-1.865-4.343-2.889-6.983-2.89-5.442 0-9.866 4.42-9.87 9.867-.001 1.767.487 3.49 1.414 4.993l-.998 3.64 3.733-.977zm11.308-7.712c-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.297.298-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.568-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
      </svg>
    )
  },
  tiktok: {
    url: "https://www.tiktok.com/@livefootia?_r=1&_t=ZS-96VnMCC0kfl",
    color: "#FE2C55",
    bgClass: "from-[#FE2C55]/10 to-[#0a0d14]",
    borderClass: "border-[#FE2C55]/20",
    textClass: "text-[#FE2C55]",
    btnClass: "bg-gradient-to-r from-[#00f2fe] via-[#FE2C55] to-[#FE2C55] hover:opacity-90 text-white font-black",
    badge: "🎬 Vidéos IA & Buts",
    title: "Suivez-nous sur TikTok",
    subtitle: "Décryptages de matchs, prédictions d'IA en direct, et les moments forts en format court sur notre compte TikTok !",
    actionText: "S'abonner",
    icon: (className: string) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.03 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.99-1.72-.08-.07-.15-.15-.22-.23v6.47c-.04 2.01-.64 4.09-2.09 5.51-1.57 1.6-3.94 2.25-6.13 1.95-2.2-.28-4.22-1.61-5.18-3.64-1.09-2.2-.82-4.99.71-6.93 1.48-1.92 4.01-2.73 6.38-2.22v4.18c-1.23-.42-2.65-.12-3.56.84-.96.98-1.12 2.6-.42 3.82.68 1.25 2.14 1.98 3.56 1.78 1.34-.14 2.53-1.2 2.72-2.54.08-.47.06-.95.06-1.42V.02h-.79z"/>
      </svg>
    )
  },
  facebook: {
    url: "https://www.facebook.com/profile.php?id=61590057483465",
    color: "#1877F2",
    bgClass: "from-[#1877F2]/10 to-[#0a0d14]",
    borderClass: "border-[#1877F2]/20",
    textClass: "text-[#1877F2]",
    btnClass: "bg-[#1877F2] hover:bg-[#1569d6] text-white",
    badge: "👥 Communauté Foot",
    title: "Rejoins notre page Facebook",
    subtitle: "Abonnez-vous à notre page Facebook pour débattre de l'actualité foot, réagir aux scores et partager vos pronos.",
    actionText: "Aimer la Page",
    icon: (className: string) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    )
  },
  youtube: {
    url: "https://youtube.com/@livefootia?si=Xx7bgrcOkvziAkYZ",
    color: "#FF0000",
    bgClass: "from-[#FF0000]/10 to-[#0a0d14]",
    borderClass: "border-[#FF0000]/20",
    textClass: "text-[#FF0000]",
    btnClass: "bg-[#FF0000] hover:bg-[#cc0000] text-white",
    badge: "📺 Vidéos & Analyses",
    title: "Abonne-toi sur YouTube",
    subtitle: "Retrouvez des analyses vidéos détaillées de notre IA, des tutoriels de stratégies de paris et des revues de matchs.",
    actionText: "S'abonner",
    icon: (className: string) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  }
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
        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl bg-card border border-border/80 hover:border-slate-700 hover:bg-slate-900/40 transition-all group ${className}`}
        id={`social-compact-${platform}`}
      >
        <div className={`p-1.5 rounded-lg bg-slate-950 flex items-center justify-center shrink-0`}>
          {config.icon(`h-4 w-4 ${config.textClass}`)}
        </div>
        <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors">
          Rejoindre sur {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </span>
        <span className="ml-auto text-[9px] text-muted-foreground group-hover:translate-x-0.5 transition-transform">
          <ExternalLink className="h-3 w-3" />
        </span>
      </a>
    );
  }

  if (variant === "card") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative rounded-2xl border ${config.borderClass} bg-gradient-to-r ${config.bgClass} overflow-hidden ${className}`}
        id={`social-card-${platform}`}
      >
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 text-white/20 hover:text-white/50 transition-colors z-10"
            id={`dismiss-card-${platform}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-slate-950/60 border border-border flex items-center justify-center shrink-0 shadow-inner">
            {config.icon(`h-6 w-6 ${config.textClass}`)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-950 border border-slate-800 ${config.textClass}`}>
                {config.badge}
              </span>
            </div>
            <p className="text-sm font-black text-white mb-0.5">
              {config.title}
            </p>
            <p className="text-[11px] text-white/50 leading-relaxed max-w-xl">
              {config.subtitle}
            </p>
          </div>
          <a
            href={config.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 ${config.btnClass}`}
          >
            {config.actionText}
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
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
      className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl border ${config.borderClass} bg-gradient-to-r ${config.bgClass} overflow-hidden group ${className}`}
      id={`social-inline-${platform}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />
      <div className="h-9 w-9 rounded-xl bg-slate-950/60 border border-border flex items-center justify-center shrink-0 shadow-inner">
        {config.icon(`h-4.5 w-4.5 ${config.textClass}`)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-white flex items-center gap-1.5 flex-wrap">
          <span>{config.title}</span>
          <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 bg-slate-950 border border-slate-800 rounded ${config.textClass}`}>
            {config.badge}
          </span>
        </p>
        <p className="text-[10px] text-white/40 truncate">{config.subtitle}</p>
      </div>
      <a
        href={config.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`shrink-0 px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-1 active:scale-95 ${config.btnClass}`}
      >
        <span>Rejoindre</span>
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-white/20 hover:text-white/50 transition-colors ml-1"
          id={`dismiss-inline-${platform}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
}
