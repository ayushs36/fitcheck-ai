import { DailyLog, GoalType, UserSettings } from "../types/fitness";

type MetricKey = "calories" | "proteinGrams" | "steps";

export type MetricAverage = {
  label: string;
  value?: number;
  target?: number;
  unit: string;
  loggedDays: number;
  status: "above" | "below" | "onTarget" | "noTarget" | "noData";
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
  priority: string;
  nextAction: string;
  evidence: string[];
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
  const status =
    typeof average !== "number"
      ? "noData"
      : typeof target !== "number"
        ? "noTarget"
        : Math.abs(average - target) <= target * 0.05
          ? "onTarget"
          : average > target
            ? "above"
            : "below";

  return {
    label: metricLabels[key].label,
    value: typeof average === "number" ? round(average) : undefined,
    target,
    unit: metricLabels[key].unit,
    loggedDays: values.length,
    status,
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

function findAverage(averages: MetricAverage[], label: string): MetricAverage | undefined {
  return averages.find((average) => average.label === label);
}

function buildEvidence(trend: WeightTrend, averages: MetricAverage[]): string[] {
  const evidence = [
    `${trend.weighIns} weigh-ins used`,
    ...averages.map((average) => `${average.label}: ${average.loggedDays} logged days`),
  ];

  return evidence.slice(0, 4);
}

function buildGoalAction(goal: GoalType, trend: WeightTrend, averages: MetricAverage[]) {
  const calories = findAverage(averages, "Calories");
  const protein = findAverage(averages, "Protein");
  const steps = findAverage(averages, "Steps");

  if (trend.direction === "unknown") {
    return {
      priority: "Build a baseline",
      nextAction: "Log weight plus at least one nutrition or step field for the next 3 days.",
    };
  }

  if (protein?.status === "below") {
    return {
      priority: "Improve protein",
      nextAction: "Bring protein closer to target before judging the goal pace too aggressively.",
    };
  }

  if (goal === "cut") {
    if (trend.direction === "up") {
      return {
        priority: "Tighten the cut",
        nextAction:
          calories?.status === "above"
            ? "Bring calories closer to target and keep steps consistent for the next week."
            : "Audit calories and steps because weight is moving against the cut.",
      };
    }

    if (trend.direction === "down") {
      return {
        priority: "Hold the plan",
        nextAction: "Keep calories, protein, steps, and training consistent while the trend moves down.",
      };
    }

    return {
      priority: "Create movement",
      nextAction: "Keep protein steady and add a small calorie or step adjustment if the trend stays flat.",
    };
  }

  if (goal === "bulk") {
    if (trend.direction === "down") {
      return {
        priority: "Increase intake",
        nextAction: "Raise calories slightly or improve meal consistency so the bulk can move upward.",
      };
    }

    if (trend.direction === "up") {
      return {
        priority: "Support training",
        nextAction: "Keep gaining slowly while prioritizing workout quality and progressive volume.",
      };
    }

    return {
      priority: "Nudge calories",
      nextAction: "Add a small calorie increase if weight remains flat and workouts are consistent.",
    };
  }

  if (trend.direction === "flat") {
    return {
      priority: "Maintain consistency",
      nextAction: "Keep calories, steps, and protein steady while weight remains stable.",
    };
  }

  return {
    priority: "Stabilize maintenance",
    nextAction:
      steps?.status === "below"
        ? "Bring steps closer to target and avoid changing calories until activity is consistent."
        : "Adjust calories only if this trend continues for another week.",
  };
}

export function calculateProgressInsights(
  logs: DailyLog[],
  settings: UserSettings | null,
): ProgressInsights {
  const activeGoal = getActiveGoal(logs, settings);
  const recentLogs = logs.slice(0, 14);
  const weightTrend = calculateWeightTrend(recentLogs, activeGoal, settings?.weeklyGoalPaceLbs);
  const averages = [
    calculateMetricAverage(recentLogs, "calories", settings?.calorieTarget),
    calculateMetricAverage(recentLogs, "proteinGrams", settings?.proteinTarget),
    calculateMetricAverage(recentLogs, "steps", settings?.stepTarget),
  ];
  const goalAction = buildGoalAction(activeGoal, weightTrend, averages);

  return {
    activeGoal,
    summary: buildSummary(activeGoal, weightTrend),
    priority: goalAction.priority,
    nextAction: goalAction.nextAction,
    evidence: buildEvidence(weightTrend, averages),
    weightTrend,
    averages,
    loggedDays: recentLogs.length,
  };
}
