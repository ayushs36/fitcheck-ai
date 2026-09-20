import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loggedWorkoutNames, loggedExercises} from '../src/utils/workoutSuggestions.ts';

const session = (type, name, date = '2026-09-20') => ({type, date, exercises: [{name, sets: []}]});

test('new accounts have no preset workout or exercise suggestions', () => {
  assert.deepEqual(loggedWorkoutNames([], []), []);
  assert.deepEqual(loggedExercises('Push', []), []);
});

test('workout suggestions use saved daily logs and sessions, trim and deduplicate names', () => {
  assert.deepEqual(loggedWorkoutNames([{date: '2026-09-19', workoutType: 'push'}, {date: '2026-09-18', workoutType: ''}],
    [session(' Push ', 'Bench'), session('My circuit', 'Squat', '2025-01-01')]), ['Push', 'My circuit']);
});

test('exercise suggestions are scoped to the workout and include older history', () => {
  const sessions = [session('Push', ' Bench '), session('push', 'bench', '2026-09-18'), session('Pull', 'Row'), session('Push', 'Dips', '2025-01-01')];
  assert.deepEqual(loggedExercises(' PUSH ', sessions).map(item => item.name), ['Bench', 'Dips']);
  assert.deepEqual(loggedExercises('New workout', sessions), []);
});

test('deleting the final saved occurrence removes the suggestion without a separate bank', () => {
  const sessions = [session('Push', 'Bench'), session('Pull', 'Row')];
  const remaining = sessions.filter(item => item.type !== 'Push');
  assert.deepEqual(loggedWorkoutNames([], remaining), ['Pull']);
  assert.deepEqual(loggedExercises('Push', remaining), []);
  assert.equal(sessions.length, 2);
});
