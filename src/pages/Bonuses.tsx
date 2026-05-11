import Header from "@/components/Header";
import SEOHead from "@/components/SEOHeadEnhanced";
import PartnerCard from "@/components/PartnerCard";
import { PARTNERS } from "@/data/partnersData";
import { CheckCircle2, ClipboardCheck, Gift, HelpCircle, ShieldCheck, Sparkles, Star, Trophy, WalletCards } from "lucide-react";

const Bonuses = () => {
  const faq = PARTNERS.flatMap((partner) => partner.faq || []).slice(0, 12);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Codes Promo Bookmakers 2026 : 1XBET, Linebet, 1WIN, Betwinner, Melbet | LiveFoot.fun"
        description="Comparez les meilleurs codes promo bookmakers LiveFoot : étapes d'inscription, avantages, conditions à vérifier et bonus de bienvenue 1XBET, Linebet, 1WIN, Betwinner et Melbet."
        keywords="code promo bookmaker, code promo 1xbet, code promo linebet, code promo 1win, code promo betwinner, code promo melbet, bonus paris sportifs, bonus inscription bookmaker"
        faq={faq}
      />
      
      <Header />
      
      <main className="px-4 sm:container py-8 sm:py-16">
        <header className="max-w-4xl mx-auto text-center mb-12 sm:mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase tracking-widest mb-6">
            <Sparkles className="h-4 w-4" /> Codes promo vérifiés pour la communauté LiveFoot
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground mb-6 leading-tight">
            Codes promo bookmakers : <span className="text-primary">inscription, bonus et avantages</span>
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Retrouvez les codes promo LiveFoot/PREDAT, les étapes pour créer votre compte sans erreur, les bénéfices de chaque offre et les conditions importantes à vérifier avant de déposer.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
            {[
              { icon: Gift, label: "Bonus jusqu'à 130.000 FCFA" },
              { icon: ClipboardCheck, label: "Étapes d'inscription claires" },
              { icon: ShieldCheck, label: "Rappels sécurité & +18" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-card border border-border/50 p-4 flex items-center justify-center gap-2">
                <item.icon className="h-4 w-4 text-primary" />
                <span className="text-xs font-black text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </header>

        <section className="mb-12 rounded-3xl bg-card border border-border/50 overflow-hidden shadow-xl">
          <div className="p-5 sm:p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">Comparatif rapide des codes promo</h2>
              <p className="text-xs text-muted-foreground mt-1">Choisissez l'offre qui correspond à votre profil puis suivez les étapes détaillées plus bas.</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">Mise à jour LiveFoot</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-black">Bookmaker</th>
                  <th className="px-4 py-3 text-left font-black">Code promo</th>
                  <th className="px-4 py-3 text-left font-black">Bonus</th>
                  <th className="px-4 py-3 text-left font-black">Idéal pour</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {PARTNERS.map((partner) => (
                  <tr key={partner.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-20 rounded-lg border border-border/50 p-1.5 flex items-center justify-center"
                          style={{ backgroundColor: partner.logoBackground || "#ffffff" }}
                        >
                          <img src={partner.logo} alt={partner.name} className="h-full w-full object-contain" />
                        </div>
                        <span className="font-black text-foreground">{partner.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-lg bg-primary/10 px-3 py-1 text-primary font-black tracking-widest">{partner.promoCode}</span>
                    </td>
                    <td className="px-4 py-4 font-bold text-foreground">{partner.bonus || "Bonus partenaire"}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground max-w-xs">{partner.rankingReason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {PARTNERS.map((partner, index) => (
            <div 
              key={partner.id} 
              className="animate-scale-in" 
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <PartnerCard partner={partner} source="bonuses_page" />
            </div>
          ))}
        </div>

        <section className="mt-16 sm:mt-24 space-y-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-3">Comment utiliser chaque code promo ?</h2>
            <p className="text-sm text-muted-foreground">Suivez ces étapes avant de valider votre inscription pour éviter de perdre le bonus.</p>
          </div>
          {PARTNERS.map((partner, index) => (
            <article
              key={partner.id}
              id={partner.id}
              className="rounded-3xl bg-card border border-border/50 overflow-hidden shadow-lg"
            >
              <div className="p-5 sm:p-7 border-b border-border/50 flex flex-col lg:flex-row lg:items-center gap-5">
                <div
                  className="h-16 w-36 rounded-2xl border border-border/50 p-3 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: partner.logoBackground || "#ffffff" }}
                >
                  <img src={partner.logo} alt={partner.name} className="h-full w-full object-contain" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center">{index + 1}</span>
                    <h3 className="text-xl sm:text-2xl font-black text-foreground">Code promo {partner.name} : {partner.promoCode}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{partner.bonusDetails || partner.description}</p>
                </div>
                <div className="rounded-2xl bg-primary/10 border border-primary/20 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-primary font-black">Code à saisir</p>
                  <p className="text-2xl font-black text-primary">{partner.promoCode}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-5 sm:p-7">
                <div>
                  <h4 className="font-black text-foreground mb-4 flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-primary" /> Inscription étape par étape
                  </h4>
                  <ol className="space-y-3">
                    {(partner.signupSteps || []).map((step, stepIndex) => (
                      <li key={step} className="flex gap-3 text-sm text-muted-foreground">
                        <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center shrink-0">{stepIndex + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h4 className="font-black text-foreground mb-4 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" /> Avantages
                  </h4>
                  <ul className="space-y-3">
                    {(partner.benefits || []).map((benefit) => (
                      <li key={benefit} className="flex gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-black text-foreground mb-4 flex items-center gap-2">
                    <WalletCards className="h-4 w-4 text-primary" /> Conditions à vérifier
                  </h4>
                  <ul className="space-y-3">
                    {(partner.requirements || []).map((requirement) => (
                      <li key={requirement} className="flex gap-2 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-16 sm:mt-24 p-6 sm:p-12 rounded-3xl bg-gradient-to-br from-card to-muted/30 border border-border/50 text-center">
          <h2 className="text-2xl font-black text-foreground mb-12">Pourquoi passer par LiveFoot ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            <div className="flex flex-col items-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Sécurité & Fiabilité</h3>
              <p className="text-xs text-muted-foreground">Nous centralisons les liens partenaires et rappelons les conditions importantes avant inscription.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Trophy className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Comparaison rapide</h3>
              <p className="text-xs text-muted-foreground">Vous voyez en un coup d'œil le code, le bonus et l'intérêt de chaque bookmaker.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Gift className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Parcours sans erreur</h3>
              <p className="text-xs text-muted-foreground">Les étapes expliquent où saisir le code pour ne pas manquer l'activation du bonus.</p>
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-card border border-border/50 p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">FAQ codes promo bookmakers</h2>
              <p className="text-xs text-muted-foreground">Réponses rapides avant de créer votre compte.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faq.map((item) => (
              <div key={item.question} className="rounded-2xl bg-muted/20 border border-border/40 p-5">
                <h3 className="font-black text-sm text-foreground mb-2">{item.question}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.answer}</p>
              </div>
            ))}
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
