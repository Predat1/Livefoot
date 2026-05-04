import React from "react";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import PartnerCard from "@/components/PartnerCard";
import { PARTNERS } from "@/data/partnersData";
import { Trophy, Gift, Sparkles, ShieldCheck } from "lucide-react";

const Bonuses = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Bonus & Offres Bookmakers - LiveFoot.fun"
        description="Profitez des meilleurs bonus de bienvenue et codes promo exclusifs chez nos partenaires bookmakers (1xBet, Linebet, 1win). Jusqu'à 130.000 FCFA offerts !"
        keywords="bonus bookmaker, code promo 1xbet, code promo linebet, bonus inscription paris sportifs, 1win promo code"
      />
      
      <Header />
      
      <main className="px-4 sm:container py-8 sm:py-16">
        <header className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase tracking-widest mb-6">
            <Sparkles className="h-4 w-4" /> Offres Exclusives LiveFoot
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground mb-6 leading-tight">
            Boostez vos gains avec nos <span className="text-primary">Bonus Partenaires</span>
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground leading-relaxed">
            Nous avons négocié pour vous les meilleures offres du marché. Utilisez nos codes promo lors de votre inscription pour débloquer des bonus exclusifs.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {PARTNERS.map((partner, index) => (
            <div 
              key={partner.id} 
              className="animate-scale-in" 
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <PartnerCard partner={partner} />
            </div>
          ))}
        </div>

        <section className="mt-16 sm:mt-24 p-6 sm:p-12 rounded-3xl bg-gradient-to-br from-card to-muted/30 border border-border/50 text-center">
          <h2 className="text-2xl font-black text-foreground mb-12">Pourquoi parier avec nos partenaires ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            <div className="flex flex-col items-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Sécurité & Fiabilité</h3>
              <p className="text-xs text-muted-foreground">Nous sélectionnons uniquement des plateformes certifiées et sécurisées.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Trophy className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Cotes Boostées</h3>
              <p className="text-xs text-muted-foreground">Accédez aux meilleures cotes du marché sur tous les matchs de football.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Gift className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Bonus Cumulables</h3>
              <p className="text-xs text-muted-foreground">Utilisez nos codes promo pour cumuler les bonus de bienvenue et offres de dépôt.</p>
            </div>
          </div>
        </section>

        <footer className="mt-16 text-center text-[10px] text-muted-foreground max-w-2xl mx-auto">
          <p>
            Les jeux d'argent comportent des risques : endettement, isolement, dépendance. Pour être aidé, appelez le 09 74 75 13 13 (appel non surtaxé). Interdit aux moins de 18 ans.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Bonuses;
