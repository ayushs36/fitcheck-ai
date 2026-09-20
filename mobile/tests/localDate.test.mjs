import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getTodayKey} from '../src/utils/date.ts';

test('Today follows local midnight rather than UTC midnight', () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = 'America/Chicago';
    assert.equal(getTodayKey(new Date('2026-09-21T01:00:00Z')), '2026-09-20');
    assert.equal(getTodayKey(new Date('2026-09-21T04:59:59Z')), '2026-09-20');
    assert.equal(getTodayKey(new Date('2026-09-21T05:00:00Z')), '2026-09-21');
    process.env.TZ = 'Asia/Tokyo';
    assert.equal(getTodayKey(new Date('2026-09-20T15:00:00Z')), '2026-09-21');
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('local calendar dates remain correct through daylight saving changes', () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = 'America/Chicago';
    assert.equal(getTodayKey(new Date('2026-11-01T06:30:00Z')), '2026-11-01');
    assert.equal(getTodayKey(new Date('2026-11-01T07:30:00Z')), '2026-11-01');
    assert.equal(getTodayKey(new Date('2026-01-01T05:59:59Z')), '2025-12-31');
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
