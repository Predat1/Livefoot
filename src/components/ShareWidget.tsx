import { Share2, MessageCircle, Twitter, Facebook, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { generateMatchShareImage, MatchShareImageData } from "@/lib/matchShareImage";

interface ShareWidgetProps {
  title: string;
  text: string;
  url: string;
  variant?: "icon" | "button" | "minimal";
  className?: string;
  matchShareData?: Omit<MatchShareImageData, "matchUrl">;
}

const ShareWidget = ({ title, text, url, variant = "button", className, matchShareData }: ShareWidgetProps) => {
  const [isCopying, setIsCopying] = useState(false);
  const [isSharingImage, setIsSharingImage] = useState(false);
  const fullUrl = url.startsWith("http") ? url : `https://www.livefoot.fun${url}`;

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

  const handleShareImage = async () => {
    if (!matchShareData) return;

    setIsSharingImage(true);
    try {
      const file = await generateMatchShareImage({
        ...matchShareData,
        matchUrl: fullUrl,
      });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title,
          text,
          url: fullUrl,
          files: [file],
        });
      } else {
        const objectUrl = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(objectUrl);
        copyToClipboard();
        toast.success("Image du match téléchargée", {
          description: "Le lien LiveFoot a aussi été copié.",
        });
      }
    } catch {
      copyToClipboard();
      toast.error("Image indisponible", {
        description: "Le lien du match a été copié à la place.",
      });
    } finally {
      setIsSharingImage(false);
    }
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
        onClick={matchShareData ? handleShareImage : handleNativeShare}
        disabled={isSharingImage}
        className={cn("h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-all", className)}
      >
        <Share2 className={cn("h-4 w-4", isSharingImage && "animate-pulse")} />
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
          className="rounded-lg border-border bg-card hover:bg-muted/60"
        >
          {isCopying ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      {matchShareData && (
        <Button
          variant="outline"
          onClick={handleShareImage}
          disabled={isSharingImage}
          className="rounded-xl border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary font-black gap-2"
        >
          <Share2 className={cn("h-4 w-4", isSharingImage && "animate-pulse")} />
          {isSharingImage ? "Génération de l'image..." : "Partager avec image"}
        </Button>
      )}
      
      <div className="flex items-center justify-between gap-2">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-bold text-white transition-transform active:scale-95",
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
