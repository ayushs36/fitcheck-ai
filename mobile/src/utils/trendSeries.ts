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
  exerciseTrends: ExerciseTrend[];
  latestWorkout?: string;
  latestSets?: number;
  latestReps?: number;
  latestWeightedSets?: number;
  latestBodyweightSets?: number;
  latestFormFocusSets?: number;
  direction: "up" | "down" | "flat" | "unknown";
};

export type ExerciseTrend = {
  name: string;
  status: "Improving" | "Stable" | "Lower output" | "Form focus" | "Need more data";
  basis: "load-volume" | "reps";
  latestDate: string;
  previousDate?: string;
  latestScore: number;
  previousScore?: number;
  change?: number;
  summary: string;
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

function normalizeExerciseName(name: string) {
  return name.trim().toLowerCase();
}

function getExerciseScore(exercise: WorkoutSession["exercises"][number]): {
  basis: ExerciseTrend["basis"];
  score: number;
  formFocusRatio: number;
} {
  const totals = exercise.sets.reduce(
    (total, set) => {
      const reps = set.reps ?? 0;
      const weightedVolume = !set.isBodyweight && set.weightLbs ? reps * set.weightLbs : 0;

      return {
        reps: total.reps + reps,
        weightedVolume: total.weightedVolume + weightedVolume,
        formFocusSets: total.formFocusSets + (set.formFocus ? 1 : 0),
        sets: total.sets + 1,
      };
    },
    { reps: 0, weightedVolume: 0, formFocusSets: 0, sets: 0 },
  );
  const basis: ExerciseTrend["basis"] = totals.weightedVolume > 0 ? "load-volume" : "reps";

  return {
    basis,
    score: basis === "load-volume" ? totals.weightedVolume : totals.reps,
    formFocusRatio: totals.sets ? totals.formFocusSets / totals.sets : 0,
  };
}

export function buildExerciseTrends(sessions: WorkoutSession[]): ExerciseTrend[] {
  const exerciseHistory = new Map<
    string,
    { name: string; date: string; exercise: WorkoutSession["exercises"][number] }[]
  >();

  sessions
    .filter((session) => session.exercises.length > 0)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((session) => {
      session.exercises.forEach((exercise) => {
        const exerciseName = exercise.name.trim();
        const normalizedName = normalizeExerciseName(exerciseName);

        if (!normalizedName) {
          return;
        }

        const history = exerciseHistory.get(normalizedName) ?? [];
        history.push({ name: exerciseName, date: session.date, exercise });
        exerciseHistory.set(normalizedName, history);
      });
    });

  return Array.from(exerciseHistory.values())
    .map((history): ExerciseTrend => {
      const [latest, previous] = history;
      const latestScore = getExerciseScore(latest.exercise);

      if (!previous) {
        return {
          name: latest.name,
          status: "Need more data",
          basis: latestScore.basis,
          latestDate: formatReadableDate(latest.date),
          latestScore: Math.round(latestScore.score),
          summary: "Log this exercise again to compare progress.",
        };
      }

      const previousScore = getExerciseScore(previous.exercise);
      const change = latestScore.score - previousScore.score;
      const changePercent =
        previousScore.score > 0 ? Math.abs(change) / previousScore.score : 0;
      const status =
        latestScore.formFocusRatio >= 0.4
          ? "Form focus"
          : changePercent <= 0.05
            ? "Stable"
            : change > 0
              ? "Improving"
              : "Lower output";

      return {
        name: latest.name,
        status,
        basis: latestScore.basis,
        latestDate: formatReadableDate(latest.date),
        previousDate: formatReadableDate(previous.date),
        latestScore: Math.round(latestScore.score),
        previousScore: Math.round(previousScore.score),
        change: Math.round(change),
        summary:
          status === "Form focus"
            ? "Lighter output may be intentional technique work."
            : status === "Lower output"
              ? "Compare across 2-3 weeks before calling this strength loss."
              : status === "Improving"
                ? "Latest logged output is higher than the prior matching session."
                : "Latest output is close to the prior matching session.",
      };
    })
    .sort((a, b) => {
      const statusWeight = { Improving: 0, "Form focus": 1, "Lower output": 2, Stable: 3, "Need more data": 4 };
      return statusWeight[a.status] - statusWeight[b.status];
    })
    .slice(0, 4);
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
      exerciseTrends: [],
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
      exerciseTrends: buildExerciseTrends(loggedWorkouts),
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
    exerciseTrends: buildExerciseTrends(loggedWorkouts),
    latestWorkout: `${formatReadableDate(latestWorkout.date)} ${latestWorkout.type}`,
    latestSets: latestVolume.sets,
    latestReps: latestVolume.reps,
    latestWeightedSets: latestVolume.weightedSets,
    latestBodyweightSets: latestVolume.bodyweightSets,
    latestFormFocusSets: latestVolume.formFocusSets,
    direction,
  };
}
