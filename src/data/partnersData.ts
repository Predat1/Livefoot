export interface Partner {
  id: string;
  name: string;
  logo: string;
  logoDark?: string; // Optional dark variant for better visibility
  link: string;
  promoCode: string;
  bonus?: string;
  description: string;
  color: string;
}

// Official bookmaker logos from their official CDN/branding
// Using SVG logos where available for best quality

export const PARTNERS: Partner[] = [
  {
    id: "1xbet",
    name: "1XBET",
    logo: "https://cdn.1xbet.com/partnership/promo-materials/1xbet-logo-white.svg",
    logoDark: "https://cdn.1xbet.com/partnership/promo-materials/1xbet-logo.svg",
    link: "https://reffpa.com/L?tag=d_633509m_18975c_&site=633509&ad=18975",
    promoCode: "PREDAT",
    bonus: "130.000 FCFA",
    description: "Le leader mondial des paris sportifs avec les meilleures cotes.",
    color: "#0056b3",
  },
  {
    id: "linebet",
    name: "LINEBET",
    logo: "https://linebet.com/img/logo-white.svg",
    logoDark: "https://linebet.com/img/logo.svg",
    link: "https://lb-aff.com/L?tag=d_1972375m_66803c_apk1&site=1972375&ad=66803",
    promoCode: "PREDAT",
    bonus: "130.000 FCFA",
    description: "Une plateforme moderne avec une large gamme de marchés.",
    color: "#2d6a4f",
  },
  {
    id: "1win",
    name: "1WIN",
    logo: "https://1win.com/img/logo-white.svg",
    logoDark: "https://1win.com/img/logo.svg",
    link: "https://1wwnpz.com/betting?p=iezl&sharebet=PREDAT",
    promoCode: "BALLWIN",
    bonus: "500% de Bonus",
    description: "Bonus exceptionnel de bienvenue et casino en ligne.",
    color: "#0a0908",
  },
  {
    id: "1win-predat",
    name: "1WIN (PREDAT)",
    logo: "https://1win.com/img/logo-white.svg",
    logoDark: "https://1win.com/img/logo.svg",
    link: "https://1wwnpz.com/betting?p=iezl&sharebet=PREDAT",
    promoCode: "PREDAT",
    bonus: "Bonus spécial",
    description: "Inscrivez-vous avec le code PREDAT pour des offres exclusives.",
    color: "#0a0908",
  },
  {
    id: "betwinner",
    name: "BETWINNER",
    logo: "https://betwinner.com/img/logo-white.svg",
    logoDark: "https://betwinner.com/img/logo.svg",
    link: "https://1wwnpz.com/betting?p=iezl&sharebet=PREDAT",
    promoCode: "BALL10",
    bonus: "Bonus exclusif",
    description: "Cotes élevées et paiements rapides.",
    color: "#1b4332",
  },
  {
    id: "melbet",
    name: "MELBET",
    logo: "https://melbet.com/img/logo-white.svg",
    logoDark: "https://melbet.com/img/logo.svg",
    link: "https://refpa3665.com/L?tag=d_2730287m_45415c_&site=2730287&ad=45415",
    promoCode: "PREDAT",
    bonus: "Bonus de dépôt",
    description: "Une expérience de pari complète pour les pros.",
    color: "#ffb703",
  }
];

export function getRandomPartner(): Partner {
  return PARTNERS[Math.floor(Math.random() * PARTNERS.length)];
}
