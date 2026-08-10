import { DailyLog, GoalType, UserSettings } from "../types/fitness";

type MetricKey = "calories" | "proteinGrams" | "steps";

export type MetricAverage = {
  label: string;
  value?: number;
  target?: number;
  unit: string;
  loggedDays: number;
};

export type WeightTrend = {
  status: string;
  weeklyChange?: number;
  direction: "up" | "down" | "flat" | "unknown";
  weighIns: number;
};

export type ProgressInsights = {
  activeGoal: GoalType;
  summary: string;
  weightTrend: WeightTrend;
  averages: MetricAverage[];
  loggedDays: number;
};

const metricLabels: Record<MetricKey, { label: string; unit: string }> = {
  calories: { label: "Calories", unit: "cal/day" },
  proteinGrams: { label: "Protein", unit: "g/day" },
  steps: { label: "Steps", unit: "steps/day" },
};

function round(value: number, digits = 0): number {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function getNumericValues(logs: DailyLog[], key: MetricKey): number[] {
  return logs
    .map((log) => log[key])
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

function calculateMetricAverage(
  logs: DailyLog[],
  key: MetricKey,
  target?: number,
): MetricAverage {
  const values = getNumericValues(logs, key);
  const total = values.reduce((sum, value) => sum + value, 0);
  const average = values.length ? total / values.length : undefined;

  return {
    label: metricLabels[key].label,
    value: typeof average === "number" ? round(average) : undefined,
    target,
    unit: metricLabels[key].unit,
    loggedDays: values.length,
  };
}

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T12:00:00`).getTime();
  const end = new Date(`${endDate}T12:00:00`).getTime();
  const days = Math.abs(end - start) / 86_400_000;
  return Math.max(days, 1);
}

function calculateWeightTrend(logs: DailyLog[], goal: GoalType, pace?: number): WeightTrend {
  const weighIns = logs
    .filter((log) => typeof log.weightLbs === "number" && Number.isFinite(log.weightLbs))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  if (weighIns.length < 2) {
    return {
      status: "Need 2+ weigh-ins",
      direction: "unknown",
      weighIns: weighIns.length,
    };
  }

  const first = weighIns[0];
  const latest = weighIns[weighIns.length - 1];
  const change = (latest.weightLbs ?? 0) - (first.weightLbs ?? 0);
  const weeklyChange = round((change / daysBetween(first.date, latest.date)) * 7, 1);
  const direction =
    Math.abs(weeklyChange) < 0.1 ? "flat" : weeklyChange > 0 ? "up" : "down";

  if (goal === "cut") {
    const targetPace = pace && pace > 0 ? pace : 1;
    if (weeklyChange <= -targetPace * 0.7) {
      return { status: "Cutting pace on track", weeklyChange, direction, weighIns: weighIns.length };
    }
    if (weeklyChange > 0) {
      return { status: "Weight trending against cut", weeklyChange, direction, weighIns: weighIns.length };
    }
    return { status: "Cut is slower than target", weeklyChange, direction, weighIns: weighIns.length };
  }

  if (goal === "bulk") {
    const targetPace = pace && pace > 0 ? pace : 0.5;
    if (weeklyChange >= targetPace * 0.5) {
      return { status: "Bulk pace moving up", weeklyChange, direction, weighIns: weighIns.length };
    }
    if (weeklyChange < 0) {
      return { status: "Weight trending down on bulk", weeklyChange, direction, weighIns: weighIns.length };
    }
    return { status: "Bulk is slower than target", weeklyChange, direction, weighIns: weighIns.length };
  }

  if (Math.abs(weeklyChange) <= 0.3) {
    return { status: "Maintenance looks stable", weeklyChange, direction, weighIns: weighIns.length };
  }

  return {
    status: weeklyChange > 0 ? "Maintenance trending up" : "Maintenance trending down",
    weeklyChange,
    direction,
    weighIns: weighIns.length,
  };
}

function getActiveGoal(logs: DailyLog[], settings: UserSettings | null): GoalType {
  return settings?.defaultGoal ?? logs[0]?.goal ?? "maintain";
}

function buildSummary(goal: GoalType, trend: WeightTrend): string {
  if (trend.direction === "unknown") {
    return "Keep logging. FitCheck needs more saved days before judging progress.";
  }

  if (goal === "cut") {
    return trend.direction === "down"
      ? "Your cut has a downward weight signal. Keep comparing this against calories, protein, and steps."
      : "Your cut does not have a downward weight signal yet. Check calories, steps, and consistency.";
  }

  if (goal === "bulk") {
    return trend.direction === "up"
      ? "Your bulk has an upward weight signal. Keep training quality and protein consistent."
      : "Your bulk does not have an upward weight signal yet. Check food intake and training progression.";
  }

  return trend.direction === "flat"
    ? "Your maintenance trend is stable. Keep watching calorie, protein, and step consistency."
    : "Your maintenance trend is moving. Decide whether that movement matches your intent.";
}

export function calculateProgressInsights(
  logs: DailyLog[],
  settings: UserSettings | null,
): ProgressInsights {
  const activeGoal = getActiveGoal(logs, settings);
  const recentLogs = logs.slice(0, 14);
  const weightTrend = calculateWeightTrend(recentLogs, activeGoal, settings?.weeklyGoalPaceLbs);

  return {
    activeGoal,
    summary: buildSummary(activeGoal, weightTrend),
    weightTrend,
    averages: [
      calculateMetricAverage(recentLogs, "calories", settings?.calorieTarget),
      calculateMetricAverage(recentLogs, "proteinGrams", settings?.proteinTarget),
      calculateMetricAverage(recentLogs, "steps", settings?.stepTarget),
    ],
    loggedDays: recentLogs.length,
  };
}
