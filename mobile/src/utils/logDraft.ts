import { DailyLog, GoalType, TodayLogDraft, WorkoutType } from "../types/fitness";

export const blankTodayDraft: TodayLogDraft = {
  goal: "maintain",
  weightLbs: "",
  calories: "",
  proteinGrams: "",
  steps: "",
  workoutType: "Rest",
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

export function dailyLogToDraft(log?: DailyLog): TodayLogDraft {
  if (!log) {
    return blankTodayDraft;
  }

  return {
    goal: log.goal,
    weightLbs: formatOptionalNumber(log.weightLbs),
    calories: formatOptionalNumber(log.calories),
    proteinGrams: formatOptionalNumber(log.proteinGrams),
    steps: formatOptionalNumber(log.steps),
    workoutType: log.workoutType ?? "Rest",
    notes: log.notes ?? "",
  };
}

export function createDailyLogFromDraft({
  date,
  draft,
  existingLog,
}: {
  date: string;
  draft: TodayLogDraft;
  existingLog?: DailyLog;
}): DailyLog {
  const now = new Date().toISOString();

  return {
    id: existingLog?.id ?? date,
    date,
    goal: draft.goal as GoalType,
    weightLbs: parseOptionalNumber(draft.weightLbs),
    calories: parseOptionalNumber(draft.calories),
    proteinGrams: parseOptionalNumber(draft.proteinGrams),
    steps: parseOptionalNumber(draft.steps),
    workoutType: draft.workoutType as WorkoutType,
    notes: draft.notes.trim() || undefined,
    createdAt: existingLog?.createdAt ?? now,
    updatedAt: now,
  };
}
