import {test} from 'node:test';
import assert from 'node:assert/strict';
import {groupLogHistory} from '../src/utils/logHistory.ts';

test('history groups by month and year, newest first, without changing records', () => {
  const logs = [{date: '2025-09-30'}, {date: '2026-01-01'}, {date: '2026-09-01'}, {date: '2026-09-19'}];
  const before = JSON.stringify(logs);
  const groups = groupLogHistory(logs);
  assert.deepEqual(groups.map(group => group.monthYear), ['September 2026', 'January 2026', 'September 2025']);
  assert.deepEqual(groups[0].logs.map(log => log.date), ['2026-09-19', '2026-09-01']);
  assert.equal(groups[0].logs[0], logs[3]);
  assert.equal(JSON.stringify(logs), before);
  assert.deepEqual(groupLogHistory([]), []);
});
