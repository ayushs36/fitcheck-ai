import type { DailyLog, UserSettings, WorkoutSession } from "../types/fitness";

type ObjectValue = Record<string, unknown>;
function object(value: unknown): value is ObjectValue {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
const goal = (value: unknown) => ["cut", "maintain", "bulk"].includes(value as string);
const text = (value: unknown) => typeof value === "string" && value.trim().length > 0;
const timestamp = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value));
const optionalText = (value: unknown) => value === undefined || typeof value === "string";
const optionalNumber = (value: unknown, positive = false, integer = false) =>
  value === undefined || (typeof value === "number" && Number.isFinite(value)
    && (positive ? value > 0 : value >= 0) && (!integer || Number.isInteger(value)));
const optionalBoolean = (value: unknown) => value === undefined || typeof value === "boolean";
const optionalRir = (value: unknown) => value === undefined || (typeof value === "number"
  && Number.isInteger(value) && value >= 0 && value <= 10);
function validMeasurements(value: unknown) {
  if (value === undefined) return true;
  if (!object(value)) return false;
  return ["waistInches", "chestInches", "hipInches"].every(key => optionalNumber(value[key], true));
}
function date(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function validPhaseTargets(value: unknown) {
  if (!object(value) || !goal(value.defaultGoal)) return false;
  return ["startingWeightLbs", "targetWeightLbs"].every(key => optionalNumber(value[key], true))
    && ["weeklyGoalPaceLbs", "calorieTarget", "proteinTarget"].every(key => optionalNumber(value[key]))
    && optionalNumber(value.stepTarget, false, true);
}

function validGoalPhases(value: unknown) {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length > 100) return false;
  const ids = new Set<string>();
  let priorEnd: string | undefined;
  let hasOpenPhase = false;
  return value.every(phase => {
    const startDate = object(phase) ? phase.startDate : undefined;
    const endDate = object(phase) ? phase.endDate : undefined;
    if (!object(phase) || !text(phase.id) || ids.has(phase.id as string) || !date(startDate)
      || (endDate !== undefined && (!date(endDate) || endDate < startDate))
      || !validPhaseTargets(phase.initialTargets) || !validPhaseTargets(phase.targets)
      || !optionalNumber(phase.startAverageLbs, true) || !optionalNumber(phase.endAverageLbs, true)
      || !optionalNumber(phase.loggedDays, false, true)
      || hasOpenPhase || (priorEnd !== undefined && startDate < priorEnd)) return false;
    ids.add(phase.id as string);
    priorEnd = endDate as string | undefined;
    hasOpenPhase = endDate === undefined;
    return true;
  });
}

function validWeeklyReviews(value: unknown) {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length > 52) return false;
  const ids = new Set<string>();
  return value.every(review => {
    const baselineStart = object(review) ? review.baselineStart : undefined;
    const baselineEnd = object(review) ? review.baselineEnd : undefined;
    if (!object(review) || !text(review.id) || ids.has(review.id as string) || !timestamp(review.reviewedAt)
      || !date(baselineStart) || !date(baselineEnd) || baselineEnd < baselineStart
      || !goal(review.goal) || !text(review.action) || !["accepted", "dismissed"].includes(review.status as string)
      || !optionalNumber(review.baselineWeight, true) || !optionalNumber(review.baselineWeighIns, false, true)
      || (review.phaseId !== undefined && !text(review.phaseId))
      || (review.outcome !== undefined && !["helped", "notYet", "skipped"].includes(review.outcome as string))) return false;
    ids.add(review.id as string);
    return true;
  });
}

function validExerciseTargets(value: unknown) {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length > 100) return false;
  const keys = new Set<string>();
  return value.every(target => {
    if (!object(target) || !text(target.key) || keys.has(target.key as string) || !text(target.name)
      || !["weighted", "bodyweight"].includes(target.mode as string)
      || typeof target.reps !== "number" || !Number.isInteger(target.reps) || target.reps < 1 || target.reps > 1000
      || !optionalNumber(target.weightLbs, true)
      || (target.mode === "weighted" && (typeof target.weightLbs !== "number" || target.weightLbs <= 0))) return false;
    keys.add(target.key as string);
    return true;
  });
}

export function isDailyLog(value: unknown): value is DailyLog {
  return object(value) && text(value.id) && date(value.date) && goal(value.goal)
    && timestamp(value.createdAt) && timestamp(value.updatedAt)
    && optionalNumber(value.weightLbs, true) && optionalNumber(value.calories)
    && optionalNumber(value.proteinGrams) && optionalNumber(value.steps, false, true)
    && validMeasurements(value.measurements) && optionalText(value.workoutType) && optionalText(value.notes);
}

export function isWorkoutSession(value: unknown): value is WorkoutSession {
  if (!object(value) || !text(value.id) || !date(value.date) || !text(value.type)
    || !timestamp(value.createdAt) || !timestamp(value.updatedAt)
    || !optionalText(value.notes) || !optionalNumber(value.durationSeconds, true, true)
    || !Array.isArray(value.exercises)) return false;
  const ids = new Set<string>();
  return value.exercises.every(exercise => {
    if (!object(exercise) || !text(exercise.id) || !text(exercise.name)
      || !optionalText(exercise.muscleGroup) || !Array.isArray(exercise.sets)
      || ids.has(exercise.id as string)) return false;
    ids.add(exercise.id as string);
    const sets = new Set<string>();
    return exercise.sets.every(set => {
      if (!object(set) || !text(set.id) || sets.has(set.id as string)
        || !optionalNumber(set.reps, false, true) || !optionalNumber(set.weightLbs)
        || !optionalBoolean(set.isBodyweight) || !optionalBoolean(set.formFocus)
        || !optionalBoolean(set.isWarmup) || !optionalRir(set.rir)
        || !optionalText(set.notes)) return false;
      sets.add(set.id as string);
      return true;
    });
  });
}

export function isUserSettings(value: unknown): value is UserSettings {
  if (!object(value) || !["imperial", "metric"].includes(value.unitSystem as string)
    || !goal(value.defaultGoal) || !optionalBoolean(value.hasCompletedOnboarding)
    || (value.updatedAt !== undefined && !timestamp(value.updatedAt))) return false;
  return ["startingWeightLbs", "targetWeightLbs"].every(key => optionalNumber(value[key], true))
    && ["weeklyGoalPaceLbs", "calorieTarget", "proteinTarget"].every(key => optionalNumber(value[key]))
    && optionalNumber(value.stepTarget, false, true)
    && validGoalPhases(value.goalPhases)
    && validWeeklyReviews(value.weeklyReviews)
    && validExerciseTargets(value.exerciseTargets);
}

export function validateRecordArray<T>(value: unknown, predicate: (item: unknown) => item is T,
  key: (item: T) => string): asserts value is T[] {
  if (!Array.isArray(value)) throw new Error("Expected a list of records.");
  const keys = new Set<string>();
  for (const item of value) {
    if (!predicate(item)) throw new Error("Invalid fitness record. Original data was retained.");
    const id = key(item);
    if (keys.has(id)) throw new Error("Duplicate records require review before import.");
    keys.add(id);
  }
}
