import { DailyLog, WorkoutSession } from "../types/fitness";
import { formatReadableDate } from "./date";

type LogMetricKey = "weightLbs" | "calories" | "steps";

export type TrendPoint = {
  date: string;
  label: string;
  value: number;
};

export type StrengthPreview = {
  status: string;
  detail: string;
  workoutsLogged: number;
  latestWorkout?: string;
  latestSets?: number;
  latestReps?: number;
  latestWeightedSets?: number;
  latestBodyweightSets?: number;
  latestFormFocusSets?: number;
  direction: "up" | "down" | "flat" | "unknown";
};

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function buildTrendSeries(
  logs: DailyLog[],
  key: LogMetricKey,
  limit = 14,
): TrendPoint[] {
  return logs
    .filter((log) => isNumber(log[key]))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit)
    .map((log) => ({
      date: log.date,
      label: formatReadableDate(log.date),
      value: log[key] as number,
    }));
}

function getWorkoutVolume(session: WorkoutSession): {
  sets: number;
  reps: number;
  weightedSets: number;
  bodyweightSets: number;
  formFocusSets: number;
} {
  return session.exercises.reduce(
    (total, exercise) => {
      const exerciseSets = exercise.sets.length;
      const exerciseReps = exercise.sets.reduce((sum, set) => sum + (set.reps ?? 0), 0);
      const weightedSets = exercise.sets.filter((set) => !set.isBodyweight && set.weightLbs).length;
      const bodyweightSets = exercise.sets.filter((set) => set.isBodyweight).length;
      const formFocusSets = exercise.sets.filter((set) => set.formFocus).length;

      return {
        sets: total.sets + exerciseSets,
        reps: total.reps + exerciseReps,
        weightedSets: total.weightedSets + weightedSets,
        bodyweightSets: total.bodyweightSets + bodyweightSets,
        formFocusSets: total.formFocusSets + formFocusSets,
      };
    },
    { sets: 0, reps: 0, weightedSets: 0, bodyweightSets: 0, formFocusSets: 0 },
  );
}

export function buildStrengthPreview(sessions: WorkoutSession[]): StrengthPreview {
  const loggedWorkouts = sessions
    .filter((session) => session.exercises.length > 0)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  if (loggedWorkouts.length === 0) {
    return {
      status: "No workouts logged yet",
      detail: "Save workouts to start seeing training direction.",
      workoutsLogged: 0,
      direction: "unknown",
    };
  }

  const latestWorkout = loggedWorkouts[0];
  const latestVolume = getWorkoutVolume(latestWorkout);

  if (loggedWorkouts.length === 1) {
    return {
      status: "Need another workout",
      detail: "One workout is saved. Add another similar session to compare progression.",
      workoutsLogged: 1,
      latestWorkout: `${formatReadableDate(latestWorkout.date)} ${latestWorkout.type}`,
      latestSets: latestVolume.sets,
      latestReps: latestVolume.reps,
      latestWeightedSets: latestVolume.weightedSets,
      latestBodyweightSets: latestVolume.bodyweightSets,
      latestFormFocusSets: latestVolume.formFocusSets,
      direction: "unknown",
    };
  }

  const previousVolume = getWorkoutVolume(loggedWorkouts[1]);
  const repDifference = latestVolume.reps - previousVolume.reps;
  const setDifference = latestVolume.sets - previousVolume.sets;
  const formFocusRatio = latestVolume.sets ? latestVolume.formFocusSets / latestVolume.sets : 0;
  const direction =
    Math.abs(repDifference) <= 2 && Math.abs(setDifference) <= 1
      ? "flat"
      : repDifference + setDifference * 4 > 0
        ? "up"
        : "down";

  const status =
    formFocusRatio >= 0.4
      ? "Form-focused session"
      : direction === "up"
        ? "Training volume up"
        : direction === "down"
          ? "Training volume down"
          : "Training volume steady";

  const detail =
    formFocusRatio >= 0.4
      ? "Volume may be lower because many sets were marked form focus."
      : direction === "down"
        ? "Compare this across 2-3 weeks before calling it strength loss."
        : "Use this as a quick signal, not a full strength diagnosis.";

  return {
    status,
    detail,
    workoutsLogged: loggedWorkouts.length,
    latestWorkout: `${formatReadableDate(latestWorkout.date)} ${latestWorkout.type}`,
    latestSets: latestVolume.sets,
    latestReps: latestVolume.reps,
    latestWeightedSets: latestVolume.weightedSets,
    latestBodyweightSets: latestVolume.bodyweightSets,
    latestFormFocusSets: latestVolume.formFocusSets,
    direction,
  };
}
