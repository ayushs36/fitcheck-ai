import {
  ExerciseDraft,
  ExerciseLog,
  ExerciseSet,
  ExerciseSetDraft,
  WorkoutSession,
  WorkoutDraft,
  WorkoutType,
} from "../types/fitness";
import { ExerciseTemplate } from "../data/exerciseTemplates";
import { parseOptionalNumber } from "./logDraft";

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
    notes: "",
  };
}

export function createBlankExercise(): ExerciseDraft {
  return {
    id: createId("exercise"),
    name: "",
    muscleGroup: "",
    sets: [createBlankSet()],
  };
}

export function createExerciseFromTemplate(template: ExerciseTemplate): ExerciseDraft {
  return {
    id: createId("exercise"),
    name: template.name,
    muscleGroup: template.muscleGroup,
    sets: [
      {
        ...createBlankSet(),
        isBodyweight: Boolean(template.isBodyweight),
      },
    ],
  };
}

export function createBlankWorkoutDraft(type: WorkoutType = "Push"): WorkoutDraft {
  return {
    type,
    exercises: type === "Rest" ? [] : [createBlankExercise()],
    notes: "",
  };
}

export function createWorkoutDraftFromSession(session: WorkoutSession): WorkoutDraft {
  return {
    type: session.type,
    exercises: session.exercises.map((exercise) => ({
      id: createId("exercise"),
      name: exercise.name,
      muscleGroup: exercise.muscleGroup ?? "",
      sets: exercise.sets.length
        ? exercise.sets.map((set) => ({
            id: createId("set"),
            reps: "",
            weightLbs: "",
            isBodyweight: Boolean(set.isBodyweight),
            formFocus: Boolean(set.formFocus),
            notes: "",
          }))
        : [createBlankSet()],
    })),
    notes: "",
  };
}

function setDraftToLog(setDraft: ExerciseSetDraft): ExerciseSet {
  return {
    id: setDraft.id,
    reps: parseOptionalNumber(setDraft.reps),
    weightLbs: setDraft.isBodyweight ? undefined : parseOptionalNumber(setDraft.weightLbs),
    isBodyweight: setDraft.isBodyweight,
    formFocus: setDraft.formFocus,
    notes: setDraft.notes.trim() || undefined,
  };
}

function exerciseDraftToLog(exerciseDraft: ExerciseDraft): ExerciseLog | null {
  const name = exerciseDraft.name.trim();
  if (!name) {
    return null;
  }

  return {
    id: exerciseDraft.id,
    name,
    muscleGroup: exerciseDraft.muscleGroup.trim() || undefined,
    sets: exerciseDraft.sets.map(setDraftToLog),
  };
}

export function createWorkoutSessionFromDraft({
  date,
  draft,
}: {
  date: string;
  draft: WorkoutDraft;
}): WorkoutSession {
  const now = new Date().toISOString();
  const exercises = draft.exercises
    .map(exerciseDraftToLog)
    .filter((exercise): exercise is ExerciseLog => Boolean(exercise));

  return {
    id: createId("workout"),
    date,
    type: draft.type,
    exercises,
    notes: draft.notes.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
}
