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
  workoutsLogged: number;
  latestWorkout?: string;
  latestSets?: number;
  latestReps?: number;
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

function getWorkoutVolume(session: WorkoutSession): { sets: number; reps: number } {
  return session.exercises.reduce(
    (total, exercise) => {
      const exerciseSets = exercise.sets.length;
      const exerciseReps = exercise.sets.reduce((sum, set) => sum + (set.reps ?? 0), 0);

      return {
        sets: total.sets + exerciseSets,
        reps: total.reps + exerciseReps,
      };
    },
    { sets: 0, reps: 0 },
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
      workoutsLogged: 0,
      direction: "unknown",
    };
  }

  const latestWorkout = loggedWorkouts[0];
  const latestVolume = getWorkoutVolume(latestWorkout);

  if (loggedWorkouts.length === 1) {
    return {
      status: "Need another workout",
      workoutsLogged: 1,
      latestWorkout: `${formatReadableDate(latestWorkout.date)} ${latestWorkout.type}`,
      latestSets: latestVolume.sets,
      latestReps: latestVolume.reps,
      direction: "unknown",
    };
  }

  const previousVolume = getWorkoutVolume(loggedWorkouts[1]);
  const repDifference = latestVolume.reps - previousVolume.reps;
  const direction =
    Math.abs(repDifference) <= 2 ? "flat" : repDifference > 0 ? "up" : "down";

  return {
    status:
      direction === "up"
        ? "Training volume up"
        : direction === "down"
          ? "Training volume down"
          : "Training volume steady",
    workoutsLogged: loggedWorkouts.length,
    latestWorkout: `${formatReadableDate(latestWorkout.date)} ${latestWorkout.type}`,
    latestSets: latestVolume.sets,
    latestReps: latestVolume.reps,
    direction,
  };
}
