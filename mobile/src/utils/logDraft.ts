import { DailyLog, GoalType, TodayLogDraft, WorkoutType } from "../types/fitness";
import { formatWeightFromLbs, parseWeightToLbs, UnitSystem } from "./units";

export const blankTodayDraft: TodayLogDraft = {
  goal: "maintain",
  weightLbs: "",
  calories: "",
  proteinGrams: "",
  steps: "",
  waistInches: "",
  chestInches: "",
  hipInches: "",
  workoutType: "",
  notes: "",
};

export function formatOptionalNumber(value?: number): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

export function parseOptionalNumber(value: string): number | undefined {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return undefined;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

export function dailyLogToDraft(log?: DailyLog, unitSystem: UnitSystem = "imperial"): TodayLogDraft {
  if (!log) {
    return blankTodayDraft;
  }

  return {
    goal: log.goal,
    weightLbs: formatWeightFromLbs(log.weightLbs, unitSystem),
    calories: formatOptionalNumber(log.calories),
    proteinGrams: formatOptionalNumber(log.proteinGrams),
    steps: formatOptionalNumber(log.steps),
    waistInches: formatOptionalNumber(log.measurements?.waistInches),
    chestInches: formatOptionalNumber(log.measurements?.chestInches),
    hipInches: formatOptionalNumber(log.measurements?.hipInches),
    workoutType: log.workoutType ?? "",
    notes: log.notes ?? "",
  };
}

export function createDailyLogFromDraft({
  date,
  draft,
  existingLog,
  unitSystem = "imperial",
}: {
  date: string;
  draft: TodayLogDraft;
  existingLog?: DailyLog;
  unitSystem?: UnitSystem;
}): DailyLog {
  const now = new Date().toISOString();

  const measurements = {
    waistInches: parseOptionalNumber(draft.waistInches),
    chestInches: parseOptionalNumber(draft.chestInches),
    hipInches: parseOptionalNumber(draft.hipInches),
  };

  return {
    id: existingLog?.id ?? date,
    date,
    goal: draft.goal as GoalType,
    weightLbs: parseWeightToLbs(draft.weightLbs, unitSystem),
    calories: parseOptionalNumber(draft.calories),
    proteinGrams: parseOptionalNumber(draft.proteinGrams),
    steps: parseOptionalNumber(draft.steps),
    measurements: Object.values(measurements).some(value => typeof value === "number")
      ? measurements
      : undefined,
    workoutType: draft.workoutType.trim().toLowerCase() === "rest" ? "Rest" : draft.workoutType.trim() || undefined,
    notes: draft.notes.trim() || undefined,
    createdAt: existingLog?.createdAt ?? now,
    updatedAt: now,
  };
}
