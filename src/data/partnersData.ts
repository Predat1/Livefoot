export interface Partner {
  id: string;
  name: string;
  logo: string;
  link: string;
  promoCode: string;
  bonus?: string;
  description: string;
  color: string;
}

export const PARTNERS: Partner[] = [
  {
    id: "1xbet",
    name: "1XBET",
    logo: "https://v3.api-sports.io/football/bookmakers/logos/1.png",
    link: "https://reffpa.com/L?tag=d_633509m_18975c_&site=633509&ad=18975",
    promoCode: "PREDAT",
    bonus: "130.000 FCFA",
    description: "Le leader mondial des paris sportifs avec les meilleures cotes.",
    color: "#0056b3",
  },
  {
    id: "linebet",
    name: "LINEBET",
    logo: "https://v3.api-sports.io/football/bookmakers/logos/7.png",
    link: "https://lb-aff.com/L?tag=d_1972375m_66803c_apk1&site=1972375&ad=66803",
    promoCode: "PREDAT",
    bonus: "130.000 FCFA",
    description: "Une plateforme moderne avec une large gamme de marchés.",
    color: "#2d6a4f",
  },
  {
    id: "1win",
    name: "1WIN",
    logo: "https://v3.api-sports.io/football/bookmakers/logos/6.png",
    link: "https://1wwnpz.com/betting?p=iezl&sharebet=PREDAT",
    promoCode: "BALLWIN",
    bonus: "500% de Bonus",
    description: "Bonus exceptionnel de bienvenue et casino en ligne.",
    color: "#0a0908",
  },
  {
    id: "1win-predat",
    name: "1WIN (PREDAT)",
    logo: "https://v3.api-sports.io/football/bookmakers/logos/6.png",
    link: "https://1wwnpz.com/betting?p=iezl&sharebet=PREDAT",
    promoCode: "PREDAT",
    bonus: "Bonus spécial",
    description: "Inscrivez-vous avec le code PREDAT pour des offres exclusives.",
    color: "#0a0908",
  },
  {
    id: "betwinner",
    name: "BETWINNER",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Betwinner_logo.svg/1024px-Betwinner_logo.svg.png",
    link: "https://1wwnpz.com/betting?p=iezl&sharebet=PREDAT",
    promoCode: "BALL10",
    bonus: "Bonus exclusif",
    description: "Cotes élevées et paiements rapides.",
    color: "#1b4332",
  },
  {
    id: "melbet",
    name: "MELBET",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Melbet_logo.svg/1024px-Melbet_logo.svg.png",
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
