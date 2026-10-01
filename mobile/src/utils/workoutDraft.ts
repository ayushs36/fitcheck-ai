import {
  ExerciseDraft,
  ExerciseLog,
  ExerciseSet,
  ExerciseSetDraft,
  WorkoutSession,
  WorkoutDraft,
  WorkoutType,
} from "../types/fitness";
import { parseOptionalNumber } from "./logDraft";
import { formatWeightFromLbs, parseWeightToLbs, UnitSystem } from "./units";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlankSet(): ExerciseSetDraft {
  return {
    id: createId("set"),
    reps: "",
    weightLbs: "",
    isBodyweight: false,
    formFocus: false,
    isWarmup: false,
    rir: "",
    notes: "",
  };
}

const DEFAULT_SET_COUNT = 3;

export function hasLoggedSet(exercise: ExerciseDraft) {
  return exercise.sets.some((set) => {
    const reps = Number(set.reps.trim());
    return Number.isInteger(reps) && reps > 0;
  });
}

export function createBlankExercise(): ExerciseDraft {
  return {
    id: createId("exercise"),
    name: "",
    muscleGroup: "",
    // Three rows cover the common working-set flow while remaining fully editable.
    sets: Array.from({length: DEFAULT_SET_COUNT}, () => createBlankSet()),
  };
}

export function createBlankWorkoutDraft(type: WorkoutType = ""): WorkoutDraft {
  return {
    type,
    exercises: type === "Rest" ? [] : [createBlankExercise()],
    notes: "",
  };
}

export function createWorkoutDraftFromSession(
  session: WorkoutSession,
  unitSystem: UnitSystem = "imperial",
): WorkoutDraft {
  return {
    type: session.type,
    exercises: session.exercises.map((exercise) => ({
      id: createId("exercise"),
      name: exercise.name,
      muscleGroup: exercise.muscleGroup ?? "",
      sets: exercise.sets.length
        ? exercise.sets.map((set) => ({
            id: createId("set"),
            reps: typeof set.reps === "number" ? String(set.reps) : "",
            weightLbs: set.isBodyweight ? "" : formatWeightFromLbs(set.weightLbs, unitSystem),
            isBodyweight: Boolean(set.isBodyweight),
            formFocus: Boolean(set.formFocus),
            isWarmup: Boolean(set.isWarmup),
            rir: typeof set.rir === "number" ? String(set.rir) : "",
            notes: set.notes ?? "",
          }))
        : [createBlankSet()],
    })),
    notes: session.notes ?? "",
  };
}

function setDraftToLog(setDraft: ExerciseSetDraft, unitSystem: UnitSystem): ExerciseSet {
  return {
    id: setDraft.id,
    reps: parseOptionalNumber(setDraft.reps),
    weightLbs: setDraft.isBodyweight ? undefined : parseWeightToLbs(setDraft.weightLbs, unitSystem),
    isBodyweight: setDraft.isBodyweight,
    formFocus: setDraft.formFocus,
    isWarmup: setDraft.isWarmup,
    rir: parseOptionalNumber(setDraft.rir),
    notes: setDraft.notes.trim() || undefined,
  };
}

function exerciseDraftToLog(
  exerciseDraft: ExerciseDraft,
  unitSystem: UnitSystem,
): ExerciseLog | null {
  const name = exerciseDraft.name.trim();
  if (!name) {
    return null;
  }

  return {
    id: exerciseDraft.id,
    name,
    muscleGroup: exerciseDraft.muscleGroup.trim() || undefined,
    sets: exerciseDraft.sets.map((setDraft) => setDraftToLog(setDraft, unitSystem)),
  };
}

export function createWorkoutSessionFromDraft({
  date,
  draft,
  unitSystem = "imperial",
  durationSeconds,
}: {
  date: string;
  draft: WorkoutDraft;
  unitSystem?: UnitSystem;
  durationSeconds?: number;
}): WorkoutSession {
  const now = new Date().toISOString();
  const exercises = draft.exercises
    .map((exerciseDraft) => exerciseDraftToLog(exerciseDraft, unitSystem))
    .filter((exercise): exercise is ExerciseLog => Boolean(exercise));

  return {
    id: createId("workout"),
    date,
    type: draft.type.trim(),
    exercises,
    notes: draft.notes.trim() || undefined,
    durationSeconds,
    createdAt: now,
    updatedAt: now,
  };
}
