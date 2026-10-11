import { useSyncExternalStore } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { cycleDayFor, localDate } from './dates';

// Everything stays on the phone. No accounts, no server, no analytics.

export const DB_NAME = 'pebl.db';

export type EventType = 'tap' | 'calm' | 'checkin';

export type PeblEvent = {
  id: number;
  timestamp: string; // ISO 8601, UTC
  local_date: string; // 'YYYY-MM-DD' on the phone when it happened
  type: EventType;
  cycle_day: number | null;
  tags: string[];
  rating: number | null; // check-ins only, 1 = Easy … 5 = Awful
  note: string | null;
};

type EventRow = Omit<PeblEvent, 'tags'> & { tags: string };

export const RATINGS = ['Easy', 'Okay', 'Meh', 'Hard', 'Awful'] as const;
export const ratingLabel = (r: number | null) => (r ? RATINGS[r - 1] : '');
/** Hard or Awful. */
export const isHardRating = (r: number | null) => r !== null && r >= 4;

// ---------- change signal: screens re-read after any write ----------

let version = 0;
const listeners = new Set<() => void>();
export function dataChanged() {
  version++;
  listeners.forEach((l) => l());
}
/** A number that goes up after every write. Put it in an effect's deps to reload. */
export function useDataVersion() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
  );
}

// ---------- schema ----------

export async function migrate(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        local_date TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('tap', 'calm', 'checkin')),
        cycle_day INTEGER,
        tags TEXT NOT NULL DEFAULT '[]',
        rating INTEGER,
        note TEXT
      );
      CREATE INDEX IF NOT EXISTS events_local_date ON events (local_date);
      CREATE TABLE IF NOT EXISTS cycles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_date TEXT NOT NULL UNIQUE
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
      PRAGMA user_version = 1;
    `);
  }
}

// ---------- settings ----------

export type Settings = {
  onboarded: boolean;
  nickname: string;
  /** Usual cycle length in days, or null for "not sure". */
  cycleLength: number | null;
  reminderOn: boolean;
  reminderTime: string; // 'HH:MM'
};

const DEFAULTS: Settings = { onboarded: false, nickname: '', cycleLength: 28, reminderOn: false, reminderTime: '20:30' };

export async function getSettings(db: SQLiteDatabase): Promise<Settings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    onboarded: map.onboarded === '1',
    nickname: map.nickname ?? DEFAULTS.nickname,
    cycleLength: map.cycleLength === undefined ? DEFAULTS.cycleLength : map.cycleLength === 'unsure' ? null : Number(map.cycleLength),
    reminderOn: map.reminderOn === '1',
    reminderTime: map.reminderTime ?? DEFAULTS.reminderTime,
  };
}

export async function saveSettings(db: SQLiteDatabase, patch: Partial<Settings>) {
  const encode: Record<string, string> = {};
  if (patch.onboarded !== undefined) encode.onboarded = patch.onboarded ? '1' : '0';
  if (patch.nickname !== undefined) encode.nickname = patch.nickname.trim();
  if (patch.cycleLength !== undefined) encode.cycleLength = patch.cycleLength === null ? 'unsure' : String(patch.cycleLength);
  if (patch.reminderOn !== undefined) encode.reminderOn = patch.reminderOn ? '1' : '0';
  if (patch.reminderTime !== undefined) encode.reminderTime = patch.reminderTime;
  for (const [key, value] of Object.entries(encode)) {
    await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value);
  }
  dataChanged();
}

// ---------- cycles ----------

export async function getCycleStarts(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ start_date: string }>('SELECT start_date FROM cycles ORDER BY start_date');
  return rows.map((r) => r.start_date);
}

/** Keeps every event's stored cycle_day right after the period dates change. */
async function recomputeCycleDays(db: SQLiteDatabase) {
  await db.runAsync(`
    UPDATE events SET cycle_day = (
      SELECT CAST(julianday(events.local_date) - julianday(c.start_date) AS INTEGER) + 1
      FROM cycles c WHERE c.start_date <= events.local_date
      ORDER BY c.start_date DESC LIMIT 1
    )`);
}

export async function addPeriodStart(db: SQLiteDatabase, date: string) {
  await db.runAsync('INSERT OR IGNORE INTO cycles (start_date) VALUES (?)', date);
  await recomputeCycleDays(db);
  dataChanged();
}

/** Moves the most recent period start (used when editing cycle info). Adds one if there is none. */
export async function setLatestPeriodStart(db: SQLiteDatabase, date: string) {
  const latest = await db.getFirstAsync<{ id: number }>('SELECT id FROM cycles ORDER BY start_date DESC LIMIT 1');
  if (latest) {
    await db.runAsync('DELETE FROM cycles WHERE start_date = ? AND id != ?', date, latest.id);
    await db.runAsync('UPDATE cycles SET start_date = ? WHERE id = ?', date, latest.id);
  } else {
    await db.runAsync('INSERT INTO cycles (start_date) VALUES (?)', date);
  }
  await recomputeCycleDays(db);
  dataChanged();
}

export async function removePeriodStart(db: SQLiteDatabase, date: string) {
  await db.runAsync('DELETE FROM cycles WHERE start_date = ?', date);
  await recomputeCycleDays(db);
  dataChanged();
}

// ---------- events ----------

const toEvent = (r: EventRow): PeblEvent => ({ ...r, tags: safeTags(r.tags) });
function safeTags(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export async function addEvent(
  db: SQLiteDatabase,
  type: EventType,
  fields: { tags?: string[]; rating?: number | null; note?: string | null } = {},
): Promise<number> {
  const now = new Date();
  const date = localDate(now);
  const cycleDay = cycleDayFor(date, await getCycleStarts(db));
  const res = await db.runAsync(
    'INSERT INTO events (timestamp, local_date, type, cycle_day, tags, rating, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
    now.toISOString(),
    date,
    type,
    cycleDay,
    JSON.stringify(fields.tags ?? []),
    fields.rating ?? null,
    fields.note ?? null,
  );
  dataChanged();
  return res.lastInsertRowId;
}

export async function setEventTags(db: SQLiteDatabase, id: number, tags: string[]) {
  await db.runAsync('UPDATE events SET tags = ? WHERE id = ?', JSON.stringify(tags), id);
  dataChanged();
}

export async function getEvent(db: SQLiteDatabase, id: number): Promise<PeblEvent | null> {
  const r = await db.getFirstAsync<EventRow>('SELECT * FROM events WHERE id = ?', id);
  return r ? toEvent(r) : null;
}

export async function getEventsOn(db: SQLiteDatabase, date: string): Promise<PeblEvent[]> {
  const rows = await db.getAllAsync<EventRow>('SELECT * FROM events WHERE local_date = ? ORDER BY timestamp', date);
  return rows.map(toEvent);
}

export async function getAllEvents(db: SQLiteDatabase): Promise<PeblEvent[]> {
  const rows = await db.getAllAsync<EventRow>('SELECT * FROM events ORDER BY timestamp');
  return rows.map(toEvent);
}

/** One check-in per day: saving again replaces the day's rating. */
export async function saveCheckin(db: SQLiteDatabase, rating: number, note: string | null) {
  const today = localDate();
  const existing = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM events WHERE type = 'checkin' AND local_date = ? ORDER BY timestamp DESC LIMIT 1",
    today,
  );
  if (existing) {
    await db.runAsync('UPDATE events SET rating = ?, note = ? WHERE id = ?', rating, note, existing.id);
    dataChanged();
  } else {
    await addEvent(db, 'checkin', { rating, note });
  }
}

export async function deleteEverything(db: SQLiteDatabase) {
  await db.execAsync('DELETE FROM events; DELETE FROM cycles; DELETE FROM settings; DELETE FROM sqlite_sequence;');
  dataChanged();
}

/** Every tag ever used, most used first. Lets "+ your own" tags come back as chips next time. */
export async function getUsedTags(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ tag: string; n: number }>(
    "SELECT j.value AS tag, COUNT(*) AS n FROM events, json_each(events.tags) j GROUP BY j.value ORDER BY n DESC",
  );
  return rows.map((r) => r.tag);
}
