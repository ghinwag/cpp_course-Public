// Pure date and cycle maths. No imports, so it can be unit-tested with plain Node.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local calendar date as 'YYYY-MM-DD'. Everything in Pebl is keyed by the phone's local day. */
export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Whole days from a to b ('YYYY-MM-DD'). Uses UTC midnights so daylight saving can't skew it. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / DAY_MS);
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + n * DAY_MS);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

/** Parses 'YYYY-MM-DD' as a local date (for display). */
export function parseLocal(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Cycle day for a date: day 1 is the first day of the most recent period that started on or before it.
 * Returns null before the first known period start.
 * @param starts period start dates, any order
 */
export function cycleDayFor(date: string, starts: string[]): number | null {
  let best: string | null = null;
  for (const s of starts) if (s <= date && (best === null || s > best)) best = s;
  return best === null ? null : daysBetween(best, date) + 1;
}

/**
 * For each complete cycle (a start followed by a later start), how many days before the next period
 * a date falls. 1 = the day before the period started. Null if the date isn't inside a complete cycle.
 */
export function daysBeforePeriod(date: string, starts: string[]): number | null {
  const sorted = [...starts].sort();
  for (let i = 0; i < sorted.length - 1; i++) {
    if (date >= sorted[i] && date < sorted[i + 1]) return daysBetween(date, sorted[i + 1]);
  }
  return null;
}

/** True once at least one full cycle is recorded: two period starts at least 10 days apart. */
export function hasFullCycle(starts: string[]): boolean {
  const sorted = [...starts].sort();
  for (let i = 0; i < sorted.length - 1; i++) if (daysBetween(sorted[i], sorted[i + 1]) >= 10) return true;
  return false;
}
