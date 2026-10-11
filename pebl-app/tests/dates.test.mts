import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, cycleDayFor, daysBeforePeriod, daysBetween, hasFullCycle } from '../lib/dates.ts';

test('daysBetween across months and a DST change', () => {
  assert.equal(daysBetween('2026-03-28', '2026-04-02'), 5);
  assert.equal(daysBetween('2026-10-20', '2026-10-31'), 11);
  assert.equal(daysBetween('2026-01-01', '2026-01-01'), 0);
});

test('addDays', () => {
  assert.equal(addDays('2026-02-27', 2), '2026-03-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
});

test('cycleDayFor: day 1 is the period start', () => {
  const starts = ['2026-09-01', '2026-09-29'];
  assert.equal(cycleDayFor('2026-09-01', starts), 1);
  assert.equal(cycleDayFor('2026-09-22', starts), 22);
  assert.equal(cycleDayFor('2026-10-01', starts), 3);
  assert.equal(cycleDayFor('2026-08-31', starts), null);
});

test('daysBeforePeriod only inside complete cycles', () => {
  const starts = ['2026-09-29', '2026-09-01'];
  assert.equal(daysBeforePeriod('2026-09-28', starts), 1);
  assert.equal(daysBeforePeriod('2026-09-01', starts), 28);
  assert.equal(daysBeforePeriod('2026-09-30', starts), null);
});

test('hasFullCycle needs two starts at least 10 days apart', () => {
  assert.equal(hasFullCycle(['2026-09-01']), false);
  assert.equal(hasFullCycle(['2026-09-01', '2026-09-03']), false);
  assert.equal(hasFullCycle(['2026-09-01', '2026-09-29']), true);
});
