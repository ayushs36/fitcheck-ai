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
function date(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export function isDailyLog(value: unknown): value is DailyLog {
  return object(value) && text(value.id) && date(value.date) && goal(value.goal)
    && timestamp(value.createdAt) && timestamp(value.updatedAt)
    && optionalNumber(value.weightLbs, true) && optionalNumber(value.calories)
    && optionalNumber(value.proteinGrams) && optionalNumber(value.steps, false, true)
    && optionalText(value.workoutType) && optionalText(value.notes);
}

export function isWorkoutSession(value: unknown): value is WorkoutSession {
  if (!object(value) || !text(value.id) || !date(value.date) || !text(value.type)
    || !timestamp(value.createdAt) || !timestamp(value.updatedAt)
    || !optionalText(value.notes) || !Array.isArray(value.exercises)) return false;
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
    && optionalNumber(value.stepTarget, false, true);
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
