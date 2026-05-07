import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { FileText, Shield, Scale } from "lucide-react";

const Terms = () => {
  return (
    <Layout>
      <SEOHead title="Conditions Générales d'Utilisation — LiveFoot" description="Consultez les conditions générales d'utilisation de la plateforme LiveFoot." />
      <div className="container py-12 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <Scale className="h-6 w-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground uppercase tracking-tight">Conditions Générales</h1>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
          <section className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> 1. Acceptation des conditions
            </h2>
            <p>
              En accédant et en utilisant la plateforme LiveFoot, vous acceptez d'être lié par les présentes Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
            </p>
          </section>

          <section className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> 2. Services de Prédiction IA
            </h2>
            <p>
              LiveFoot fournit des analyses de football basées sur l'intelligence artificielle. Ces prédictions sont fournies à titre informatif uniquement. Nous ne garantissons pas l'exactitude des résultats et ne pouvons être tenus responsables des pertes financières liées à des paris sportifs.
            </p>
          </section>

          <section className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" /> 3. Abonnements VIP
            </h2>
            <p>
              Les abonnements VIP sont facturés de manière périodique selon l'offre choisie (hebdomadaire, mensuelle, trimestrielle, annuelle). L'accès aux fonctionnalités Premium est activé immédiatement après confirmation du paiement.
            </p>
          </section>

          <section className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" /> 4. Responsabilité
            </h2>
            <p>
              L'utilisateur est seul responsable de ses décisions. Le jeu comporte des risques : endettement, isolement, dépendance. Pour être aidé, appelez le 09 74 75 13 13 (appel non surtaxé).
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

const Crown = (props: any) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);

export default Terms;
