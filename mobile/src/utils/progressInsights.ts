import { DailyLog, GoalType, UserSettings } from "../types/fitness";
import { getProteinTarget } from "./proteinTargets";

type MetricKey = "calories" | "proteinGrams" | "steps";

export type MetricAverage = {
  label: string;
  value?: number;
  target?: number;
  targetLabel?: string;
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

export type LoggingQuality = {
  status: "strong" | "usable" | "thin" | "baseline";
  score: number;
  summary: string;
  nextAction: string;
  streakDays: number;
  recentDaysWithAnyLog: number;
  coverage: {
    weight: number;
    calories: number;
    protein: number;
    steps: number;
  };
};

export type ProgressInsights = {
  activeGoal: GoalType;
  summary: string;
  priority: string;
  nextAction: string;
  goalTimeline: GoalTimeline;
  coachReview: CoachReview;
  weeklyExecution: WeeklyExecution;
  evidence: string[];
  weightTrend: WeightTrend;
  loggingQuality: LoggingQuality;
  averages: MetricAverage[];
  loggedDays: number;
};

export type GoalTimeline = {
  status: "maintaining" | "needsWeight" | "needsTarget" | "reached" | "onTrack" | "offTrack";
  latestWeightLbs?: number;
  targetWeightLbs?: number;
  poundsRemaining?: number;
  plannedDate?: string;
  projectedDate?: string;
  summary: string;
  nextAction: string;
};

export type CoachReview = {
  mode: "Build baseline" | "Monitor" | "Adjust plan" | "Hold plan";
  confidence: "Low" | "Medium" | "High";
  reviewWindow: string;
  rule: string;
  reason: string;
};

export type WeeklyExecution = {
  score: number;
  status: "No targets" | "Needs data" | "Needs attention" | "Solid" | "Strong";
  summary: string;
  nextAction: string;
};

const metricLabels: Record<MetricKey, { label: string; unit: string }> = {
  calories: { label: "Calories", unit: "cal/day" },
  proteinGrams: { label: "Protein", unit: "g/day" },
  steps: { label: "Steps", unit: "steps/day" },
};
const RECENT_METRIC_AVERAGE_DAYS = 7;

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
  targetLabel?: string,
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
    targetLabel,
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

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getTodayKey(): string {
  return formatDateKey(new Date());
}

function hasValue(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

function calculateStreakDays(logsByDate: Map<string, DailyLog>): number {
  let streakDays = 0;
  let cursor = new Date(`${getTodayKey()}T12:00:00`);

  while (logsByDate.has(formatDateKey(cursor))) {
    streakDays += 1;
    cursor = addDays(cursor, -1);
  }

  return streakDays;
}

function buildLoggingQuality(logs: DailyLog[]): LoggingQuality {
  const logsByDate = new Map(logs.map((log) => [log.date, log]));
  const today = new Date(`${getTodayKey()}T12:00:00`);
  const recentDates = Array.from({ length: 7 }, (_, index) => formatDateKey(addDays(today, -index)));
  const recentLogs = recentDates.map((date) => logsByDate.get(date)).filter(Boolean) as DailyLog[];

  const coverage = {
    weight: recentLogs.filter((log) => hasValue(log.weightLbs)).length,
    calories: recentLogs.filter((log) => hasValue(log.calories)).length,
    protein: recentLogs.filter((log) => hasValue(log.proteinGrams)).length,
    steps: recentLogs.filter((log) => hasValue(log.steps)).length,
  };
  const recentDaysWithAnyLog = recentLogs.length;
  const score = round(
    ((recentDaysWithAnyLog + coverage.weight + coverage.calories + coverage.protein + coverage.steps) /
      35) *
      100,
  );
  const streakDays = calculateStreakDays(logsByDate);

  if (score >= 80) {
    return {
      status: "strong",
      score,
      summary: "Recent logging is strong enough for confident coaching signals.",
      nextAction: "Keep the same logging rhythm so trends stay reliable.",
      streakDays,
      recentDaysWithAnyLog,
      coverage,
    };
  }

  if (score >= 55) {
    return {
      status: "usable",
      score,
      summary: "Recent data is usable, but one or two missing fields may weaken recommendations.",
      nextAction: "Prioritize the fields you missed most often over the next few days.",
      streakDays,
      recentDaysWithAnyLog,
      coverage,
    };
  }

  if (score >= 30) {
    return {
      status: "thin",
      score,
      summary: "FitCheck has a thin baseline, so goal advice should stay conservative.",
      nextAction: "Log weight plus calories, protein, or steps for the next 3 days.",
      streakDays,
      recentDaysWithAnyLog,
      coverage,
    };
  }

  return {
    status: "baseline",
    score,
    summary: "FitCheck needs more recent logs before judging goal progress.",
    nextAction: "Start with one complete day of weight, nutrition, and steps.",
    streakDays,
    recentDaysWithAnyLog,
    coverage,
  };
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

function getLatestWeight(logs: DailyLog[], settings: UserSettings | null): number {
  const latestWeightLog = logs
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .find((log) => typeof log.weightLbs === "number" && Number.isFinite(log.weightLbs));

  return latestWeightLog?.weightLbs ?? settings?.startingWeightLbs ?? 0;
}

function getLatestWeighIn(logs: DailyLog[]): DailyLog | undefined {
  return logs
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .find((log) => typeof log.weightLbs === "number" && Number.isFinite(log.weightLbs));
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

function buildGoalAction(
  goal: GoalType,
  trend: WeightTrend,
  averages: MetricAverage[],
  loggingQuality: LoggingQuality,
) {
  const calories = findAverage(averages, "Calories");
  const protein = findAverage(averages, "Protein");
  const steps = findAverage(averages, "Steps");

  if (loggingQuality.status === "baseline") {
    return {
      priority: "Build logging baseline",
      nextAction: loggingQuality.nextAction,
    };
  }

  if (loggingQuality.status === "thin") {
    return {
      priority: "Improve data quality",
      nextAction: loggingQuality.nextAction,
    };
  }

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

function isTrendAlignedWithGoal(goal: GoalType, trend: WeightTrend): boolean {
  if (goal === "cut") {
    return trend.direction === "down";
  }

  if (goal === "bulk") {
    return trend.direction === "up";
  }

  return trend.direction === "flat";
}

function isTrendAgainstGoal(goal: GoalType, trend: WeightTrend): boolean {
  if (goal === "cut") {
    return trend.direction === "up";
  }

  if (goal === "bulk") {
    return trend.direction === "down";
  }

  return trend.direction === "up" || trend.direction === "down";
}

function buildAdjustmentRule(goal: GoalType): string {
  if (goal === "cut") {
    return "Only adjust calories or steps after a full week of usable logs confirms the cut is off pace.";
  }

  if (goal === "bulk") {
    return "Only raise calories after a full week of usable logs confirms weight and training are not moving up.";
  }

  return "Only adjust calories after a full week shows weight drifting outside your maintenance range.";
}

function buildCoachReview(
  goal: GoalType,
  trend: WeightTrend,
  loggingQuality: LoggingQuality,
  loggedDays: number,
): CoachReview {
  const hasUsableData =
    loggingQuality.status === "usable" || loggingQuality.status === "strong";
  const hasTrendData = trend.weighIns >= 3 && typeof trend.weeklyChange === "number";

  if (!hasUsableData || !hasTrendData || loggedDays < 7) {
    return {
      mode: "Build baseline",
      confidence: "Low",
      reviewWindow: "Next 3 logged days",
      rule: "Do not change the plan yet. Log enough weight, nutrition, and steps for a real read.",
      reason: `${trend.weighIns} weigh-ins and ${loggingQuality.score}/100 logging quality are not enough for an aggressive adjustment.`,
    };
  }

  if (isTrendAlignedWithGoal(goal, trend)) {
    return {
      mode: "Hold plan",
      confidence: loggingQuality.status === "strong" ? "High" : "Medium",
      reviewWindow: "Review again in 7 days",
      rule: "Keep the current goal plan steady while the trend matches your goal.",
      reason: `${trend.status} with ${loggingQuality.score}/100 logging quality.`,
    };
  }

  if (isTrendAgainstGoal(goal, trend) && loggingQuality.status === "strong") {
    return {
      mode: "Adjust plan",
      confidence: "High",
      reviewWindow: "Use the next 7 days to test the adjustment",
      rule: buildAdjustmentRule(goal),
      reason: `${trend.status} despite strong recent logging.`,
    };
  }

  return {
    mode: "Monitor",
    confidence: "Medium",
    reviewWindow: "Review again after 3 to 4 more logs",
    rule: buildAdjustmentRule(goal),
    reason: `${trend.status}, but FitCheck should confirm the signal before changing the plan.`,
  };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreAverage(average: MetricAverage): number | undefined {
  if (
    typeof average.value !== "number" ||
    typeof average.target !== "number" ||
    average.target <= 0
  ) {
    return undefined;
  }

  if (average.label === "Calories") {
    const percentOffTarget = Math.abs(average.value - average.target) / average.target;
    return clampScore(100 - percentOffTarget * 250);
  }

  return clampScore((average.value / average.target) * 100);
}

function buildWeeklyExecution(averages: MetricAverage[]): WeeklyExecution {
  const scoredAverages = averages
    .map((average) => ({
      average,
      score: scoreAverage(average),
    }))
    .filter((item): item is { average: MetricAverage; score: number } =>
      typeof item.score === "number",
    );

  if (scoredAverages.length === 0) {
    return {
      score: 0,
      status: "No targets",
      summary: "Set calorie, protein, or step targets before FitCheck can score execution.",
      nextAction: "Add targets in the Goals tab.",
    };
  }

  const score = clampScore(
    scoredAverages.reduce((sum, item) => sum + item.score, 0) / scoredAverages.length,
  );
  const weakestMetric = scoredAverages
    .slice()
    .sort((a, b) => a.score - b.score)[0];

  if (weakestMetric.average.loggedDays < 3) {
    return {
      score,
      status: "Needs data",
      summary: "Weekly execution has too few logged days for a confident read.",
      nextAction: `Log ${weakestMetric.average.label.toLowerCase()} more often this week.`,
    };
  }

  if (score >= 85) {
    return {
      score,
      status: "Strong",
      summary: "Your weekly averages are close enough to target for confident coaching.",
      nextAction: "Hold the plan and watch the weight and training trend.",
    };
  }

  if (score >= 70) {
    return {
      score,
      status: "Solid",
      summary: "Your weekly averages are usable, with one target needing attention.",
      nextAction: `Tighten ${weakestMetric.average.label.toLowerCase()} before changing the whole plan.`,
    };
  }

  return {
    score,
    status: "Needs attention",
    summary: "Weekly averages are far enough from target that the coach should focus on execution first.",
    nextAction: `Bring ${weakestMetric.average.label.toLowerCase()} closer to target over the next 7 days.`,
  };
}

function buildGoalTimeline(
  goal: GoalType,
  logs: DailyLog[],
  settings: UserSettings | null,
  trend: WeightTrend,
): GoalTimeline {
  const latestWeighIn = getLatestWeighIn(logs);
  const latestWeightLbs = latestWeighIn?.weightLbs ?? settings?.startingWeightLbs;

  if (goal === "maintain") {
    return {
      status: "maintaining",
      latestWeightLbs,
      targetWeightLbs: settings?.targetWeightLbs,
      summary: "Maintenance does not need a finish date. The goal is a stable weight trend.",
      nextAction: "Keep weekly calories, protein, steps, and training consistent.",
    };
  }

  if (typeof latestWeightLbs !== "number" || !Number.isFinite(latestWeightLbs)) {
    return {
      status: "needsWeight",
      summary: "FitCheck needs a current weigh-in before estimating the goal timeline.",
      nextAction: "Log morning weight, then FitCheck can calculate distance to goal.",
    };
  }

  if (
    typeof settings?.targetWeightLbs !== "number" ||
    !Number.isFinite(settings.targetWeightLbs) ||
    settings.targetWeightLbs <= 0
  ) {
    return {
      status: "needsTarget",
      latestWeightLbs,
      summary: "Set a target weight to estimate days to goal.",
      nextAction: "Add target weight in the Goals tab.",
    };
  }

  const targetWeightLbs = settings.targetWeightLbs;
  const poundsRemaining =
    goal === "cut"
      ? Math.max(0, latestWeightLbs - targetWeightLbs)
      : Math.max(0, targetWeightLbs - latestWeightLbs);

  if (poundsRemaining === 0) {
    return {
      status: "reached",
      latestWeightLbs,
      targetWeightLbs,
      poundsRemaining,
      summary: "Your latest weigh-in is at or beyond the target.",
      nextAction: "Decide whether to maintain, set a new target, or start the next phase.",
    };
  }

  const plannedWeeklyPace =
    typeof settings.weeklyGoalPaceLbs === "number" && settings.weeklyGoalPaceLbs > 0
      ? settings.weeklyGoalPaceLbs
      : goal === "cut"
        ? 1
        : 0.5;
  const plannedDays = Math.ceil((poundsRemaining / plannedWeeklyPace) * 7);
  const plannedDate = formatDateKey(addDays(new Date(), plannedDays));
  const trendMatchesGoal =
    typeof trend.weeklyChange === "number" &&
    ((goal === "cut" && trend.weeklyChange < -0.1) ||
      (goal === "bulk" && trend.weeklyChange > 0.1));
  const actualWeeklyPace =
    trendMatchesGoal && typeof trend.weeklyChange === "number"
      ? Math.abs(trend.weeklyChange)
      : undefined;
  const projectedDate =
    typeof actualWeeklyPace === "number"
      ? formatDateKey(addDays(new Date(), Math.ceil((poundsRemaining / actualWeeklyPace) * 7)))
      : undefined;

  return {
    status: projectedDate ? "onTrack" : "offTrack",
    latestWeightLbs,
    targetWeightLbs,
    poundsRemaining: round(poundsRemaining, 1),
    plannedDate,
    projectedDate,
    summary: projectedDate
      ? "Current trend is moving toward the selected goal."
      : "Current trend is not moving toward the selected goal yet.",
    nextAction: projectedDate
      ? "Hold the plan and compare again after the next 7 logged days."
      : "Focus on consistent logging and execution before changing the target timeline.",
  };
}

export function calculateProgressInsights(
  logs: DailyLog[],
  settings: UserSettings | null,
): ProgressInsights {
  const activeGoal = getActiveGoal(logs, settings);
  const recentLogs = logs.slice(0, 14);
  const recentMetricLogs = logs.slice(0, RECENT_METRIC_AVERAGE_DAYS);
  const loggingQuality = buildLoggingQuality(logs);
  const proteinTarget = getProteinTarget(activeGoal, getLatestWeight(logs, settings));
  const weightTrend = calculateWeightTrend(recentLogs, activeGoal, settings?.weeklyGoalPaceLbs);
  const averages = [
    calculateMetricAverage(recentMetricLogs, "calories", settings?.calorieTarget),
    calculateMetricAverage(
      recentMetricLogs,
      "proteinGrams",
      settings?.proteinTarget ?? proteinTarget.low,
      settings?.proteinTarget ? undefined : proteinTarget.range,
    ),
    calculateMetricAverage(recentMetricLogs, "steps", settings?.stepTarget),
  ];
  const goalAction = buildGoalAction(activeGoal, weightTrend, averages, loggingQuality);
  const goalTimeline = buildGoalTimeline(activeGoal, logs, settings, weightTrend);
  const coachReview = buildCoachReview(
    activeGoal,
    weightTrend,
    loggingQuality,
    recentLogs.length,
  );
  const weeklyExecution = buildWeeklyExecution(averages);

  return {
    activeGoal,
    summary: buildSummary(activeGoal, weightTrend),
    priority: goalAction.priority,
    nextAction: goalAction.nextAction,
    goalTimeline,
    coachReview,
    weeklyExecution,
    evidence: buildEvidence(weightTrend, averages),
    weightTrend,
    loggingQuality,
    averages,
    loggedDays: recentLogs.length,
  };
}
