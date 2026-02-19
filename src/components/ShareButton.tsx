import { useState } from "react";
import { Share2, Copy, Check, Twitter, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
  variant?: "icon" | "pill";
}

const ShareButton = ({ title, text, url, className, variant = "pill" }: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareText = text || title;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
      } catch {
        // user cancelled
      }
      return;
    }
    // Fallback: show menu
    setOpen((o) => !o);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => { setCopied(false); setOpen(false); }, 2000);
  };

  const shareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setOpen(false);
  };

  const shareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className={cn(
          "flex items-center gap-1.5 transition-colors",
          variant === "pill"
            ? "rounded-full bg-muted/50 hover:bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            : "rounded-full p-2 bg-white/20 hover:bg-white/30 text-white",
          className
        )}
        aria-label="Partager"
      >
        <Share2 className={cn(variant === "pill" ? "h-3.5 w-3.5" : "h-4 w-4")} />
        {variant === "pill" && <span>Partager</span>}
      </button>

      {/* Fallback dropdown (when Web Share API not available) */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-xl bg-card border border-border shadow-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground">Partager sur</p>
            </div>
            <button
              onClick={shareTwitter}
              className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
            >
              <Twitter className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">𝕏 Twitter</span>
            </button>
            <button
              onClick={shareWhatsApp}
              className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
            >
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">WhatsApp</span>
            </button>
            <button
              onClick={copyLink}
              className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left border-t border-border"
            >
              {copied ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground">
                {copied ? "Lien copié !" : "Copier le lien"}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShareButton;
