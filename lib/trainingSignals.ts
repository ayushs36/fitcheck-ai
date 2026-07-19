import type {
  Exercise,
  ExerciseHistorySummary,
  ExerciseSignal,
  LogEntry,
  TrainingSignal,
  WorkoutTypeTrend,
} from "@/types/fitness";
import { calculateExerciseTrainingOutput } from "./calculations";

const TRAINING_TREND_WINDOW_DAYS = 21;

export function getTrainingSignal(logs: LogEntry[]): TrainingSignal {
  const workoutLogs = logs.filter((log) => log.exercises.length > 0);
  const recentWorkoutLogs = workoutLogs.slice(-14);
  const latestWorkout = workoutLogs[workoutLogs.length - 1];
  const previousWorkout = findPreviousMatchingWorkout(workoutLogs);
  const exerciseSignals = getExerciseSignals(latestWorkout, previousWorkout);
  const exerciseHistory = getExerciseHistory(workoutLogs);
  const recentPrs = getRecentPrs(exerciseHistory);
  const regressions = getRegressionWatchList(exerciseHistory);
  const workoutTypeTrends = getWorkoutTypeTrends(workoutLogs);
  const trendSignals = getRecentExerciseSignals(
    workoutLogs,
    TRAINING_TREND_WINDOW_DAYS
  );
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
        (total, exercise) => total + calculateExerciseTrainingOutput(exercise),
        0
      )
    : 0;
  const previousWorkoutVolume = previousWorkout
    ? previousWorkout.exercises.reduce(
        (total, exercise) => total + calculateExerciseTrainingOutput(exercise),
        0
      )
    : 0;
  const volumeChange =
    previousWorkoutVolume > 0
      ? ((latestWorkoutVolume - previousWorkoutVolume) / previousWorkoutVolume) *
        100
      : 0;
  const workoutFrequency = recentWorkoutLogs.length;
  const weeklyComparisonCount = trendSignals.length;
  const weeklyDeclineRate =
    weeklyComparisonCount > 0
      ? trendSignals.filter((signal) => signal.status === "Declining").length /
        weeklyComparisonCount
      : 0;

  if (workoutLogs.length < 2 || exerciseSignals.length === 0) {
    return {
      status: "Need more data",
      score: 0,
      agentAction: "Log repeat exercises",
      workoutFrequency,
      latestWorkoutVolume,
      previousWorkoutVolume,
      volumeChange,
      weeklyDeclineRate,
      weeklyComparisonCount,
      recentPrs,
      regressions,
      exerciseHistory,
      workoutTypeTrends,
      agentTrainingInsight: getAgentTrainingInsight({
        status: "Need more data",
        recentPrs,
        regressions,
        workoutTypeTrends,
      }),
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
    weeklyDeclineRate,
    weeklyComparisonCount,
  });
  const status = getTrainingStatus({
    score,
    latestDecliningCount: decliningLifts.length,
    latestComparisonCount: exerciseSignals.length,
    volumeChange,
    weeklyDeclineRate,
    weeklyComparisonCount,
  });
  const agentTrainingInsight = getAgentTrainingInsight({
    status,
    recentPrs,
    regressions,
    workoutTypeTrends,
  });

  return {
    status,
    score,
    agentAction: getAgentAction(status),
    workoutFrequency,
    latestWorkoutVolume,
    previousWorkoutVolume,
    volumeChange,
    weeklyDeclineRate,
    weeklyComparisonCount,
    recentPrs,
    regressions,
    exerciseHistory,
    workoutTypeTrends,
    agentTrainingInsight,
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

function getRecentExerciseSignals(
  workoutLogs: LogEntry[],
  windowDays: number
): ExerciseSignal[] {
  const latestWorkout = workoutLogs[workoutLogs.length - 1];

  if (!latestWorkout) {
    return [];
  }

  const latestDate = parseLogDate(latestWorkout.date);
  const windowStart = new Date(latestDate);
  windowStart.setDate(latestDate.getDate() - windowDays + 1);

  return workoutLogs
    .map((workout, index) => {
      const workoutDate = parseLogDate(workout.date);

      if (workoutDate < windowStart) {
        return [];
      }

      const previousWorkout = findPreviousWorkoutForLog(workoutLogs, index);

      return getExerciseSignals(workout, previousWorkout);
    })
    .flat();
}

function findPreviousWorkoutForLog(workoutLogs: LogEntry[], index: number) {
  const workout = workoutLogs[index];

  if (!workout) {
    return undefined;
  }

  const names = workout.exercises.map(normalizeName);

  return workoutLogs
    .slice(0, index)
    .reverse()
    .find((previousWorkout) =>
      previousWorkout.exercises.some((exercise) =>
        names.includes(normalizeName(exercise))
      )
    );
}

function getExerciseSignal(
  latestExercise: Exercise,
  previousExercise: Exercise
): ExerciseSignal {
  const latestVolume = calculateExerciseTrainingOutput(latestExercise);
  const previousVolume = calculateExerciseTrainingOutput(previousExercise);
  const volumeChange = latestVolume - previousVolume;
  const latestReps = latestExercise.sets * latestExercise.reps;
  const previousReps = previousExercise.sets * previousExercise.reps;
  const isBodyweightExercise =
    latestExercise.weight <= 0 && previousExercise.weight <= 0;
  const status =
    isBodyweightExercise
      ? getBodyweightExerciseStatus(latestReps, previousReps)
      : getWeightedExerciseStatus({
          latestVolume,
          previousVolume,
          latestWeight: latestExercise.weight,
          previousWeight: previousExercise.weight,
          latestReps,
          previousReps,
        });

  return {
    name: latestExercise.name,
    status,
    progressionBasis: isBodyweightExercise ? "Bodyweight reps" : "Load/volume",
    latestVolume,
    previousVolume,
    volumeChange,
    latestTotalReps: latestReps,
    previousTotalReps: previousReps,
    repChange: latestReps - previousReps,
    summary: isBodyweightExercise
      ? `${latestExercise.name}: ${status.toLowerCase()} based on total reps compared with the previous matching workout.`
      : `${latestExercise.name}: ${status.toLowerCase()} based on load and volume compared with the previous matching workout.`,
  };
}

function getBodyweightExerciseStatus(
  latestReps: number,
  previousReps: number
): ExerciseSignal["status"] {
  if (latestReps > previousReps) {
    return "Improving";
  }

  if (latestReps < previousReps) {
    return "Declining";
  }

  return "Stalled";
}

function getWeightedExerciseStatus({
  latestVolume,
  previousVolume,
  latestWeight,
  previousWeight,
  latestReps,
  previousReps,
}: {
  latestVolume: number;
  previousVolume: number;
  latestWeight: number;
  previousWeight: number;
  latestReps: number;
  previousReps: number;
}): ExerciseSignal["status"] {
  if (latestVolume > previousVolume || latestWeight > previousWeight) {
    return "Improving";
  }

  if (latestVolume < previousVolume && latestReps < previousReps) {
    return "Declining";
  }

  if (latestVolume === previousVolume) {
    return "Stalled";
  }

  return "Stable";
}

function getExerciseHistory(workoutLogs: LogEntry[]): ExerciseHistorySummary[] {
  const exerciseMap = new Map<
    string,
    Array<{
      date: string;
      name: string;
      weight: number;
      totalReps: number;
      output: number;
    }>
  >();

  workoutLogs.forEach((log) => {
    log.exercises.forEach((exercise) => {
      const name = exercise.name.trim();

      if (!name) {
        return;
      }

      const key = name.toLowerCase();
      const current = exerciseMap.get(key) ?? [];
      current.push({
        date: log.date,
        name,
        weight: exercise.weight,
        totalReps: exercise.sets * exercise.reps,
        output: calculateExerciseTrainingOutput(exercise),
      });
      exerciseMap.set(key, current);
    });
  });

  return Array.from(exerciseMap.values())
    .map((sessions) => {
      const sortedSessions = sessions.sort((a, b) => a.date.localeCompare(b.date));
      const latest = sortedSessions[sortedSessions.length - 1];
      const previous = sortedSessions[sortedSessions.length - 2];
      const previousOutput = previous?.output ?? 0;
      const outputChange = previous ? latest.output - previous.output : 0;

      return {
        name: latest.name,
        sessions: sortedSessions.length,
        lastLoggedDate: latest.date,
        bestWeight: Math.max(...sortedSessions.map((session) => session.weight)),
        bestTotalReps: Math.max(
          ...sortedSessions.map((session) => session.totalReps)
        ),
        bestOutput: Math.max(...sortedSessions.map((session) => session.output)),
        latestOutput: latest.output,
        previousOutput,
        outputChange,
        trend: getExerciseHistoryTrend(latest.output, previousOutput, previous),
      };
    })
    .sort((a, b) => b.lastLoggedDate.localeCompare(a.lastLoggedDate));
}

function getRecentPrs(exerciseHistory: ExerciseHistorySummary[]) {
  return exerciseHistory
    .filter(
      (exercise) =>
        exercise.sessions > 1 &&
        exercise.latestOutput >= exercise.bestOutput &&
        exercise.outputChange > 0
    )
    .slice(0, 4)
    .map((exercise) =>
      exercise.bestWeight > 0
        ? `${exercise.name}: best output ${exercise.bestOutput.toFixed(0)}`
        : `${exercise.name}: best bodyweight reps ${exercise.bestTotalReps}`
    );
}

function getRegressionWatchList(exerciseHistory: ExerciseHistorySummary[]) {
  return exerciseHistory
    .filter(
      (exercise) => exercise.sessions >= 2 && exercise.trend === "Regressing"
    )
    .slice(0, 4)
    .map(
      (exercise) =>
        `${exercise.name}: output down ${Math.abs(exercise.outputChange).toFixed(
          0
        )} from last logged session`
    );
}

function getWorkoutTypeTrends(workoutLogs: LogEntry[]): WorkoutTypeTrend[] {
  const workoutMap = new Map<
    string,
    Array<{
      workout: string;
      date: string;
      output: number;
    }>
  >();

  workoutLogs.forEach((log) => {
    const workout = log.workout.trim() || "Workout";
    const key = workout.toLowerCase();
    const current = workoutMap.get(key) ?? [];
    current.push({
      workout,
      date: log.date,
      output: log.exercises.reduce(
        (total, exercise) => total + calculateExerciseTrainingOutput(exercise),
        0
      ),
    });
    workoutMap.set(key, current);
  });

  return Array.from(workoutMap.values())
    .map((sessions) => {
      const sortedSessions = sessions.sort((a, b) => a.date.localeCompare(b.date));
      const latest = sortedSessions[sortedSessions.length - 1];
      const previous = sortedSessions[sortedSessions.length - 2];
      const previousOutput = previous?.output ?? 0;
      const outputChange = previous ? latest.output - previous.output : 0;

      return {
        workout: latest.workout,
        sessions: sortedSessions.length,
        latestOutput: latest.output,
        previousOutput,
        outputChange,
        trend: getWorkoutTypeTrend(latest.output, previousOutput, previous),
      };
    })
    .sort((a, b) => b.sessions - a.sessions);
}

function getExerciseHistoryTrend(
  latestOutput: number,
  previousOutput: number,
  previousSession:
    | {
        output: number;
      }
    | undefined
): ExerciseHistorySummary["trend"] {
  if (!previousSession) {
    return "Need more data";
  }

  if (latestOutput > previousOutput) {
    return "Improving";
  }

  if (latestOutput < previousOutput) {
    return "Regressing";
  }

  return "Stable";
}

function getWorkoutTypeTrend(
  latestOutput: number,
  previousOutput: number,
  previousSession:
    | {
        output: number;
      }
    | undefined
): WorkoutTypeTrend["trend"] {
  if (!previousSession) {
    return "Need more data";
  }

  if (latestOutput > previousOutput) {
    return "Up";
  }

  if (latestOutput < previousOutput) {
    return "Down";
  }

  return "Flat";
}

function getAgentTrainingInsight({
  status,
  recentPrs,
  regressions,
  workoutTypeTrends,
}: {
  status: TrainingSignal["status"];
  recentPrs: string[];
  regressions: string[];
  workoutTypeTrends: WorkoutTypeTrend[];
}) {
  if (recentPrs.length > 0 && status !== "Recovery risk") {
    return `FitCheck noticed recent strength progress: ${recentPrs[0]}. Keep the plan steady unless recovery changes.`;
  }

  if (status === "Technique watch") {
    return "FitCheck sees a short-term output drop without enough 2-3 week evidence to call it strength loss. Confirm whether this was intentional form work.";
  }

  if (regressions.length > 0) {
    return `FitCheck is watching ${regressions[0]}. Do not overreact unless it repeats across the next matching workout.`;
  }

  const risingWorkout = workoutTypeTrends.find((trend) => trend.trend === "Up");

  if (risingWorkout) {
    return `${risingWorkout.workout} output is trending up compared with the last matching workout.`;
  }

  return "FitCheck is building training history. Repeat key exercises consistently so the agent can judge progression.";
}

function getTrainingScore({
  improving,
  stalled,
  declining,
  workoutFrequency,
  volumeChange,
  weeklyDeclineRate,
  weeklyComparisonCount,
}: {
  improving: number;
  stalled: number;
  declining: number;
  workoutFrequency: number;
  volumeChange: number;
  weeklyDeclineRate: number;
  weeklyComparisonCount: number;
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

  if (weeklyComparisonCount >= 3 && weeklyDeclineRate >= 0.5) {
    score -= 15;
  }

  return Math.max(0, Math.min(100, score));
}

function getTrainingStatus({
  score,
  latestDecliningCount,
  latestComparisonCount,
  volumeChange,
  weeklyDeclineRate,
  weeklyComparisonCount,
}: {
  score: number;
  latestDecliningCount: number;
  latestComparisonCount: number;
  volumeChange: number;
  weeklyDeclineRate: number;
  weeklyComparisonCount: number;
}): TrainingSignal["status"] {
  const sustainedDecline =
    weeklyComparisonCount >= 3 && weeklyDeclineRate >= 0.5;
  const latestOnlyDrop =
    latestComparisonCount > 0 &&
    latestDecliningCount > 0 &&
    !sustainedDecline;

  if (sustainedDecline || (volumeChange < -25 && weeklyDeclineRate >= 0.4)) {
    return "Recovery risk";
  }

  if (latestOnlyDrop) {
    return "Technique watch";
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

  if (status === "Technique watch") {
    return "Check intent before judging strength";
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
    return "Performance has declined across recent repeat-exercise comparisons. Hold calories steady and prioritize sleep, fatigue management, and repeatable workout performance.";
  }

  if (status === "Technique watch") {
    return "The latest workout dipped, but the 2-3 week trend does not confirm strength loss yet. Treat this as possible form or technique work unless the drop repeats.";
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

function parseLogDate(date: string) {
  return new Date(`${date}T00:00:00`);
}
