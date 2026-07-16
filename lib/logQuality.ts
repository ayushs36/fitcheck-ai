import type { LogEntry } from "@/types/fitness";

type TrackedField = {
  key: "weight" | "calories" | "protein" | "steps" | "workout";
  label: string;
  isLogged: (log: LogEntry) => boolean;
};

const TRACKED_FIELDS: TrackedField[] = [
  {
    key: "weight",
    label: "Weight",
    isLogged: (log) => log.weight > 0,
  },
  {
    key: "calories",
    label: "Calories",
    isLogged: (log) => log.calories > 0,
  },
  {
    key: "protein",
    label: "Protein",
    isLogged: (log) => log.protein > 0,
  },
  {
    key: "steps",
    label: "Steps",
    isLogged: (log) => log.steps > 0,
  },
  {
    key: "workout",
    label: "Workout",
    isLogged: (log) => log.workout.trim().length > 0 || log.exercises.length > 0,
  },
];

export type LogCoverage = {
  status: "Complete" | "Partial" | "Empty";
  score: number;
  loggedFields: string[];
  missingFields: string[];
  summary: string;
};

export type LoggingQuality = {
  recentLogCount: number;
  completeDays: number;
  partialDays: number;
  missingDays: number;
  averageCoverageScore: number;
  commonMissingFields: string[];
  summary: string;
};

export function getLogCoverage(log: LogEntry): LogCoverage {
  const loggedFields = TRACKED_FIELDS.filter((field) => field.isLogged(log)).map(
    (field) => field.label
  );
  const missingFields = TRACKED_FIELDS.filter(
    (field) => !field.isLogged(log)
  ).map((field) => field.label);
  const score = Math.round((loggedFields.length / TRACKED_FIELDS.length) * 100);

  if (loggedFields.length === 0) {
    return {
      status: "Empty",
      score,
      loggedFields,
      missingFields,
      summary: "No fields logged yet",
    };
  }

  if (missingFields.length === 0) {
    return {
      status: "Complete",
      score,
      loggedFields,
      missingFields,
      summary: "All core fields logged",
    };
  }

  return {
    status: "Partial",
    score,
    loggedFields,
    missingFields,
    summary: `Missing ${missingFields.join(", ")}`,
  };
}

export function getLoggingQuality(logs: LogEntry[], windowSize = 7): LoggingQuality {
  const recentLogs = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-windowSize);
  const coverage = recentLogs.map(getLogCoverage);
  const completeDays = coverage.filter((item) => item.status === "Complete").length;
  const partialDays = coverage.filter((item) => item.status === "Partial").length;
  const totalScore = coverage.reduce((sum, item) => sum + item.score, 0);
  const missingFieldCounts = new Map<string, number>();

  coverage.forEach((item) => {
    item.missingFields.forEach((field) => {
      missingFieldCounts.set(field, (missingFieldCounts.get(field) ?? 0) + 1);
    });
  });

  const commonMissingFields = Array.from(missingFieldCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([field]) => field);
  const averageCoverageScore =
    coverage.length === 0 ? 0 : Math.round(totalScore / coverage.length);

  return {
    recentLogCount: recentLogs.length,
    completeDays,
    partialDays,
    missingDays: Math.max(windowSize - recentLogs.length, 0),
    averageCoverageScore,
    commonMissingFields,
    summary:
      coverage.length === 0
        ? "No recent logs available"
        : `${completeDays}/${windowSize} complete days, ${partialDays} partial days`,
  };
}
