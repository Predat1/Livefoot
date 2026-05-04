import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PARTNERS } from "@/data/partnersData";

interface PartnerBannerProps {
  partnerId?: string;
  className?: string;
}

const PartnerBanner: React.FC<PartnerBannerProps> = ({ partnerId = "1xbet", className }) => {
  const partner = PARTNERS.find(p => p.id === partnerId) || PARTNERS[0];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`my-8 sm:my-10 animate-fade-in ${className}`}
    >
      <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-900/20 to-primary/10 border border-primary/20 overflow-hidden shadow-lg shadow-primary/5 group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-5 sm:p-8 gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 text-center md:text-left">
            <div className="h-14 w-32 bg-white rounded-xl p-3 flex items-center justify-center shadow-inner transform group-hover:scale-105 transition-transform">
              <img src={partner.logo} alt={partner.name} className="h-full w-full object-contain" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-foreground mb-1 italic">
                Jusqu'à <span className="text-primary">{partner.bonus || "130.000 FCFA"}</span> de Bonus !
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-black tracking-widest">
                Utilisez le code promo : <span className="text-primary px-1.5 py-0.5 bg-primary/10 rounded">{partner.promoCode}</span>
              </p>
            </div>
          </div>
          <Button asChild className="rounded-xl px-8 py-6 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/30 transform hover:scale-105 transition-transform h-12 w-full md:w-auto">
            <a href={partner.link} target="_blank" rel="noopener noreferrer">
              Profiter de l'Offre
            </a>
          </Button>
        </div>
      </div>
    </motion.section>
  );
};

export default PartnerBanner;
