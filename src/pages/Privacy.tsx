import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Shield, Eye, Lock, Database } from "lucide-react";

const Privacy = () => {
  return (
    <Layout>
      <SEOHead title="Politique de Confidentialité — LiveFoot" description="Consultez notre politique de confidentialité pour savoir comment nous traitons vos données." />
      <div className="container py-12 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/20 border border-emerald-500/20">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground uppercase tracking-tight">Confidentialité</h1>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
          <section className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" /> 1. Collecte des données
            </h2>
            <p>
              Nous collectons les informations nécessaires au bon fonctionnement de votre compte : email, nom d'affichage, et préférences d'équipes favorites. Pour les paiements, nous utilisons Chariow qui gère vos données de transaction de manière sécurisée.
            </p>
          </section>

          <section className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> 2. Utilisation des données
            </h2>
            <p>
              Vos données sont utilisées pour personnaliser votre expérience, vous envoyer des alertes de matchs (si activées) et gérer votre accès VIP. Nous ne vendons JAMAIS vos données personnelles à des tiers.
            </p>
          </section>

          <section className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" /> 3. Sécurité
            </h2>
            <p>
              Nous utilisons des protocoles de sécurité avancés (chiffrement SSL, authentification Supabase) pour protéger vos informations contre tout accès non autorisé.
            </p>
          </section>

          <section className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" /> 4. Vos droits
            </h2>
            <p>
              Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Vous pouvez exercer ces droits directement depuis votre profil ou en nous contactant.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
