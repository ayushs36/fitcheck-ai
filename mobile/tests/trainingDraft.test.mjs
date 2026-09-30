import { test } from "node:test";
import assert from "node:assert/strict";
import { clearTrainingDraft, loadTrainingDraft, saveTrainingDraft } from "../src/storage/trainingDraft.ts";

function memory() {
  const values = new Map();
  return {
    getItem: async key => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
    removeItem: async key => { values.delete(key); },
  };
}

test("unfinished workouts remain scoped to their storage key and can be cleared", async () => {
  const store = memory();
  const saved = {
    draft: { type: "Push", notes: "", exercises: [] },
    savedExerciseIds: ["exercise-1"],
    activeExerciseId: "exercise-2",
    startedAt: 1_700_000_000_000,
  };
  await saveTrainingDraft(store, "account-a", saved);
  assert.deepEqual(await loadTrainingDraft(store, "account-a"), saved);
  assert.equal(await loadTrainingDraft(store, "account-b"), null);
  await clearTrainingDraft(store, "account-a");
  assert.equal(await loadTrainingDraft(store, "account-a"), null);
});
