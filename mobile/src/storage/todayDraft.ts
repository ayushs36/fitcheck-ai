import type { TodayLogDraft } from "../types/fitness.ts";

type DraftStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem?(key: string): Promise<void>;
};

type SavedTodayDraft = {
  date: string;
  draft: TodayLogDraft;
};

const draftWrites = new WeakMap<DraftStorage, Map<string, Promise<void>>>();

export const localTodayDraftKey = "fitcheck-mobile:today-draft:v1";

export function accountTodayDraftKey(accountKey: string) {
  return `${accountKey}:today-draft:v1`;
}

function isDraft(value: unknown): value is TodayLogDraft {
  if (!value || typeof value !== "object") {
    return false;
  }

  const draft = value as Record<string, unknown>;
  return ["goal", "weightLbs", "calories", "proteinGrams", "steps", "workoutType", "notes"].every(
    (key) => typeof draft[key] === "string",
  );
}

function copyDraft(draft: TodayLogDraft): TodayLogDraft {
  return {
    goal: draft.goal,
    weightLbs: draft.weightLbs,
    calories: draft.calories,
    proteinGrams: draft.proteinGrams,
    steps: draft.steps,
    workoutType: draft.workoutType,
    notes: draft.notes,
  };
}

function queue(storage: DraftStorage, key: string, action: () => Promise<void>) {
  let writes = draftWrites.get(storage);
  if (!writes) {
    writes = new Map();
    draftWrites.set(storage, writes);
  }

  const next = (writes.get(key) ?? Promise.resolve()).then(action);
  writes.set(key, next.catch(() => undefined));
  return next;
}

export async function loadTodayDraft(storage: DraftStorage, key: string, date: string) {
  const raw = await storage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SavedTodayDraft;
    if (parsed.date !== date || !isDraft(parsed.draft)) {
      return null;
    }

    return copyDraft(parsed.draft);
  } catch {
    return null;
  }
}

export function saveTodayDraft(
  storage: DraftStorage,
  key: string,
  date: string,
  draft: TodayLogDraft,
) {
  const value = JSON.stringify({ date, draft: copyDraft(draft) });
  return queue(storage, key, async () => {
    await storage.setItem(key, value);
  });
}

export function clearTodayDraft(storage: DraftStorage, key: string) {
  return queue(storage, key, async () => {
    if (storage.removeItem) {
      await storage.removeItem(key);
      return;
    }

    await storage.setItem(key, "");
  });
}
