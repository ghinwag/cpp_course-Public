import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computePattern } from '../lib/pattern.ts';

const starts = ['2026-09-01', '2026-09-29'];

test('not ready before one full cycle', () => {
  assert.equal(computePattern([], ['2026-09-01']).ready, false);
});

test('counts hard days, taps and tags by days before the period', () => {
  const p = computePattern(
    [
      { local_date: '2026-09-28', type: 'checkin', tags: [], rating: 4 },
      { local_date: '2026-09-28', type: 'tap', tags: ['cramps'], rating: null },
      { local_date: '2026-09-28', type: 'tap', tags: ['cramps', 'tired'], rating: null },
      { local_date: '2026-09-26', type: 'checkin', tags: [], rating: 2 },
      { local_date: '2026-09-05', type: 'tap', tags: ['headache'], rating: null }, // outside window
      { local_date: '2026-10-05', type: 'tap', tags: ['sad'], rating: null }, // current, incomplete cycle
    ],
    starts,
  );
  assert.equal(p.ready, true);
  assert.equal(p.cycles, 1);
  const d1 = p.days.find((d) => d.before === 1)!;
  assert.deepEqual(d1, { before: 1, hardDays: 1, avgTaps: 2 });
  assert.equal(p.days.find((d) => d.before === 3)!.hardDays, 0);
  assert.deepEqual(p.tagsBefore, [['cramps', 2], ['tired', 1]]);
  assert.equal(p.days.length, 14);
});
