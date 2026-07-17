import type { Exercise } from "@/types/fitness";

export function calculateExerciseVolume(exercise: Exercise) {
  return exercise.sets * exercise.reps * exercise.weight;
}

export function calculateExerciseTrainingOutput(exercise: Exercise) {
  const weightedVolume = calculateExerciseVolume(exercise);

  if (weightedVolume > 0) {
    return weightedVolume;
  }

  return exercise.sets * exercise.reps;
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + Math.ceil(days));
  return copy;
}

export function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
