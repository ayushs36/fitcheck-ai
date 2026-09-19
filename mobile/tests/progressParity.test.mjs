import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateProgressInsights} from '../src/utils/progressInsights.ts';
import {buildStrengthPreview, buildTrendSeries} from '../src/utils/trendSeries.ts';

test('weekly averages skip zero and blank entries and do not depend on import ordering', () => {
  const logs = Array.from({length: 15}, (_, index) => ({date: `2026-09-${String(index + 1).padStart(2, '0')}`,
    goal: 'maintain', calories: index < 8 ? 4000 : index === 14 ? 0 : 2000, proteinGrams: index === 14 ? undefined : 140,
    weightLbs: index === 14 ? 0 : 140, steps: index === 14 ? 0 : 8000}));
  const original = JSON.stringify(logs);
  const result = calculateProgressInsights(logs, null);
  assert.deepEqual(result.averages.map(metric => metric.value), [2000, 140, 8000]);
  assert.equal(result.averages[0].loggedDays, 6);
  assert.equal(result.weightTrend.weeklyChange, 0);
  assert.deepEqual(result, calculateProgressInsights([...logs].reverse(), null));
  assert.equal(JSON.stringify(logs), original);
  assert.equal(buildTrendSeries(logs, 'weightLbs').length, 14);
});

test('training volume compares matching workout types rather than adjacent unrelated sessions', () => {
  const workout = (date, type, reps) => ({date, type, exercises: [{name: type, sets: [{reps, weightLbs: 20}]}]});
  const result = buildStrengthPreview([workout('2026-09-19', 'Push', 10), workout('2026-09-18', 'Legs', 100), workout('2026-09-12', 'Push', 10)]);
  assert.equal(result.direction, 'flat');
  assert.equal(buildStrengthPreview([workout('2026-09-19', 'Push', 10), workout('2026-09-18', 'Legs', 100)]).direction, 'unknown');
});
