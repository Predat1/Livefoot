import { Share2, MessageCircle, Twitter, Facebook, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ShareWidgetProps {
  title: string;
  text: string;
  url: string;
  variant?: "icon" | "button" | "minimal";
  className?: string;
}

const ShareWidget = ({ title, text, url, variant = "button", className }: ShareWidgetProps) => {
  const [isCopying, setIsCopying] = useState(false);
  const fullUrl = url.startsWith("http") ? url : `https://livefoot.fun${url}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: fullUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    setIsCopying(true);
    navigator.clipboard.writeText(fullUrl);
    toast.success("Lien copié !", {
      description: "Vous pouvez maintenant le partager avec vos amis."
    });
    setTimeout(() => setIsCopying(false), 2000);
  };

  const shareLinks = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-[#25D366]",
      href: `https://wa.me/?text=${encodeURIComponent(text + " " + fullUrl)}`,
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "bg-[#1DA1F2]",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(fullUrl)}`,
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-[#1877F2]",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    }
  ];

  if (variant === "minimal") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNativeShare}
        className={cn("h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-all", className)}
      >
        <Share2 className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleNativeShare}
          className="flex-1 rounded-xl gradient-primary font-black gap-2 shadow-lg shadow-primary/20"
        >
          <Share2 className="h-4 w-4" />
          PARTAGER
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={copyToClipboard}
          className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10"
        >
          {isCopying ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="flex items-center justify-between gap-2">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold text-white transition-transform active:scale-95",
              link.color
            )}
          >
            <link.icon className="h-3.5 w-3.5" />
            {link.name}
          </a>
        ))}
      </div>
    </div>
  );
};

export default ShareWidget;
