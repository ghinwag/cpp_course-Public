// CSV export: one row per event, plus the tester's nickname so files from many testers can be merged.
import { daysBeforePeriod } from './dates';

type EventLike = {
  id: number;
  timestamp: string;
  local_date: string;
  type: string;
  cycle_day: number | null;
  tags: string[];
  rating: number | null;
  note: string | null;
};

const RATING_LABELS = ['Easy', 'Okay', 'Meh', 'Hard', 'Awful'];

export const CSV_COLUMNS = [
  'tester',
  'event_id',
  'timestamp_utc',
  'local_date',
  'type',
  'cycle_day',
  'days_before_next_period',
  'tags',
  'rating',
  'rating_label',
  'note',
] as const;

/** Quotes a field when it needs it (commas, quotes, line breaks), RFC 4180 style. */
export function csvField(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(events: EventLike[], tester: string, periodStarts: string[]): string {
  const lines = [CSV_COLUMNS.join(',')];
  for (const e of events) {
    lines.push(
      [
        tester,
        e.id,
        e.timestamp,
        e.local_date,
        e.type,
        e.cycle_day,
        daysBeforePeriod(e.local_date, periodStarts),
        e.tags.join('|'),
        e.rating,
        e.rating ? RATING_LABELS[e.rating - 1] : '',
        e.note,
      ]
        .map(csvField)
        .join(','),
    );
  }
  return lines.join('\r\n') + '\r\n';
}
