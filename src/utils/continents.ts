export type Continent = "all" | "europe" | "africa" | "americas" | "asia" | "oceania";

export const CONTINENTS: { value: Continent; label: string; icon: string }[] = [
  { value: "all", label: "Tous", icon: "🌍" },
  { value: "europe", label: "Europe", icon: "🇪🇺" },
  { value: "africa", label: "Afrique", icon: "🌍" },
  { value: "americas", label: "Amérique", icon: "🌎" },
  { value: "asia", label: "Asie", icon: "🌏" },
  { value: "oceania", label: "Océanie", icon: "🏝️" },
];

const COUNTRY_CONTINENT: Record<string, Continent> = {
  // Europe
  England: "europe", Spain: "europe", Italy: "europe", Germany: "europe", France: "europe",
  Portugal: "europe", Netherlands: "europe", Belgium: "europe", Turkey: "europe", Scotland: "europe",
  Austria: "europe", Switzerland: "europe", Greece: "europe", Denmark: "europe", Sweden: "europe",
  Norway: "europe", Finland: "europe", Poland: "europe", "Czech-Republic": "europe", Czechia: "europe",
  Croatia: "europe", Serbia: "europe", Romania: "europe", Ukraine: "europe", Russia: "europe",
  Hungary: "europe", Bulgaria: "europe", Slovakia: "europe", Slovenia: "europe", Ireland: "europe",
  Wales: "europe", "Northern-Ireland": "europe", Iceland: "europe", Cyprus: "europe", Malta: "europe",
  Luxembourg: "europe", Albania: "europe", "Bosnia-and-Herzegovina": "europe", Montenegro: "europe",
  "North-Macedonia": "europe", Kosovo: "europe", Estonia: "europe", Latvia: "europe", Lithuania: "europe",
  Georgia: "europe", Armenia: "europe", Azerbaijan: "europe", Moldova: "europe", Belarus: "europe",
  "Faroe-Islands": "europe", Gibraltar: "europe", Andorra: "europe", "San-Marino": "europe",
  Liechtenstein: "europe", Monaco: "europe",

  // Africa
  Morocco: "africa", Egypt: "africa", Tunisia: "africa", Algeria: "africa", Nigeria: "africa",
  "South-Africa": "africa", Ghana: "africa", Senegal: "africa", Cameroon: "africa",
  "Ivory-Coast": "africa", "Côte d'Ivoire": "africa", Mali: "africa", "Burkina-Faso": "africa",
  "DR-Congo": "africa", Congo: "africa", Kenya: "africa", Tanzania: "africa", Uganda: "africa",
  Ethiopia: "africa", Sudan: "africa", Libya: "africa", Zambia: "africa", Zimbabwe: "africa",
  Mozambique: "africa", Angola: "africa", Namibia: "africa", Botswana: "africa", Rwanda: "africa",
  Guinea: "africa", Benin: "africa", Togo: "africa", Niger: "africa", Gabon: "africa",
  Mauritania: "africa", Madagascar: "africa", Mauritius: "africa", "Cape-Verde": "africa",
  "Sierra-Leone": "africa", Liberia: "africa", Gambia: "africa", "Equatorial-Guinea": "africa",
  Malawi: "africa", Burundi: "africa", Djibouti: "africa", Somalia: "africa", Eritrea: "africa",
  Comoros: "africa", "São-Tomé-and-Príncipe": "africa", Seychelles: "africa", Lesotho: "africa",
  Eswatini: "africa", "Central-African-Republic": "africa", Chad: "africa",

  // Americas
  Brazil: "americas", Argentina: "americas", Colombia: "americas", Chile: "americas",
  Mexico: "americas", USA: "americas", Canada: "americas", Uruguay: "americas", Paraguay: "americas",
  Peru: "americas", Ecuador: "americas", Bolivia: "americas", Venezuela: "americas",
  "Costa-Rica": "americas", Panama: "americas", Honduras: "americas", "El-Salvador": "americas",
  Guatemala: "americas", Jamaica: "americas", "Trinidad-and-Tobago": "americas", Haiti: "americas",
  "Dominican-Republic": "americas", Cuba: "americas", Nicaragua: "americas", Bermuda: "americas",
  Suriname: "americas", Guyana: "americas", Belize: "americas", Barbados: "americas",
  Curaçao: "americas",

  // Asia
  Japan: "asia", "South-Korea": "asia", China: "asia", "Saudi-Arabia": "asia",
  "United-Arab-Emirates": "asia", Qatar: "asia", Iran: "asia", Iraq: "asia", Bahrain: "asia",
  Oman: "asia", Kuwait: "asia", Jordan: "asia", Lebanon: "asia", Syria: "asia", Palestine: "asia",
  Israel: "asia", India: "asia", Thailand: "asia", Vietnam: "asia", Indonesia: "asia",
  Malaysia: "asia", Singapore: "asia", Philippines: "asia", Myanmar: "asia", Cambodia: "asia",
  Uzbekistan: "asia", Kazakhstan: "asia", Tajikistan: "asia", Kyrgyzstan: "asia",
  Turkmenistan: "asia", Bangladesh: "asia", "Sri-Lanka": "asia", Nepal: "asia",
  "Hong-Kong": "asia", Taiwan: "asia", Macao: "asia", Mongolia: "asia", Laos: "asia",
  Yemen: "asia",

  // Oceania
  Australia: "oceania", "New-Zealand": "oceania", Fiji: "oceania", "Papua-New-Guinea": "oceania",
  Samoa: "oceania", Tonga: "oceania", Vanuatu: "oceania", "New-Caledonia": "oceania",
  Tahiti: "oceania", "Solomon-Islands": "oceania",
};

/**
 * Returns the continent for a given country name.
 * Tries exact match, then normalized (spaces → hyphens), defaults to "europe".
 */
export function getContinent(country: string): Continent {
  if (!country) return "europe";
  // "World" / "International" → show in all
  if (country === "World" || country === "International") return "all";
  const direct = COUNTRY_CONTINENT[country];
  if (direct) return direct;
  const normalized = country.replace(/\s+/g, "-");
  return COUNTRY_CONTINENT[normalized] || "europe";
}
