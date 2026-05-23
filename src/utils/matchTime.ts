export const DEFAULT_MATCH_TIMEZONE = "Africa/Douala";

export function getUserMatchTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_MATCH_TIMEZONE;
  } catch {
    return DEFAULT_MATCH_TIMEZONE;
  }
}

export function formatMatchTime(isoDate?: string | null, timezone = getUserMatchTimezone()): string {
  if (!isoDate) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(isoDate));
}

export function formatMatchDate(isoDate?: string | null, timezone = getUserMatchTimezone()): string {
  if (!isoDate) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(isoDate));
}

export function formatApiDate(date: Date, timezone = getUserMatchTimezone()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export function isStaleLiveUpdate(updatedAt?: string | null, maxAgeMs = 45_000): boolean {
  if (!updatedAt) return true;
  return Date.now() - new Date(updatedAt).getTime() > maxAgeMs;
}
