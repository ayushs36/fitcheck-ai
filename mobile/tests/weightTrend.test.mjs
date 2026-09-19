import {test} from 'node:test';
import assert from 'node:assert/strict';
import {weeklyWeightChange} from '../src/utils/weightTrend.ts';

const logs = Array.from({length: 14}, (_, i) => ({date: `2026-09-${String(i + 1).padStart(2, '0')}`, weightLbs: i < 7 ? 140 : 139}));
test('pace matches two seven-weigh-in averages regardless of input order', () => {
  assert.equal(weeklyWeightChange(logs), -1);
  assert.equal(weeklyWeightChange([...logs].reverse()), -1);
});
test('missing weights do not displace valid history and old weights are excluded', () => {
  assert.equal(weeklyWeightChange([{date: '2026-08-01', weightLbs: 200}, ...logs, {date: '2026-09-15'}, {date: '2026-09-16', weightLbs: 0}]), -1);
  assert.equal(weeklyWeightChange(logs.slice(1)), undefined);
});
