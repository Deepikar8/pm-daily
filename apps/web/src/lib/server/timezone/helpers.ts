import { formatInTimeZone } from "date-fns-tz";

export function normalizeTimezone(timezone: string | null | undefined): string {
  const candidate = timezone?.trim() || "UTC";
  try {
    Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return "UTC";
  }
}

export function isValidTimezone(timezone: string | null | undefined): boolean {
  return normalizeTimezone(timezone) === timezone?.trim();
}

export function localDate(timezone: string, instant: Date = new Date()): string {
  return formatInTimeZone(instant, normalizeTimezone(timezone), "yyyy-MM-dd");
}

export function isoWeekKey(timezone: string, instant: Date = new Date()): string {
  return formatInTimeZone(instant, normalizeTimezone(timezone), "RRRR-'W'II");
}

export function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  const da = Date.UTC(y1, m1 - 1, d1);
  const db = Date.UTC(y2, m2 - 1, d2);
  return Math.round((db - da) / 86_400_000);
}
