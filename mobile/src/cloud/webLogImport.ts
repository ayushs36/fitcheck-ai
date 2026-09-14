import type {DailyLog, WorkoutSession, WorkoutType, GoalType} from "../types/fitness.ts";
import {isDailyLog, isWorkoutSession, validateRecordArray} from "../storage/validateRecords.ts";

export const MAX_WEB_EXPORT_BYTES = 5 * 1024 * 1024;
export type WebLogImport = {logs: DailyLog[]; workouts: WorkoutSession[]; assumedGoalDays: number};
const goals: Record<string, GoalType> = {Cutting: "cut", Maintaining: "maintain", Bulking: "bulk"};
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid web export.");
  return value as Record<string, unknown>;
}
function number(value: unknown, integer = false): number | undefined {
  if (value === undefined || value === null || value === "" || value === 0) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value))) {
    throw new Error("Invalid number in web logs. No records were imported.");
  }
  return value;
}

// Accept only the personal web export format, never AI history or a whole storage dump.
export function parseWebLogExport(text: string): WebLogImport {
  if (new TextEncoder().encode(text).length > MAX_WEB_EXPORT_BYTES) throw new Error("Export exceeds the 5 MB limit.");
  const source = object(JSON.parse(text));
  if (source.format !== "fitcheck-personal-logs" || source.version !== 1 || source.units !== "lb"
    || !Array.isArray(source.logs) || source.logs.length < 1 || source.logs.length > 10000) {
    throw new Error("Choose a personal FitCheck AI log export.");
  }
  const logs: DailyLog[] = [], workouts: WorkoutSession[] = [];
  let assumedGoalDays = 0;
  let totalSets = 0;
  for (const value of source.logs) {
    const entry = object(value);
    const goal = typeof entry.goal === "string" && Object.hasOwn(goals, entry.goal) ? goals[entry.goal] : null;
    if (!goal || typeof entry.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)
      || typeof entry.workout !== "string" || entry.workout.length > 200 || !Array.isArray(entry.exercises)
      || entry.exercises.length > 100) throw new Error("Invalid web log. No records were imported.");
    if (entry.goalAssumed === true) assumedGoalDays++;
    const date = entry.date;
    const timestamp = `${date}T12:00:00.000Z`;
    const workoutType = entry.workout.trim() as WorkoutType;
    const daily: DailyLog = {
      id: `web:${date}`, date, goal, createdAt: timestamp, updatedAt: timestamp,
      ...(number(entry.weight) !== undefined ? {weightLbs: number(entry.weight)} : {}),
      ...(number(entry.calories) !== undefined ? {calories: number(entry.calories)} : {}),
      ...(number(entry.protein) !== undefined ? {proteinGrams: number(entry.protein)} : {}),
      ...(number(entry.steps, true) !== undefined ? {steps: number(entry.steps, true)} : {}),
      ...(workoutType ? {workoutType} : {}),
    };
    logs.push(daily);
    if (!entry.exercises.length) continue;
    const exercises = entry.exercises.map((value, index) => {
      const exercise = object(value);
      if (typeof exercise.name !== "string" || !exercise.name.trim() || exercise.name.length > 200
        || typeof exercise.sets !== "number" || !Number.isInteger(exercise.sets)
        || exercise.sets < 1 || exercise.sets > 100) {
        throw new Error(`An exercise on ${date} needs a name and a valid set count before export.`);
      }
      const reps = exercise.reps === 0 ? 0 : number(exercise.reps, true);
      const weight = exercise.weight === 0 ? 0 : number(exercise.weight);
      totalSets += exercise.sets;
      if (totalSets > 100000) throw new Error("Too many exercise sets for one import. Export a smaller file.");
      return {id: `web:${date}:exercise:${index}`, name: exercise.name,
        sets: Array.from({length: exercise.sets}, (_, set) => ({
          id: `web:${date}:exercise:${index}:set:${set}`,
          ...(reps !== undefined ? {reps} : {}),
          ...(weight !== undefined ? {weightLbs: weight} : {}),
        }))};
    });
    const workout = {id: `web:${date}:workout`, date, type: workoutType || "Other", exercises,
      createdAt: timestamp, updatedAt: timestamp};
    // Leave room for PostgreSQL JSONB formatting within its 64 KB payload limit.
    if (new TextEncoder().encode(JSON.stringify(workout)).length > 32000) {
      throw new Error(`The workout on ${date} is too large to import safely.`);
    }
    workouts.push(workout);
  }
  validateRecordArray(logs, isDailyLog, log => log.date);
  validateRecordArray(workouts, isWorkoutSession, workout => workout.id);
  logs.sort((a, b) => a.date.localeCompare(b.date));
  return {logs, workouts, assumedGoalDays};
}
