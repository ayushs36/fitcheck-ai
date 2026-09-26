import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateProgressInsights} from '../src/utils/progressInsights.ts';
import {getTodayKey} from '../src/utils/date.ts';
import {buildStrengthPreview, buildTrendSeries} from '../src/utils/trendSeries.ts';

test('weekly averages use the latest seven valid entries and do not depend on import ordering', () => {
  const logs = Array.from({length: 15}, (_, index) => ({date: `2026-09-${String(index + 1).padStart(2, '0')}`,
    goal: 'maintain', calories: index < 8 ? 4000 : index === 14 ? 0 : 2000, proteinGrams: index === 14 ? undefined : 140,
    weightLbs: index === 14 ? 0 : 140, steps: index === 14 ? 0 : 8000}));
  const original = JSON.stringify(logs);
  const result = calculateProgressInsights(logs, null);
  assert.deepEqual(result.averages.map(metric => metric.value), [Math.round((4000 + 2000 * 6) / 7), 140, 8000]);
  assert.equal(result.averages[0].loggedDays, 7);
  assert.equal(result.nutritionDiagnosis.calorieAverage7, Math.round((4000 + 2000 * 6) / 7));
  assert.equal(result.nutritionDiagnosis.calorieLoggedDays7, 7);
  assert.equal(result.nutritionDiagnosis.proteinAverage7, 140);
  assert.equal(result.nutritionDiagnosis.proteinLoggedDays7, 7);
  assert.equal(result.weightTrend.weeklyChange, 0);
  assert.deepEqual(result, calculateProgressInsights([...logs].reverse(), null));
  assert.equal(JSON.stringify(logs), original);
  assert.equal(buildTrendSeries(logs, 'weightLbs').length, 14);
});


test('complete local-day logs report 7/7 coverage and a seven-day streak', () => {
  const today = new Date();
  const logs = Array.from({length: 7}, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - index);
    return {
      date: getTodayKey(date), goal: 'maintain', weightLbs: 140,
      calories: 2000, proteinGrams: 140, steps: 8000,
    };
  });

  const result = calculateProgressInsights(logs, null);
  assert.deepEqual(result.loggingQuality.coverage, {weight: 7, calories: 7, protein: 7, steps: 7});
  assert.equal(result.loggingQuality.streakDays, 7);
});

test('training volume compares matching workout types rather than adjacent unrelated sessions', () => {
  const workout = (date, type, reps) => ({date, type, exercises: [{name: type, sets: [{reps, weightLbs: 20}]}]});
  const result = buildStrengthPreview([workout('2026-09-19', 'Push', 10), workout('2026-09-18', 'Legs', 100), workout('2026-09-12', 'Push', 10)]);
  assert.equal(result.direction, 'flat');
  assert.equal(buildStrengthPreview([workout('2026-09-19', 'Push', 10), workout('2026-09-18', 'Legs', 100)]).direction, 'unknown');
});
