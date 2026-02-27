import { useQuery } from "@tanstack/react-query";

// Map country codes to their primary league IDs
const COUNTRY_LEAGUE_MAP: Record<string, string[]> = {
  GB: ["39", "40"],   // Premier League, Championship
  ES: ["140"],         // La Liga
  IT: ["135"],         // Serie A
  DE: ["78"],          // Bundesliga
  FR: ["61"],          // Ligue 1
  NL: ["88"],          // Eredivisie
  PT: ["94"],          // Primeira Liga
  BR: ["71"],          // Brasileirão
  MX: ["262"],         // Liga MX
  US: ["253"],         // MLS
  SA: ["307"],         // Saudi Pro League
  AR: ["128"],         // Superliga Argentina
  TR: ["203"],         // Turkish Super Lig
  BE: ["144"],         // Belgian Pro League
  SC: ["179"],         // Scottish Premiership (fallback for Scotland)
  // Extended coverage
  JP: ["98"],
  KR: ["292"],
  AU: ["188"],
  CO: ["239"],
  CL: ["265"],
  PE: ["281"],
  UY: ["268"],
  PY: ["270"],
  EC: ["242"],
  CN: ["169"],
  IN: ["323"],
  EG: ["233"],
  MA: ["200"],
  DZ: ["301"],
  TN: ["202"],
  NG: ["332"],
  GH: ["333"],
  SE: ["113"],
  NO: ["103"],
  DK: ["119"],
  PL: ["106"],
  CZ: ["345"],
  AT: ["218"],
  CH: ["207"],
  HR: ["210"],
  RS: ["286"],
  UA: ["333"],
  RO: ["283"],
  GR: ["197"],
  RU: ["235"],
  IE: ["357"],
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
