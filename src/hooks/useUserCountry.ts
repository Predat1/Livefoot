import { useQuery } from "@tanstack/react-query";

// Map country codes to their primary league IDs
const COUNTRY_LEAGUE_MAP: Record<string, string[]> = {
  // Big 5 European leagues
  GB: ["39", "40", "41", "42", "43"],  // PL, Championship, League One, League Two, FA Cup
  ES: ["140", "141"],         // La Liga, Segunda
  IT: ["135", "136"],         // Serie A, Serie B
  DE: ["78", "79"],           // Bundesliga, 2. Bundesliga
  FR: ["61", "62"],           // Ligue 1, Ligue 2
  // Western Europe
  NL: ["88", "89"],           // Eredivisie, Eerste Divisie
  PT: ["94", "95"],           // Primeira Liga, Liga Portugal 2
  BE: ["144"],                // Belgian Pro League
  CH: ["207"],                // Swiss Super League
  AT: ["218"],                // Austrian Bundesliga
  IE: ["357"],                // League of Ireland
  SC: ["179"],                // Scottish Premiership
  // Scandinavia
  SE: ["113"],                // Allsvenskan
  NO: ["103"],                // Eliteserien
  DK: ["119"],                // Superliga
  FI: ["244"],                // Veikkausliiga
  IS: ["352"],                // Úrvalsdeild
  // Eastern Europe
  PL: ["106"],                // Ekstraklasa
  CZ: ["345"],                // Czech First League
  HR: ["210"],                // HNL
  RS: ["286"],                // Serbian SuperLiga
  UA: ["333"],                // Ukrainian Premier League
  RO: ["283"],                // Liga I
  GR: ["197"],                // Super League Greece
  RU: ["235"],                // Russian Premier League
  HU: ["271"],                // NB I
  BG: ["172"],                // First Professional League
  SK: ["332"],                // Slovak Super Liga
  SI: ["373"],                // PrvaLiga
  BA: ["225"],                // Premier League BiH
  // Turkey
  TR: ["203", "204"],         // Super Lig, TFF First League
  CY: ["318"],                // First Division Cyprus
  // Americas
  BR: ["71", "72"],           // Brasileirão, Série B
  AR: ["128", "129"],         // Liga Profesional, Primera Nacional
  MX: ["262", "263"],         // Liga MX, Liga Expansion MX
  US: ["253", "254"],         // MLS, USL Championship
  CO: ["239"],                // Liga BetPlay
  CL: ["265"],                // Primera División Chile
  PE: ["281"],                // Liga 1
  UY: ["268"],                // Primera División Uruguay
  PY: ["270"],                // Primera División Paraguay
  EC: ["242"],                // Serie A Ecuador
  VE: ["299"],                // Primera División Venezuela
  CR: ["330"],                // Primera División Costa Rica
  // Asia
  JP: ["98", "99"],           // J1 League, J2 League
  KR: ["292"],                // K League 1
  CN: ["169"],                // Chinese Super League
  IN: ["323"],                // ISL
  SA: ["307"],                // Saudi Pro League
  AE: ["305"],                // UAE Pro League
  QA: ["302"],                // Qatar Stars League
  TH: ["296"],                // Thai League 1
  ID: ["274"],                // Liga 1 Indonesia
  MY: ["302"],                // Malaysian Super League
  VN: ["340"],                // V.League 1
  UZ: ["372"],                // Uzbek Super League
  // Africa
  EG: ["233"],                // Egyptian Premier League
  MA: ["200"],                // Botola Pro
  DZ: ["301"],                // Ligue 1 Algeria
  TN: ["202"],                // Ligue 1 Tunisia
  NG: ["332"],                // NPFL
  GH: ["333"],                // Ghana Premier League
  ZA: ["288"],                // DStv Premiership
  CM: ["409"],                // Elite One Cameroon
  SN: ["306"],                // Ligue 1 Senegal
  CI: ["350"],                // Ligue 1 Ivory Coast
  // Oceania
  AU: ["188", "189"],         // A-League Men, A-League Women
  NZ: ["401"],                // New Zealand National League
};

// Fallback: infer country from timezone
function inferCountryFromTimezone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzCountryMap: Record<string, string> = {
      "Europe/London": "GB", "Europe/Madrid": "ES", "Europe/Rome": "IT",
      "Europe/Berlin": "DE", "Europe/Paris": "FR", "Europe/Amsterdam": "NL",
      "Europe/Lisbon": "PT", "America/Sao_Paulo": "BR", "America/Mexico_City": "MX",
      "America/New_York": "US", "America/Chicago": "US", "America/Los_Angeles": "US",
      "America/Denver": "US", "Asia/Riyadh": "SA", "America/Argentina/Buenos_Aires": "AR",
      "Europe/Istanbul": "TR", "Europe/Brussels": "BE", "Europe/Stockholm": "SE",
      "Europe/Oslo": "NO", "Europe/Copenhagen": "DK", "Europe/Warsaw": "PL",
      "Europe/Vienna": "AT", "Europe/Zurich": "CH", "Europe/Athens": "GR",
      "Europe/Moscow": "RU", "Europe/Dublin": "IE", "Asia/Tokyo": "JP",
      "Asia/Seoul": "KR", "Australia/Sydney": "AU", "Asia/Shanghai": "CN",
      "Asia/Kolkata": "IN", "Africa/Cairo": "EG", "Africa/Casablanca": "MA",
      "Africa/Algiers": "DZ", "Africa/Tunis": "TN", "Africa/Lagos": "NG",
    };
    return tzCountryMap[tz] || null;
  } catch {
    return null;
  }
}

async function fetchUserCountry(): Promise<string | null> {
  try {
    const res = await fetch("https://ipapi.co/country/", { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error("ipapi failed");
    const code = (await res.text()).trim();
    if (code.length === 2) return code;
    throw new Error("invalid response");
  } catch {
    return inferCountryFromTimezone();
  }
}

export function useUserCountry() {
  return useQuery({
    queryKey: ["user-country"],
    queryFn: fetchUserCountry,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
}

export function getLeagueIdsForCountry(countryCode: string | null | undefined): Set<string> {
  if (!countryCode) return new Set();
  return new Set(COUNTRY_LEAGUE_MAP[countryCode] || []);
}
