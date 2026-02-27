import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Trophy, Users, Globe, Zap, Heart, Shield } from "lucide-react";
import { useAppLogo } from "@/hooks/useAppLogo";

const About = () => {
  const logoUrl = useAppLogo();
  const values = [
    { icon: Zap, title: "Temps Réel", description: "Scores en direct et événements de match livrés instantanément au fur et à mesure qu'ils se produisent sur le terrain." },
    { icon: Globe, title: "Couverture Mondiale", description: "De la Premier League à la Serie A, nous couvrons toutes les grandes ligues et tournois à travers le monde." },
    { icon: Shield, title: "Données Fiables", description: "Des données précises et vérifiées provenant de sources de confiance pour ne jamais manquer un moment." },
    { icon: Heart, title: "Les Fans d'Abord", description: "Conçu par des fans de football, pour des fans de football. Votre passion guide tout ce que nous faisons." },
  ];

  return (
    <Layout>
      <SEOHead
        title="À Propos - LiveFoot"
        description="Découvrez LiveFoot - votre destination ultime pour les scores de football en direct, résultats, calendriers, classements, statistiques et actualités."
      />
      <div className="container py-8 sm:py-16 max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-16 w-16 rounded-2xl overflow-hidden shadow-lg shadow-primary/30">
              <img src={logoUrl} alt="LiveFoot" className="h-full w-full object-cover" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground mb-4">À Propos de LiveFoot</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Votre destination ultime pour les scores de football en direct, résultats, calendriers, classements, statistiques et actualités du monde entier.
          </p>
        </div>

        <div className="rounded-2xl bg-card border border-border/50 p-6 sm:p-10 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-6 w-6 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Notre Mission</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Chez LiveFoot, nous croyons que chaque fan de football mérite un accès instantané à des données de match précises et complètes. Notre mission est de fournir la plateforme la plus fiable et la plus conviviale pour suivre le football en direct à travers toutes les grandes ligues et compétitions. Que vous suiviez la progression de votre équipe favorite ou que vous gardiez un œil sur les rumeurs de transferts, LiveFoot est là pour vous.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {values.map((value) => (
            <div key={value.title} className="rounded-2xl bg-card border border-border/50 p-6">
              <value.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold text-foreground mb-2">{value.title}</h3>
              <p className="text-sm text-muted-foreground">{value.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl gradient-primary p-6 sm:p-10 text-primary-foreground">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">LiveFoot en Chiffres</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { value: "50+", label: "Ligues Couvertes" },
              { value: "1000+", label: "Équipes Suivies" },
              { value: "10K+", label: "Matchs/Saison" },
              { value: "24/7", label: "Couverture Live" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-black">{stat.value}</p>
                <p className="text-xs sm:text-sm opacity-80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
