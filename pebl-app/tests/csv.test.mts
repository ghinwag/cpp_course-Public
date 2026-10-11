import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCsv } from '../lib/csv.ts';

test('one row per event with tester column and safe quoting', () => {
  const csv = toCsv(
    [
      { id: 1, timestamp: '2026-09-28T18:00:00.000Z', local_date: '2026-09-28', type: 'tap', cycle_day: 28, tags: ['cramps', 'back pain'], rating: null, note: null },
      { id: 2, timestamp: '2026-09-28T20:00:00.000Z', local_date: '2026-09-28', type: 'checkin', cycle_day: 28, tags: [], rating: 4, note: 'Long day, "rough"' },
    ],
    'Tester A',
    ['2026-09-01', '2026-09-29'],
  );
  const rows = csv.trim().split('\r\n');
  assert.equal(rows.length, 3);
  assert.equal(rows[0], 'tester,event_id,timestamp_utc,local_date,type,cycle_day,days_before_next_period,tags,rating,rating_label,note');
  assert.equal(rows[1], 'Tester A,1,2026-09-28T18:00:00.000Z,2026-09-28,tap,28,1,cramps|back pain,,,');
  assert.equal(rows[2], 'Tester A,2,2026-09-28T20:00:00.000Z,2026-09-28,checkin,28,1,,4,Hard,"Long day, ""rough"""');
});
