export interface Partner {
  id: string;
  name: string;
  logo: string;
  logoDark?: string; // Optional dark variant for better visibility
  logoBackground?: string;
  link: string;
  promoCode: string;
  bonus?: string;
  bonusDetails?: string;
  signupSteps?: string[];
  benefits?: string[];
  requirements?: string[];
  faq?: { question: string; answer: string }[];
  rankingReason?: string;
  description: string;
  color: string;
}

// Official bookmaker logos from their official CDN/branding
// Using SVG logos where available for best quality

export const PARTNERS: Partner[] = [
  {
    id: "1xbet",
    name: "1XBET",
    logo: "/partners/official/1xbet.png",
    logoDark: "/partners/official/1xbet.png",
    logoBackground: "#ffffff",
    link: "https://1xbet.com/",
    promoCode: "PREDAT",
    bonus: "130.000 FCFA",
    bonusDetails: "Bonus de bienvenue jusqu'à 130.000 FCFA selon les conditions actives du bookmaker.",
    signupSteps: [
      "Cliquez sur « Obtenir le bonus » pour ouvrir le site officiel 1XBET.",
      "Créez votre compte 1XBET avec un numéro ou une adresse email valide.",
      "Saisissez le code promo PREDAT dans le champ dédié avant validation.",
      "Effectuez votre premier dépôt puis vérifiez les conditions de mise.",
    ],
    benefits: [
      "Large couverture football et sports internationaux.",
      "Cotes compétitives sur les grands championnats.",
      "Application mobile complète pour suivre les matchs en direct.",
    ],
    requirements: [
      "Compte réservé aux personnes majeures.",
      "Le code doit être renseigné avant la finalisation de l'inscription.",
      "Les conditions de retrait et de wagering peuvent varier selon le pays.",
    ],
    faq: [
      {
        question: "Comment utiliser le code promo 1XBET PREDAT ?",
        answer: "Ouvrez le site officiel 1XBET, inscrivez-vous, puis ajoutez PREDAT dans le champ code promo avant votre premier dépôt.",
      },
      {
        question: "Le bonus 1XBET est-il automatique ?",
        answer: "Il dépend des conditions en vigueur chez 1XBET et de la saisie correcte du code promo pendant l'inscription.",
      },
    ],
    rankingReason: "Idéal pour les parieurs qui veulent beaucoup de marchés football et une offre de bienvenue élevée.",
    description: "Le leader mondial des paris sportifs avec les meilleures cotes.",
    color: "#0056b3",
  },
  {
    id: "linebet",
    name: "LINEBET",
    logo: "/partners/official/linebet.svg",
    logoDark: "/partners/official/linebet.svg",
    logoBackground: "#015003",
    link: "https://linebet.com/",
    promoCode: "PREDAT",
    bonus: "130.000 FCFA",
    bonusDetails: "Offre de bienvenue jusqu'à 130.000 FCFA pour les nouveaux comptes éligibles.",
    signupSteps: [
      "Ouvrez le site officiel Linebet depuis le bouton.",
      "Lancez l'inscription et complétez vos informations personnelles.",
      "Ajoutez le code promo PREDAT au moment demandé.",
      "Déposez le montant souhaité et consultez le bonus activé dans votre profil.",
    ],
    benefits: [
      "Interface simple pour parier rapidement sur le football.",
      "Nombreux marchés live et pré-match.",
      "Promotions régulières pour les nouveaux utilisateurs.",
    ],
    requirements: [
      "Être majeur et respecter la réglementation locale.",
      "Valider le compte avec des informations exactes.",
      "Lire les conditions de bonus avant de miser.",
    ],
    faq: [
      {
        question: "Où entrer le code promo Linebet ?",
        answer: "Le code PREDAT se saisit pendant l'inscription ou dans le champ promotionnel indiqué par Linebet.",
      },
      {
        question: "Pourquoi passer par LiveFoot pour Linebet ?",
        answer: "LiveFoot vous indique le code à utiliser et les étapes à suivre sur le site officiel Linebet.",
      },
    ],
    rankingReason: "Bon choix pour un parcours d'inscription rapide et une offre de bienvenue claire.",
    description: "Une plateforme moderne avec une large gamme de marchés.",
    color: "#2d6a4f",
  },
  {
    id: "1win",
    name: "1WIN",
    logo: "/partners/official/1win.svg",
    logoDark: "/partners/official/1win.svg",
    logoBackground: "#ffffff",
    link: "https://1win.com/",
    promoCode: "BALLWIN",
    bonus: "500% de Bonus",
    bonusDetails: "Bonus jusqu'à 500% selon l'offre disponible au moment de l'inscription.",
    signupSteps: [
      "Cliquez sur le bouton bonus 1WIN.",
      "Créez un nouveau compte 1WIN.",
      "Entrez le code BALLWIN dans le champ promo.",
      "Finalisez le dépôt et vérifiez l'activation de l'offre.",
    ],
    benefits: [
      "Bonus de bienvenue très agressif.",
      "Parcours mobile pratique.",
      "Offres sport et casino disponibles selon votre zone.",
    ],
    requirements: [
      "Offre réservée aux nouveaux inscrits.",
      "Les pourcentages et plafonds peuvent évoluer.",
      "Consultez toujours les règles de retrait du bonus.",
    ],
    faq: [
      {
        question: "Le code BALLWIN donne quoi sur 1WIN ?",
        answer: "Il permet d'accéder à l'offre de bienvenue liée au partenaire, sous réserve des conditions actives chez 1WIN.",
      },
      {
        question: "Puis-je changer de code après inscription ?",
        answer: "En général non : le code promo doit être choisi correctement avant la validation du compte.",
      },
    ],
    rankingReason: "Recommandé si vous cherchez le bonus d'accueil le plus élevé.",
    description: "Bonus exceptionnel de bienvenue et casino en ligne.",
    color: "#0a0908",
  },
  {
    id: "1win-predat",
    name: "1WIN (PREDAT)",
    logo: "/partners/official/1win.svg",
    logoDark: "/partners/official/1win.svg",
    logoBackground: "#ffffff",
    link: "https://1win.com/",
    promoCode: "PREDAT",
    bonus: "Bonus spécial",
    bonusDetails: "Offre spéciale associée au code PREDAT pour les utilisateurs LiveFoot.",
    signupSteps: [
      "Accédez au site officiel 1WIN.",
      "Démarrez votre inscription.",
      "Utilisez le code PREDAT dans le champ promotion.",
      "Confirmez votre compte puis consultez la promotion disponible.",
    ],
    benefits: [
      "Code dédié à la communauté LiveFoot.",
      "Accès rapide aux offres du moment.",
      "Alternative au code BALLWIN selon la campagne active.",
    ],
    requirements: [
      "Créer un nouveau compte depuis le site officiel 1WIN.",
      "Ne pas oublier le code avant validation.",
      "Respecter les limites d'âge et règles locales.",
    ],
    faq: [
      {
        question: "Quelle différence entre PREDAT et BALLWIN ?",
        answer: "Les deux codes peuvent correspondre à des campagnes différentes. Choisissez celui indiqué pour l'offre que vous souhaitez activer.",
      },
      {
        question: "Le code PREDAT est-il réservé à LiveFoot ?",
        answer: "Oui, il sert à identifier la campagne partenaire LiveFoot/PREDAT.",
      },
    ],
    rankingReason: "Alternative utile pour les utilisateurs qui veulent utiliser le code PREDAT sur 1WIN.",
    description: "Inscrivez-vous avec le code PREDAT pour des offres exclusives.",
    color: "#0a0908",
  },
  {
    id: "betwinner",
    name: "BETWINNER",
    logo: "/partners/official/betwinner.png",
    logoDark: "/partners/official/betwinner.png",
    logoBackground: "#050505",
    link: "https://betwinner.com/",
    promoCode: "BALL10",
    bonus: "Bonus exclusif",
    bonusDetails: "Bonus exclusif pour les nouveaux comptes éligibles avec le code BALL10.",
    signupSteps: [
      "Cliquez sur « Obtenir le bonus ».",
      "Inscrivez-vous sur Betwinner avec vos informations exactes.",
      "Renseignez BALL10 comme code promotionnel.",
      "Déposez puis vérifiez les conditions du bonus dans votre compte.",
    ],
    benefits: [
      "Plateforme orientée paris sportifs et live betting.",
      "Cotes élevées sur de nombreux événements.",
      "Offres adaptées aux parieurs réguliers.",
    ],
    requirements: [
      "Compte nouveau et éligible uniquement.",
      "Vérification d'identité possible avant retrait.",
      "Les règles de bonus peuvent dépendre du pays.",
    ],
    faq: [
      {
        question: "Comment activer BALL10 sur Betwinner ?",
        answer: "Ouvrez le site officiel Betwinner, inscrivez-vous, puis saisissez BALL10 dans le champ code promo.",
      },
      {
        question: "Betwinner demande-t-il une vérification ?",
        answer: "Comme la plupart des bookmakers, une vérification peut être demandée avant certains retraits.",
      },
    ],
    rankingReason: "Intéressant pour les utilisateurs qui privilégient les cotes et le live betting.",
    description: "Cotes élevées et paiements rapides.",
    color: "#1b4332",
  },
  {
    id: "melbet",
    name: "MELBET",
    logo: "/partners/official/melbet.svg",
    logoDark: "/partners/official/melbet.svg",
    logoBackground: "#ffffff",
    link: "https://melbet.com/",
    promoCode: "PREDAT",
    bonus: "Bonus de dépôt",
    bonusDetails: "Bonus de dépôt activable avec le code PREDAT selon les conditions de Melbet.",
    signupSteps: [
      "Ouvrez le site officiel Melbet.",
      "Créez votre compte et sélectionnez votre devise.",
      "Ajoutez PREDAT comme code promo.",
      "Effectuez votre dépôt puis consultez les règles du bonus.",
    ],
    benefits: [
      "Bonne couverture football internationale.",
      "Offres de dépôt et promotions sportives.",
      "Interface adaptée aux parieurs expérimentés.",
    ],
    requirements: [
      "Utiliser le code avant la validation finale.",
      "Respecter les conditions de mise.",
      "Jouer uniquement si vous êtes majeur.",
    ],
    faq: [
      {
        question: "Le code PREDAT fonctionne-t-il sur Melbet ?",
        answer: "Il doit être saisi pendant l'inscription sur le site officiel Melbet pour être pris en compte.",
      },
      {
        question: "Quel est l'avantage principal de Melbet ?",
        answer: "Melbet propose une couverture football large et des offres de dépôt intéressantes selon les périodes.",
      },
    ],
    rankingReason: "Adapté aux parieurs qui veulent une alternative complète avec un code LiveFoot.",
    description: "Une expérience de pari complète pour les pros.",
    color: "#ffb703",
  }
];

export function getRandomPartner(): Partner {
  return PARTNERS[Math.floor(Math.random() * PARTNERS.length)];
}
