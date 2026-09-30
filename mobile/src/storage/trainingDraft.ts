import type { WorkoutDraft } from "../types/fitness";

type DraftStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem?(key: string): Promise<void>;
};

export type SavedTrainingDraft = {
  draft: WorkoutDraft;
  savedExerciseIds: string[];
  activeExerciseId: string | null;
  startedAt: number | null;
};

export const localTrainingDraftKey = "fitcheck-mobile:training-draft:v1";

export function accountTrainingDraftKey(accountKey: string) {
  return `${accountKey}:training-draft:v1`;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isDraft(value: unknown): value is SavedTrainingDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Record<string, unknown>;
  if (!draft.draft || typeof draft.draft !== "object") return false;
  const workout = draft.draft as Record<string, unknown>;
  return isString(workout.type) && isString(workout.notes) && Array.isArray(workout.exercises)
    && Array.isArray(draft.savedExerciseIds) && draft.savedExerciseIds.every(isString)
    && (draft.activeExerciseId === null || isString(draft.activeExerciseId))
    && (draft.startedAt === null || (typeof draft.startedAt === "number" && Number.isFinite(draft.startedAt)));
}

export async function loadTrainingDraft(storage: DraftStorage, key: string) {
  const raw = await storage.getItem(key);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return isDraft(value) ? value : null;
  } catch {
    return null;
  }
}

export function saveTrainingDraft(storage: DraftStorage, key: string, draft: SavedTrainingDraft) {
  return storage.setItem(key, JSON.stringify(draft));
}

export function clearTrainingDraft(storage: DraftStorage, key: string) {
  return storage.removeItem ? storage.removeItem(key) : storage.setItem(key, "");
}
