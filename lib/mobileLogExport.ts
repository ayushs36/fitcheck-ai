import type {Goal, GoalHistoryRecord, LogEntry} from "../types/fitness";

export function createMobileLogExport(logs: LogEntry[], goal: Goal, goalHistory: GoalHistoryRecord[], exportedAt: string) {
  const history = [...goalHistory].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const entries = logs.map(log => {
    const phase = history.filter(item => item.startedAt.slice(0, 10) <= log.date
      && (!item.endedAt || item.endedAt.slice(0, 10) >= log.date)).at(-1);
    return {date: log.date, weight: log.weight, calories: log.calories, protein: log.protein,
      steps: log.steps, workout: log.workout, exercises: log.exercises.map(exercise => ({
        name: exercise.name, sets: exercise.sets, reps: exercise.reps, weight: exercise.weight,
      })), goal: phase?.goal ?? goal, goalAssumed: !phase};
  });
  return JSON.stringify({format: "fitcheck-personal-logs", version: 1, units: "lb", exportedAt, logs: entries}, null, 2);
}
