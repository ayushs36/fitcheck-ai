import type { ExerciseSet, ExerciseTarget, WorkoutSession } from "../types/fitness.ts";

export function exerciseKey(name: string, mode: ExerciseTarget["mode"]): string {
  return `${name.trim().toLowerCase().replace(/\s+/g, " ")}:${mode}`;
}

export function buildExerciseProgression(sessions: WorkoutSession[], name: string, mode: ExerciseTarget["mode"], beforeDate?: string) {
  const key = exerciseKey(name, mode);
  // Editing a saved workout must not use that workout as its own comparison.
  const history = sessions.filter(session => !beforeDate || session.date < beforeDate)
    .slice().sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .flatMap(session => {
      const sets = session.exercises.filter(exercise => exerciseKey(exercise.name, mode) === key)
        .flatMap(exercise => exercise.sets)
        .filter(set => (mode === "bodyweight" ? set.isBodyweight : !set.isBodyweight)
          && typeof set.reps === "number" && Number.isInteger(set.reps) && set.reps > 0);
      if (!sets.length) return [];
      const working = sets.filter(set => !set.isWarmup && !set.formFocus &&
        (mode === "bodyweight" || (typeof set.weightLbs === "number" && Number.isFinite(set.weightLbs) && set.weightLbs > 0)));
      return [{ sessionId: session.id, date: session.date, type: session.type, sets, working,
        warmups: sets.filter(set => set.isWarmup).length,
        formSets: sets.filter(set => set.formFocus && !set.isWarmup).length }];
    });
  const records = new Map<number, { reps: number; date: string }>();
  for (const session of history) for (const set of session.working) {
    const load = mode === "bodyweight" ? 0 : Math.round(set.weightLbs! * 1000) / 1000;
    if (!records.has(load) || records.get(load)!.reps < set.reps!) records.set(load, { reps: set.reps!, date: session.date });
  }
  const latest = history.find(session => session.working.length);
  const best: ExerciseSet | undefined = latest?.working.slice().sort((a, b) =>
    (mode === "weighted" ? (b.weightLbs! - a.weightLbs!) : 0) || b.reps! - a.reps!)[0];
  const suggestion: ExerciseTarget | undefined = best ? {
    key, name: name.trim(), mode, reps: best.reps! + 1,
    ...(mode === "weighted" ? { weightLbs: best.weightLbs } : {}),
  } : undefined;
  return { history, suggestion, records: [...records].sort(([a], [b]) => b - a).map(([load, value]) => ({ load, ...value })) };
}

export function saveExerciseTarget(targets: ExerciseTarget[], target: ExerciseTarget): ExerciseTarget[] {
  if (!target.name.trim() || !Number.isInteger(target.reps) || target.reps < 1 || target.reps > 1000
    || (target.mode === "weighted" && (typeof target.weightLbs !== "number" || !Number.isFinite(target.weightLbs) || target.weightLbs <= 0))) {
    throw new Error("Enter a positive whole-number rep target and a positive load for weighted sets.");
  }
  if (targets.length >= 100 && !targets.some(item => item.key === target.key)) throw new Error("Remove an unused exercise target before adding another.");
  return [...targets.filter(item => item.key !== target.key), target];
}
