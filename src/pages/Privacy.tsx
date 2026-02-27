import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Shield } from "lucide-react";

const sections = [
  {
    title: "1. Informations Collectées",
    content:
      "Nous collectons les informations que vous fournissez directement, comme lorsque vous créez un compte, définissez vos préférences ou nous contactez. Nous collectons également automatiquement certaines informations lorsque vous utilisez nos services, notamment votre adresse IP, le type de navigateur, les informations sur l'appareil et les habitudes d'utilisation via des cookies et technologies similaires.",
  },
  {
    title: "2. Utilisation de Vos Informations",
    content:
      "Nous utilisons les informations collectées pour fournir, maintenir et améliorer nos services, personnaliser votre expérience, vous envoyer des notifications sur les matchs et équipes que vous suivez, communiquer avec vous sur les mises à jour et promotions, et assurer la sécurité de notre plateforme.",
  },
  {
    title: "3. Partage d'Informations",
    content:
      "Nous ne vendons pas vos informations personnelles à des tiers. Nous pouvons partager vos informations avec des prestataires de services qui nous aident à exploiter notre plateforme, lorsque la loi l'exige, ou pour protéger nos droits et notre sécurité. Tout prestataire tiers est contractuellement obligé de maintenir la confidentialité de vos informations.",
  },
  {
    title: "4. Sécurité des Données",
    content:
      "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos informations personnelles contre l'accès non autorisé, l'altération, la divulgation ou la destruction. Cependant, aucune transmission sur Internet n'est totalement sécurisée et nous ne pouvons garantir une sécurité absolue.",
  },
  {
    title: "5. Cookies et Suivi",
    content:
      "Nous utilisons des cookies et des technologies de suivi similaires pour améliorer votre expérience de navigation, analyser le trafic du site et comprendre les habitudes d'utilisation. Vous pouvez contrôler les préférences de cookies via les paramètres de votre navigateur. La désactivation des cookies peut affecter certaines fonctionnalités de nos services.",
  },
  {
    title: "6. Vos Droits",
    content:
      "Vous avez le droit d'accéder, de corriger ou de supprimer vos informations personnelles. Vous pouvez également vous opposer ou restreindre certaines activités de traitement. Pour exercer ces droits, veuillez nous contacter via les informations fournies sur notre page Contact.",
  },
  {
    title: "7. Protection des Mineurs",
    content:
      "Nos services ne sont pas destinés aux enfants de moins de 13 ans. Nous ne collectons pas sciemment d'informations personnelles auprès d'enfants de moins de 13 ans. Si nous apprenons que nous avons collecté de telles informations, nous prendrons des mesures pour les supprimer rapidement.",
  },
  {
    title: "8. Modifications de cette Politique",
    content:
      "Nous pouvons mettre à jour cette Politique de Confidentialité de temps en temps. Nous vous informerons de tout changement important en publiant la politique mise à jour sur notre site web. Votre utilisation continue de nos services après toute modification constitue votre acceptation de la politique mise à jour.",
  },
];

const Privacy = () => {
  return (
    <Layout>
      <SEOHead
        title="Politique de Confidentialité - LiveFoot"
        description="Politique de Confidentialité LiveFoot - Découvrez comment nous collectons, utilisons et protégeons vos informations personnelles."
      />
      <div className="container py-8 sm:py-16 max-w-4xl">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/20">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground mb-4">Politique de Confidentialité</h1>
          <p className="text-sm text-muted-foreground">Dernière mise à jour : Janvier 2024</p>
        </div>

        <div className="rounded-2xl bg-card border border-border/50 p-6 sm:p-10 mb-8">
          <p className="text-muted-foreground leading-relaxed mb-6">
            Chez LiveFoot, nous prenons votre vie privée au sérieux. Cette Politique de Confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous visitez notre site web et utilisez nos services. Veuillez lire attentivement cette politique.
          </p>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="rounded-2xl bg-card border border-border/50 p-6">
              <h2 className="font-bold text-foreground mb-3">{section.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
