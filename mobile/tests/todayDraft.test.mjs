import { test } from "node:test";
import assert from "node:assert/strict";
import { clearTodayDraft, loadTodayDraft, saveTodayDraft } from "../src/storage/todayDraft.ts";

const date = "2026-09-20";
const draft = {
  goal: "cut",
  weightLbs: "136.4",
  calories: "2200",
  proteinGrams: "140",
  steps: "9000",
  workoutType: "Push",
  notes: "Good energy",
};

function memory() {
  const values = new Map();
  return {
    values,
    getItem: async key => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
    removeItem: async key => { values.delete(key); },
  };
}

test("today drafts are restored only for their matching date", async () => {
  const store = memory();
  await saveTodayDraft(store, "draft", date, draft);
  assert.deepEqual(await loadTodayDraft(store, "draft", date), draft);
  assert.equal(await loadTodayDraft(store, "draft", "2026-09-21"), null);
});

test("newer draft writes cannot be overwritten by earlier queued writes", async () => {
  const store = memory();
  const first = saveTodayDraft(store, "draft", date, {...draft, calories: "2100"});
  const second = saveTodayDraft(store, "draft", date, {...draft, calories: "2300"});
  await Promise.all([first, second]);
  assert.equal((await loadTodayDraft(store, "draft", date))?.calories, "2300");
});

test("clearing a saved log draft removes it", async () => {
  const store = memory();
  await saveTodayDraft(store, "draft", date, draft);
  await clearTodayDraft(store, "draft");
  assert.equal(await loadTodayDraft(store, "draft", date), null);
});
