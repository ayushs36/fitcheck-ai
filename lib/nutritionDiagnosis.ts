import type {
  LogEntry,
  NutritionDiagnosis,
  NutritionDiagnosisMetric,
  NutritionTargets,
} from "@/types/fitness";

type NutritionDiagnosisInput = {
  logs: LogEntry[];
  nutritionTargets: NutritionTargets;
};

export function getNutritionDiagnosis({
  logs,
  nutritionTargets,
}: NutritionDiagnosisInput): NutritionDiagnosis {
  const recentLogs = logs.slice(-14);
  const validCalorieLogs = recentLogs.filter((log) => log.calories > 0);
  const validProteinLogs = recentLogs.filter((log) => log.protein > 0);

  if (recentLogs.length < 7 || validCalorieLogs.length < 5) {
    return {
      score: 0,
      status: "Insufficient data",
      biggestBlocker: "Not enough recent nutrition logs.",
      agentAction: "Keep logging",
      calorieAverage: 0,
      calorieVariance: 0,
      proteinAverage: 0,
      proteinHitRate: 0,
      loggingCompleteness: recentLogs.length > 0 ? recentLogs.length / 14 : 0,
      metrics: [],
      recommendation:
        "Log calories and protein consistently for at least 7 days before changing the nutrition plan.",
    };
  }

  const calorieAverage = average(validCalorieLogs.map((log) => log.calories));
  const calorieVariance = standardDeviation(
    validCalorieLogs.map((log) => log.calories)
  );
  const proteinAverage = average(validProteinLogs.map((log) => log.protein));
  const proteinHitRate =
    validProteinLogs.length > 0
      ? validProteinLogs.filter(
          (log) => log.protein >= nutritionTargets.proteinTarget
        ).length / validProteinLogs.length
      : 0;
  const loggingCompleteness = validCalorieLogs.length / Math.min(14, recentLogs.length);

  const calorieScore = scoreCalorieVariance(calorieVariance);
  const proteinScore = Math.round(proteinHitRate * 100);
  const loggingScore = Math.round(loggingCompleteness * 100);
  const score = Math.round(
    calorieScore * 0.45 + proteinScore * 0.35 + loggingScore * 0.2
  );
  const metrics: NutritionDiagnosisMetric[] = [
    {
      label: "Calorie consistency",
      score: calorieScore,
      target: "Within about 150-250 cal/day",
      actual: `${Math.round(calorieVariance)} cal standard deviation`,
      status: getMetricStatus(calorieScore),
    },
    {
      label: "Protein execution",
      score: proteinScore,
      target: nutritionTargets.proteinRange,
      actual: `${Math.round(proteinHitRate * 100)}% of logged days hit target`,
      status: getMetricStatus(proteinScore),
    },
    {
      label: "Nutrition logging",
      score: loggingScore,
      target: "Calories logged daily",
      actual: `${validCalorieLogs.length}/${Math.min(14, recentLogs.length)} recent days`,
      status: getMetricStatus(loggingScore),
    },
  ];
  const weakestMetric = [...metrics].sort((a, b) => a.score - b.score)[0];

  return {
    score,
    status: getDiagnosisStatus(score),
    biggestBlocker: weakestMetric.label,
    agentAction: getAgentAction(weakestMetric.label),
    calorieAverage,
    calorieVariance,
    proteinAverage,
    proteinHitRate,
    loggingCompleteness,
    metrics,
    recommendation: getRecommendation(weakestMetric.label),
  };
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]) {
  if (values.length <= 1) {
    return 0;
  }

  const mean = average(values);
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;

  return Math.sqrt(variance);
}

function scoreCalorieVariance(variance: number) {
  if (variance <= 150) {
    return 100;
  }

  if (variance <= 250) {
    return 80;
  }

  if (variance <= 400) {
    return 60;
  }

  if (variance <= 600) {
    return 40;
  }

  return 20;
}

function getMetricStatus(score: number): NutritionDiagnosisMetric["status"] {
  if (score >= 80) {
    return "Strong";
  }

  if (score >= 55) {
    return "Watch";
  }

  return "Needs work";
}

function getDiagnosisStatus(score: number): NutritionDiagnosis["status"] {
  if (score >= 85) {
    return "Dialed in";
  }

  if (score >= 70) {
    return "Mostly consistent";
  }

  return "Needs attention";
}

function getAgentAction(blocker: string) {
  if (blocker === "Protein execution") {
    return "Improve protein before changing calories.";
  }

  if (blocker === "Nutrition logging") {
    return "Improve logging accuracy before changing targets.";
  }

  return "Stabilize calorie consistency before adjusting the deficit.";
}

function getRecommendation(blocker: string) {
  if (blocker === "Protein execution") {
    return "Anchor each day around a protein minimum so weight changes are easier to interpret and training recovery is protected.";
  }

  if (blocker === "Nutrition logging") {
    return "Log every calorie day for the next week, including weekends and restaurant meals, before trusting maintenance or deficit changes.";
  }

  return "Keep calories inside a tighter daily band for 7 days, then reassess the weight trend before changing calories.";
}
