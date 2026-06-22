import type { Exercise } from "@/types/fitness";

export function calculateExerciseVolume(exercise: Exercise) {
  return exercise.sets * exercise.reps * exercise.weight;
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + Math.ceil(days));
  return copy;
}

export function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}