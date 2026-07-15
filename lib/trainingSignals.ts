import type { Exercise, ExerciseSignal, LogEntry, TrainingSignal } from "@/types/fitness";
import { calculateExerciseVolume } from "./calculations";

export function getTrainingSignal(logs: LogEntry[]): TrainingSignal {
  const workoutLogs = logs.filter((log) => log.exercises.length > 0);
  const recentWorkoutLogs = workoutLogs.slice(-14);
  const latestWorkout = workoutLogs[workoutLogs.length - 1];
  const previousWorkout = findPreviousMatchingWorkout(workoutLogs);
  const exerciseSignals = getExerciseSignals(latestWorkout, previousWorkout);
  const improvingLifts = exerciseSignals.filter(
    (signal) => signal.status === "Improving"
  );
  const stalledLifts = exerciseSignals.filter(
    (signal) => signal.status === "Stalled" || signal.status === "Stable"
  );
  const decliningLifts = exerciseSignals.filter(
    (signal) => signal.status === "Declining"
  );
  const latestWorkoutVolume = latestWorkout
    ? latestWorkout.exercises.reduce(
        (total, exercise) => total + calculateExerciseVolume(exercise),
        0
      )
    : 0;
  const previousWorkoutVolume = previousWorkout
    ? previousWorkout.exercises.reduce(
        (total, exercise) => total + calculateExerciseVolume(exercise),
        0
      )
    : 0;
  const volumeChange =
    previousWorkoutVolume > 0
      ? ((latestWorkoutVolume - previousWorkoutVolume) / previousWorkoutVolume) *
        100
      : 0;
  const workoutFrequency = recentWorkoutLogs.length;

  if (workoutLogs.length < 2 || exerciseSignals.length === 0) {
    return {
      status: "Need more data",
      score: 0,
      agentAction: "Log repeat exercises",
      workoutFrequency,
      latestWorkoutVolume,
      previousWorkoutVolume,
      volumeChange,
      improvingLifts,
      stalledLifts,
      decliningLifts,
      recommendation:
        "Log at least two workouts with matching exercises so the agent can compare progression.",
    };
  }

  const score = getTrainingScore({
    improving: improvingLifts.length,
    stalled: stalledLifts.length,
    declining: decliningLifts.length,
    workoutFrequency,
    volumeChange,
  });
  const status = getTrainingStatus(score, decliningLifts.length, volumeChange);

  return {
    status,
    score,
    agentAction: getAgentAction(status),
    workoutFrequency,
    latestWorkoutVolume,
    previousWorkoutVolume,
    volumeChange,
    improvingLifts,
    stalledLifts,
    decliningLifts,
    recommendation: getRecommendation(status),
  };
}

function findPreviousMatchingWorkout(workoutLogs: LogEntry[]) {
  const latestWorkout = workoutLogs[workoutLogs.length - 1];

  if (!latestWorkout) {
    return undefined;
  }

  const latestNames = latestWorkout.exercises.map(normalizeName);

  return workoutLogs
    .slice(0, -1)
    .reverse()
    .find((log) =>
      log.exercises.some((exercise) =>
        latestNames.includes(normalizeName(exercise))
      )
    );
}

function getExerciseSignals(
  latestWorkout: LogEntry | undefined,
  previousWorkout: LogEntry | undefined
): ExerciseSignal[] {
  if (!latestWorkout || !previousWorkout) {
    return [];
  }

  return latestWorkout.exercises
    .map((latestExercise) => {
      const previousExercise = previousWorkout.exercises.find(
        (exercise) => normalizeName(exercise) === normalizeName(latestExercise)
      );

      if (!previousExercise) {
        return null;
      }

      return getExerciseSignal(latestExercise, previousExercise);
    })
    .filter((signal): signal is ExerciseSignal => signal !== null);
}

function getExerciseSignal(
  latestExercise: Exercise,
  previousExercise: Exercise
): ExerciseSignal {
  const latestVolume = calculateExerciseVolume(latestExercise);
  const previousVolume = calculateExerciseVolume(previousExercise);
  const volumeChange = latestVolume - previousVolume;
  const latestReps = latestExercise.sets * latestExercise.reps;
  const previousReps = previousExercise.sets * previousExercise.reps;
  const status =
    latestVolume > previousVolume || latestExercise.weight > previousExercise.weight
      ? "Improving"
      : latestVolume < previousVolume && latestReps < previousReps
      ? "Declining"
      : latestVolume === previousVolume
      ? "Stalled"
      : "Stable";

  return {
    name: latestExercise.name,
    status,
    latestVolume,
    previousVolume,
    volumeChange,
    summary: `${latestExercise.name}: ${status.toLowerCase()} compared with the previous matching workout.`,
  };
}

function getTrainingScore({
  improving,
  stalled,
  declining,
  workoutFrequency,
  volumeChange,
}: {
  improving: number;
  stalled: number;
  declining: number;
  workoutFrequency: number;
  volumeChange: number;
}) {
  let score = 55;
  score += Math.min(25, improving * 10);
  score -= Math.min(25, declining * 12);
  score -= Math.min(15, stalled * 4);
  score += workoutFrequency >= 3 ? 10 : -10;

  if (volumeChange < -15) {
    score -= 15;
  } else if (volumeChange > 10) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

function getTrainingStatus(
  score: number,
  decliningCount: number,
  volumeChange: number
): TrainingSignal["status"] {
  if (decliningCount > 1 || volumeChange < -20) {
    return "Recovery risk";
  }

  if (score >= 75) {
    return "Progressing";
  }

  if (score >= 55) {
    return "Stable";
  }

  return "Stalled";
}

function getAgentAction(status: TrainingSignal["status"]) {
  if (status === "Progressing") {
    return "Keep progressing";
  }

  if (status === "Recovery risk") {
    return "Protect recovery";
  }

  if (status === "Stalled") {
    return "Adjust training stimulus";
  }

  if (status === "Stable") {
    return "Maintain and watch next workout";
  }

  return "Log repeat exercises";
}

function getRecommendation(status: TrainingSignal["status"]) {
  if (status === "Progressing") {
    return "Keep the current training approach and avoid unnecessary calorie cuts that could disrupt performance.";
  }

  if (status === "Recovery risk") {
    return "Hold calories steady and prioritize sleep, fatigue management, and repeatable workout performance.";
  }

  if (status === "Stalled") {
    return "Repeat key lifts, keep form consistent, and adjust volume or load only after the next matching workout confirms the stall.";
  }

  if (status === "Stable") {
    return "Maintain the plan and use the next matching workout to confirm whether performance is improving or stalling.";
  }

  return "Log repeat exercises so the agent can compare strength progression over time.";
}

function normalizeName(exercise: Exercise) {
  return exercise.name.toLowerCase().trim();
}
