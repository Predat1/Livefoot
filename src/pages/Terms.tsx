import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { FileText } from "lucide-react";

const sections = [
  {
    title: "1. Acceptation des Conditions",
    content:
      "En accédant ou en utilisant le site web et les services de LiveFoot, vous acceptez d'être lié par ces Conditions d'Utilisation. Si vous n'acceptez pas une partie de ces conditions, vous ne pouvez pas utiliser nos services. Nous nous réservons le droit de modifier ces conditions à tout moment.",
  },
  {
    title: "2. Utilisation des Services",
    content:
      "LiveFoot fournit des scores de football en direct, des statistiques, des actualités et du contenu associé. Vous acceptez d'utiliser nos services uniquement à des fins légales et conformément à ces Conditions. Vous ne devez pas utiliser nos services d'une manière qui pourrait endommager, désactiver ou altérer nos serveurs ou réseaux.",
  },
  {
    title: "3. Responsabilités du Compte",
    content:
      "Si vous créez un compte, vous êtes responsable de la confidentialité de vos identifiants de connexion et de toutes les activités sous votre compte. Vous devez nous notifier immédiatement de toute utilisation non autorisée. Nous nous réservons le droit de suspendre ou de résilier les comptes qui violent ces conditions.",
  },
  {
    title: "4. Propriété Intellectuelle",
    content:
      "Tout le contenu sur LiveFoot, y compris les textes, graphiques, logos, images et logiciels, est la propriété de LiveFoot ou de ses concédants et est protégé par les lois sur la propriété intellectuelle. Vous ne pouvez pas reproduire, distribuer ou créer des œuvres dérivées sans notre permission écrite expresse.",
  },
  {
    title: "5. Exactitude du Contenu",
    content:
      "Bien que nous nous efforcions de fournir des informations précises et à jour, LiveFoot ne garantit pas l'exactitude, l'exhaustivité ou la fiabilité de tout contenu. Les scores de matchs, statistiques et actualités sont fournis à titre informatif uniquement et ne doivent pas être utilisés pour des décisions financières ou de paris.",
  },
  {
    title: "6. Liens Vers des Tiers",
    content:
      "Nos services peuvent contenir des liens vers des sites web tiers. Nous ne sommes pas responsables du contenu, des politiques de confidentialité ou des pratiques de ces sites tiers. L'accès à ces liens se fait à vos propres risques.",
  },
  {
    title: "7. Limitation de Responsabilité",
    content:
      "Dans toute la mesure permise par la loi, LiveFoot ne sera pas responsable des dommages indirects, accessoires, spéciaux, consécutifs ou punitifs résultant de votre utilisation de nos services. Notre responsabilité totale ne dépassera pas le montant que vous nous avez payé au cours des douze mois précédents.",
  },
  {
    title: "8. Droit Applicable",
    content:
      "Ces Conditions sont régies et interprétées conformément au droit français. Tout litige découlant de ces conditions sera soumis à la compétence exclusive des tribunaux français.",
  },
];

const Terms = () => {
  return (
    <Layout>
      <SEOHead
        title="Conditions d'Utilisation - LiveFoot"
        description="Conditions d'Utilisation de LiveFoot - Lisez les termes et conditions régissant votre utilisation de LiveFoot."
      />
      <div className="container py-8 sm:py-16 max-w-4xl">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/20">
              <FileText className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground mb-4">Conditions d'Utilisation</h1>
          <p className="text-sm text-muted-foreground">Dernière mise à jour : Janvier 2024</p>
        </div>

        <div className="rounded-2xl bg-card border border-border/50 p-6 sm:p-10 mb-8">
          <p className="text-muted-foreground leading-relaxed">
            Bienvenue sur LiveFoot. Ces Conditions d'Utilisation régissent votre accès et votre utilisation de notre site web, applications et services. En utilisant LiveFoot, vous acceptez de respecter et d'être lié par ces conditions.
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

export default Terms;
