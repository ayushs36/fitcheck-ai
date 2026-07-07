import type {
  LogEntry,
  NutritionTargets,
  PlanAdherence,
  PlanAdherenceMetric,
} from "@/types/fitness";

const STEP_TARGET = 10000;
const WORKOUT_TARGET = 3;

export function getPlanAdherence({
  logs,
  nutritionTargets,
}: {
  logs: LogEntry[];
  nutritionTargets: NutritionTargets;
}): PlanAdherence {
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const recentLogs = sortedLogs.slice(-7);
  const previousLogs = sortedLogs.slice(-14, -7);
  const metrics = getAdherenceMetrics(recentLogs, nutritionTargets);
  const score = getAverageScore(metrics);
  const previousScore =
    previousLogs.length > 0
      ? getAverageScore(getAdherenceMetrics(previousLogs, nutritionTargets))
      : null;
  const biggestBlocker = [...metrics].sort((a, b) => a.score - b.score)[0];

  return {
    score,
    trend: getTrend(score, previousScore),
    biggestBlocker: biggestBlocker?.label ?? "Need more data",
    blockerRecommendation: getBlockerRecommendation(biggestBlocker),
    metrics,
    weeklyScores: getWeeklyScores(sortedLogs, nutritionTargets),
  };
}

function getAdherenceMetrics(
  logs: LogEntry[],
  nutritionTargets: NutritionTargets
): PlanAdherenceMetric[] {
  const avgCalories = average(logs.map((log) => log.calories));
  const avgProtein = average(logs.map((log) => log.protein));
  const avgSteps = average(logs.map((log) => log.steps));
  const workouts = logs.filter((log) => log.exercises.length > 0).length;
  const calorieScore =
    nutritionTargets.calorieTarget > 0 && avgCalories > 0
      ? Math.max(
          0,
          100 -
            (Math.abs(avgCalories - nutritionTargets.calorieTarget) /
              nutritionTargets.calorieTarget) *
              100
        )
      : 0;

  return [
    {
      label: "Calories",
      score: Math.round(calorieScore),
      target: nutritionTargets.calorieRange,
      actual: avgCalories > 0 ? `${avgCalories.toFixed(0)} cal/day` : "No logs",
      status: getMetricStatus(calorieScore),
    },
    {
      label: "Protein",
      score: Math.round(Math.min(100, (avgProtein / nutritionTargets.proteinTarget) * 100)),
      target: nutritionTargets.proteinRange,
      actual: avgProtein > 0 ? `${avgProtein.toFixed(0)}g/day` : "No logs",
      status: getMetricStatus(
        Math.min(100, (avgProtein / nutritionTargets.proteinTarget) * 100)
      ),
    },
    {
      label: "Steps",
      score: Math.round(Math.min(100, (avgSteps / STEP_TARGET) * 100)),
      target: `${STEP_TARGET.toLocaleString()} steps/day`,
      actual: avgSteps > 0 ? `${avgSteps.toFixed(0)} steps/day` : "No logs",
      status: getMetricStatus(Math.min(100, (avgSteps / STEP_TARGET) * 100)),
    },
    {
      label: "Training",
      score: Math.round(Math.min(100, (workouts / WORKOUT_TARGET) * 100)),
      target: `${WORKOUT_TARGET}+ workouts/week`,
      actual: `${workouts} workout${workouts === 1 ? "" : "s"}/week`,
      status: getMetricStatus(Math.min(100, (workouts / WORKOUT_TARGET) * 100)),
    },
  ];
}

function getWeeklyScores(
  logs: LogEntry[],
  nutritionTargets: NutritionTargets
): PlanAdherence["weeklyScores"] {
  return [3, 2, 1, 0]
    .map((weeksAgo) => {
      const end = logs.length - weeksAgo * 7;
      const start = Math.max(0, end - 7);
      const weekLogs = logs.slice(start, end);

      if (weekLogs.length === 0) {
        return null;
      }

      return {
        label: weeksAgo === 0 ? "Current" : `${weeksAgo}w ago`,
        score: getAverageScore(getAdherenceMetrics(weekLogs, nutritionTargets)),
      };
    })
    .filter((item): item is { label: string; score: number } => item !== null);
}

function getAverageScore(metrics: PlanAdherenceMetric[]) {
  if (metrics.length === 0) return 0;

  return Math.round(
    metrics.reduce((total, metric) => total + metric.score, 0) / metrics.length
  );
}

function getTrend(
  currentScore: number,
  previousScore: number | null
): PlanAdherence["trend"] {
  if (previousScore === null) return "Need more data";

  const difference = currentScore - previousScore;

  if (difference >= 5) return "Improving";
  if (difference <= -5) return "Declining";
  return "Stable";
}

function getMetricStatus(score: number): PlanAdherenceMetric["status"] {
  if (score >= 85) return "On track";
  if (score >= 65) return "Needs attention";
  return "Off track";
}

function getBlockerRecommendation(metric?: PlanAdherenceMetric) {
  if (!metric) return "Add more logs before judging adherence.";

  if (metric.label === "Calories") {
    return "Tighten calorie consistency before changing the plan.";
  }

  if (metric.label === "Protein") {
    return "Anchor each meal around protein until the weekly average reaches target.";
  }

  if (metric.label === "Steps") {
    return "Raise the step baseline before cutting calories further.";
  }

  return "Hit at least three logged lifting sessions before judging training progress.";
}

function average(values: number[]) {
  const validValues = values.filter((value) => value > 0);

  if (validValues.length === 0) return 0;

  return (
    validValues.reduce((total, value) => total + value, 0) / validValues.length
  );
}
