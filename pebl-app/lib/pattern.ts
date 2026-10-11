// Pure pattern maths for the Pattern screen. No imports beyond dates, so it's unit-testable.
// Describes what happened. It does not predict anything.
import { daysBeforePeriod, hasFullCycle } from './dates';

export const WINDOW = 14; // days before a period that the chart covers

type EventLike = { local_date: string; type: string; tags: string[]; rating: number | null };

export type PatternDay = {
  /** Days before the period: 1 = the day before it started. */
  before: number;
  /** In how many complete cycles that day was checked in as Hard or Awful. */
  hardDays: number;
  /** Average taps on that day across complete cycles. */
  avgTaps: number;
};

export type Pattern = {
  ready: boolean;
  cycles: number;
  days: PatternDay[]; // before = WINDOW … 1
  /** Tags logged in the 7 days before a period, most first. */
  tagsBefore: [string, number][];
};

export function computePattern(events: EventLike[], starts: string[]): Pattern {
  const sorted = [...starts].sort();
  const ready = hasFullCycle(sorted);
  const cycles = Math.max(0, sorted.length - 1);
  const hard = new Array(WINDOW + 1).fill(0);
  const taps = new Array(WINDOW + 1).fill(0);
  const tagCounts = new Map<string, number>();

  for (const e of events) {
    const before = daysBeforePeriod(e.local_date, sorted);
    if (before === null || before > WINDOW) continue;
    if (e.type === 'tap') taps[before]++;
    if (e.type === 'checkin' && e.rating !== null && e.rating >= 4) hard[before]++;
    if (before <= 7) for (const t of e.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }

  const days: PatternDay[] = [];
  for (let b = WINDOW; b >= 1; b--) {
    days.push({ before: b, hardDays: hard[b], avgTaps: cycles ? Math.round((taps[b] / cycles) * 10) / 10 : 0 });
  }
  const tagsBefore = [...tagCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return { ready, cycles, days, tagsBefore };
}
