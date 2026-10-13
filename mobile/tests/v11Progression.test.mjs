import test from "node:test";
import assert from "node:assert/strict";
import { savePhaseSettings } from "../src/utils/goalPhases.ts";
import { buildWeeklyReview, recordWeeklyDecision, reviewFollowUp } from "../src/utils/weeklyReview.ts";
import { buildExerciseProgression, saveExerciseTarget } from "../src/utils/exerciseProgression.ts";
import { isUserSettings } from "../src/storage/validateRecords.ts";

const settings = {
  unitSystem: "imperial", defaultGoal: "cut", startingWeightLbs: 150,
  targetWeightLbs: 140, weeklyGoalPaceLbs: 1, calorieTarget: 2000,
  proteinTarget: 140, stepTarget: 8000, hasCompletedOnboarding: true,
  updatedAt: "2026-10-13T12:00:00.000Z",
};

test("goal phases retain a completed phase snapshot while a new phase owns its start day", () => {
  const logs = [
    { date: "2026-10-11", weightLbs: 150 }, { date: "2026-10-12", weightLbs: 149 },
  ].map((log, index) => ({ ...log, id: `${index}`, goal: "cut", createdAt: settings.updatedAt, updatedAt: settings.updatedAt }));
  const first = savePhaseSettings(null, settings, logs, "2026-10-11", "cut-1");
  const current = savePhaseSettings(first, { ...settings, calorieTarget: 1900 }, logs, "2026-10-12", "ignored");
  assert.equal(current.goalPhases.length, 1);
  assert.equal(current.goalPhases[0].initialTargets.calorieTarget, 2000);
  assert.equal(current.goalPhases[0].targets.calorieTarget, 1900);

  const maintenance = savePhaseSettings(current, { ...settings, defaultGoal: "maintain", weeklyGoalPaceLbs: 0 }, logs, "2026-10-13", "maintain-1");
  assert.equal(maintenance.goalPhases.length, 2);
  assert.equal(maintenance.goalPhases[0].endDate, "2026-10-13");
  assert.equal(maintenance.goalPhases[1].startDate, "2026-10-13");
  assert.equal(maintenance.goalPhases[0].loggedDays, 2);
});

test("weekly review skips blank metrics and follows up only after a full week", () => {
  const logs = [
    ...Array.from({ length: 7 }, (_, index) => ({ date: `2026-09-${String(21 + index).padStart(2, "0")}`, weightLbs: 150 - index * 0.1, calories: 2000 })),
    ...["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"].map((date, index) => ({ date, weightLbs: 149.3 - index * 0.1, calories: index === 0 ? undefined : 2000 })),
  ].map((log, index) => ({ ...log, id: `${index}`, goal: "cut", createdAt: settings.updatedAt, updatedAt: settings.updatedAt }));
  const review = buildWeeklyReview(logs, settings, "2026-10-05");
  assert.equal(review.recent.count, 7);
  assert.equal(review.metrics.calories.count, 6);
  assert.ok(review.change < 0);
  const saved = recordWeeklyDecision(settings, review, "accepted", "2026-10-05T10:00:00.000Z");
  assert.equal(saved.weeklyReviews.length, 1);
  assert.equal(reviewFollowUp(saved.weeklyReviews[0], logs, "2026-10-12").ready, false);
  assert.equal(reviewFollowUp(saved.weeklyReviews[0], logs, "2026-10-13").ready, true);
});

test("exercise progression separates weighted working sets from bodyweight and warm-up work", () => {
  const sessions = [{
    id: "session", date: "2026-10-01", type: "Push", createdAt: settings.updatedAt, updatedAt: settings.updatedAt,
    exercises: [{ id: "exercise", name: "Bench Press", sets: [
      { id: "warm", reps: 12, weightLbs: 45, isWarmup: true },
      { id: "work", reps: 8, weightLbs: 135 },
      { id: "body", reps: 20, isBodyweight: true },
      { id: "form", reps: 10, weightLbs: 95, formFocus: true },
    ] }],
  }];
  const weighted = buildExerciseProgression(sessions, " bench  press ", "weighted");
  assert.equal(weighted.history[0].working.length, 1);
  assert.deepEqual(weighted.suggestion.reps, 9);
  assert.equal(weighted.records[0].load, 135);
  const bodyweight = buildExerciseProgression(sessions, "Bench Press", "bodyweight");
  assert.equal(bodyweight.records[0].reps, 20);
  assert.throws(() => saveExerciseTarget([], { key: "bench:weighted", name: "Bench", mode: "weighted", reps: 8 }));
});

test("v1.1 settings extensions validate without invalidating older settings", () => {
  assert.equal(isUserSettings(settings), true);
  assert.equal(isUserSettings({ ...settings, weeklyReviews: [{ id: "x", reviewedAt: settings.updatedAt, baselineStart: "2026-10-01", baselineEnd: "2026-10-07", goal: "cut", action: "Keep logging", status: "accepted", baselineWeighIns: 3 }] }), true);
  assert.equal(isUserSettings({ ...settings, exerciseTargets: [{ key: "x", name: "Bench", mode: "weighted", reps: 8 }] }), false);
});
