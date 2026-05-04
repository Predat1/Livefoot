import React, { useState } from "react";
import { Partner } from "@/data/partnersData";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, Check, Gift } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PartnerCardProps {
  partner: Partner;
  variant?: "full" | "compact";
}

const PartnerCard: React.FC<PartnerCardProps> = ({ partner, variant = "full" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(partner.promoCode);
    setCopied(true);
    toast.success(`Code promo ${partner.promoCode} copié !`);
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all shadow-sm">
        <div className="h-10 w-10 flex-shrink-0 bg-white rounded-lg p-1.5 flex items-center justify-center">
          <img src={partner.logo} alt={partner.name} className="h-full w-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-foreground truncate">{partner.name}</p>
          <p className="text-[10px] text-primary font-bold">{partner.bonus || "Bonus Exclusif"}</p>
        </div>
        <Button 
          size="sm" 
          className="h-8 rounded-lg text-[10px] font-black uppercase px-3"
          onClick={() => window.open(partner.link, "_blank")}
        >
          PARIER
        </Button>
      </div>
    );
  }

  return (
    <div className="group relative rounded-2xl bg-card border border-border/50 overflow-hidden hover:border-primary/30 transition-all shadow-md hover:shadow-xl hover-lift">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="h-12 w-28 sm:h-14 sm:w-32 bg-white rounded-xl p-3 flex items-center justify-center shadow-inner">
            <img src={partner.logo} alt={partner.name} className="h-full w-full object-contain" />
          </div>
          {partner.bonus && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
              <Gift className="h-3 w-3" /> {partner.bonus}
            </div>
          )}
        </div>
        
        <h3 className="text-base font-black text-foreground mb-1">{partner.name}</h3>
        <p className="text-xs text-muted-foreground mb-6 line-clamp-2">{partner.description}</p>
        
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Code Promo</span>
              <span className="text-sm font-black text-foreground tracking-tighter">{partner.promoCode}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-lg transition-all",
                copied ? "text-emerald-500 bg-emerald-500/10" : "text-primary hover:bg-primary/10"
              )}
              onClick={handleCopy}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          
          <Button 
            className="w-full h-11 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-primary/20"
            onClick={() => window.open(partner.link, "_blank")}
          >
            S'inscrire & Parier <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PartnerCard;
