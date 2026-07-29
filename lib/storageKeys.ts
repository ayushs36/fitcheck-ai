export const PERSONAL_STORAGE_KEYS = {
  logs: "fitcheck-personal-logs-v1",
  settings: "fitcheck-personal-settings-v1",
  aiHistory: "fitcheck-personal-ai-history-v1",
  agentHistory: "fitcheck-personal-agent-history-v1",
  goalAdaptationHistory: "fitcheck-personal-goal-adaptation-history-v1",
  coachingPlanHistory: "fitcheck-personal-coaching-plan-history-v1",
  editLogId: "fitcheck-personal-edit-log-id-v1",
  dailyLogDraft: "fitcheck-personal-daily-log-draft-v1",
} as const;

export const DEMO_STORAGE_KEYS = {
  logs: "fitcheck-demo-logs-v1",
  settings: "fitcheck-demo-settings-v1",
  aiHistory: "fitcheck-demo-ai-history-v1",
  agentHistory: "fitcheck-demo-agent-history-v1",
  goalAdaptationHistory: "fitcheck-demo-goal-adaptation-history-v1",
  coachingPlanHistory: "fitcheck-demo-coaching-plan-history-v1",
  editLogId: "fitcheck-demo-edit-log-id-v1",
  dailyLogDraft: "fitcheck-demo-daily-log-draft-v1",
} as const;

export type StorageKeySet = typeof PERSONAL_STORAGE_KEYS;

export function assertStorageKeysAreSeparated() {
  const personalKeys: string[] = Object.values(PERSONAL_STORAGE_KEYS);
  const demoKeys: string[] = Object.values(DEMO_STORAGE_KEYS);
  const overlappingKeys = personalKeys.filter((key) => demoKeys.includes(key));
  const unsafePersonalKeys = personalKeys.filter(
    (key) => !key.startsWith("fitcheck-personal-")
  );
  const unsafeDemoKeys = demoKeys.filter(
    (key) => !key.startsWith("fitcheck-demo-")
  );

  if (
    overlappingKeys.length > 0 ||
    unsafePersonalKeys.length > 0 ||
    unsafeDemoKeys.length > 0
  ) {
    throw new Error("FitCheck storage keys are not safely separated.");
  }
}
