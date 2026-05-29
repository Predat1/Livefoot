const REGION_COUNTRY_NAMES: Record<string, string> = {
  AR: "Argentina",
  BE: "Belgium",
  BR: "Brazil",
  CM: "Cameroon",
  DE: "Germany",
  DZ: "Algeria",
  EG: "Egypt",
  ES: "Spain",
  FR: "France",
  GB: "England",
  IT: "Italy",
  MA: "Morocco",
  MX: "Mexico",
  NG: "Nigeria",
  NL: "Netherlands",
  PT: "Portugal",
  SA: "Saudi-Arabia",
  SN: "Senegal",
  TR: "Turkey",
  US: "USA",
};

const TIMEZONE_COUNTRY_NAMES: Record<string, string> = {
  "Africa/Algiers": "Algeria",
  "Africa/Cairo": "Egypt",
  "Africa/Casablanca": "Morocco",
  "Africa/Dakar": "Senegal",
  "Africa/Douala": "Cameroon",
  "Africa/Lagos": "Nigeria",
  "America/Argentina/Buenos_Aires": "Argentina",
  "America/Mexico_City": "Mexico",
  "America/New_York": "USA",
  "America/Sao_Paulo": "Brazil",
  "Asia/Riyadh": "Saudi-Arabia",
  "Europe/Amsterdam": "Netherlands",
  "Europe/Berlin": "Germany",
  "Europe/Brussels": "Belgium",
  "Europe/Istanbul": "Turkey",
  "Europe/Lisbon": "Portugal",
  "Europe/London": "England",
  "Europe/Madrid": "Spain",
  "Europe/Paris": "France",
  "Europe/Rome": "Italy",
};

function getNavigatorLanguages(): string[] {
  if (typeof navigator === "undefined") return [];
  return Array.from(new Set([...(navigator.languages || []), navigator.language].filter(Boolean)));
}

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

function getCountryFromLocale(locale: string): string | null {
  const region = locale.split("-")[1]?.toUpperCase();
  return region ? REGION_COUNTRY_NAMES[region] || null : null;
}

export function getUserCountryCandidates(): string[] {
  const countries = new Set<string>();

  const timezoneCountry = TIMEZONE_COUNTRY_NAMES[getTimezone()];
  if (timezoneCountry) countries.add(timezoneCountry);

  for (const language of getNavigatorLanguages()) {
    const country = getCountryFromLocale(language);
    if (country) countries.add(country);
  }

  return Array.from(countries);
}
