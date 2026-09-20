import type { DailyLog, WorkoutSession } from "../types/fitness";

export function loggedWorkoutNames(logs: DailyLog[], sessions: WorkoutSession[]): string[] {
  const names = new Map<string, string>();
  for (const record of [...sessions.map(session => ({date: session.date, name: session.type})),
    ...logs.map(log => ({date: log.date, name: log.workoutType}))].sort((a, b) => b.date.localeCompare(a.date))) {
    const name = record.name?.trim();
    if (name && !names.has(name.toLowerCase())) names.set(name.toLowerCase(), name);
  }
  return [...names.values()];
}

export function loggedExercises(type: string, sessions: WorkoutSession[]) {
  const exercises = new Map<string, {name: string; muscleGroup: string}>();
  for (const session of [...sessions].sort((a, b) => b.date.localeCompare(a.date))) {
    if (session.type.trim().toLowerCase() !== type.trim().toLowerCase()) continue;
    for (const exercise of session.exercises) {
      const name = exercise.name.trim();
      if (name && !exercises.has(name.toLowerCase())) {
        exercises.set(name.toLowerCase(), {name, muscleGroup: exercise.muscleGroup ?? ""});
      }
    }
  }
  return [...exercises.values()];
}
