import type {
  AgentDecision,
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
  const calorieTarget = nutritionTargets.calorieTarget;

  if (recentLogs.length < 7 || validCalorieLogs.length < 5) {
    return {
      score: 0,
      status: "Insufficient data",
      biggestBlocker: "Not enough recent nutrition logs.",
      agentAction: "Keep logging",
      nutritionNextAction:
        "Log calories and protein for at least 7 days before changing targets.",
      agentNutritionInsight:
        "FitCheck needs more recent nutrition logs before it can separate adherence from missing data.",
      calorieTarget,
      calorieAverage: 0,
      calorieTargetDelta: 0,
      calorieTargetHitRate: 0,
      calorieVariance: 0,
      underLoggingRisk: "Unknown",
      volatileIntakeRisk: "Unknown",
      proteinAverage: 0,
      proteinHitRate: 0,
      loggingCompleteness: recentLogs.length > 0 ? recentLogs.length / 14 : 0,
      metrics: [],
      recommendation:
        "Log calories and protein consistently for at least 7 days before changing the nutrition plan.",
    };
  }

  const calorieAverage = average(validCalorieLogs.map((log) => log.calories));
  const calorieTargetDelta = calorieAverage - calorieTarget;
  const calorieTargetHitRate = getCalorieTargetHitRate(
    validCalorieLogs,
    calorieTarget
  );
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
  const calorieTargetScore = scoreCalorieTargetExecution(
    calorieTargetDelta,
    calorieTargetHitRate,
    calorieTarget
  );
  const proteinScore = Math.round(proteinHitRate * 100);
  const loggingScore = Math.round(loggingCompleteness * 100);
  const underLoggingRisk = getUnderLoggingRisk(calorieAverage, calorieTarget);
  const volatileIntakeRisk = getVolatileIntakeRisk(calorieVariance);
  const score = Math.round(
    calorieScore * 0.3 +
      calorieTargetScore * 0.25 +
      proteinScore * 0.25 +
      loggingScore * 0.2
  );
  const metrics: NutritionDiagnosisMetric[] = [
    {
      label: "Calorie target execution",
      score: calorieTargetScore,
      target: nutritionTargets.calorieRange,
      actual: `${Math.round(calorieAverage)} cal average (${formatDelta(
        calorieTargetDelta
      )} vs target)`,
      status: getMetricStatus(calorieTargetScore),
    },
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
  const nutritionNextAction = getNutritionNextAction({
    weakestMetric: weakestMetric.label,
    underLoggingRisk,
    volatileIntakeRisk,
  });

  return {
    score,
    status: getDiagnosisStatus(score),
    biggestBlocker: weakestMetric.label,
    agentAction: getAgentAction(weakestMetric.label),
    nutritionNextAction,
    agentNutritionInsight: getAgentNutritionInsight({
      weakestMetric: weakestMetric.label,
      calorieTargetDelta,
      calorieTargetHitRate,
      underLoggingRisk,
      volatileIntakeRisk,
    }),
    calorieTarget,
    calorieAverage,
    calorieTargetDelta,
    calorieTargetHitRate,
    calorieVariance,
    underLoggingRisk,
    volatileIntakeRisk,
    proteinAverage,
    proteinHitRate,
    loggingCompleteness,
    metrics,
    recommendation: getRecommendation(weakestMetric.label),
  };
}

export function adjustDecisionForNutrition(
  decision: AgentDecision,
  nutritionDiagnosis: NutritionDiagnosis
): AgentDecision {
  const shouldPauseCalorieCut =
    decision.action === "Reduce calories" &&
    (nutritionDiagnosis.underLoggingRisk === "High" ||
      nutritionDiagnosis.volatileIntakeRisk === "High" ||
      nutritionDiagnosis.calorieTargetHitRate < 0.5);

  if (!shouldPauseCalorieCut) {
    return decision;
  }

  return {
    ...decision,
    action: "Hold calories",
    priority: "Nutrition execution",
    rationale:
      "Nutrition adherence is not clean enough to justify lowering calories yet.",
    calorieGuidance:
      nutritionDiagnosis.nutritionNextAction,
    proteinGuidance:
      "Keep protein at the current target while nutrition execution is cleaned up.",
    timelineGuidance:
      "Reassess the goal timeline after 7 days of clearer nutrition execution.",
    confidence:
      nutritionDiagnosis.underLoggingRisk === "High" ? "Low" : decision.confidence,
  };
}

function getCalorieTargetHitRate(logs: LogEntry[], calorieTarget: number) {
  if (logs.length === 0 || calorieTarget <= 0) {
    return 0;
  }

  return (
    logs.filter((log) => Math.abs(log.calories - calorieTarget) <= 200).length /
    logs.length
  );
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

function scoreCalorieTargetExecution(
  calorieTargetDelta: number,
  calorieTargetHitRate: number,
  calorieTarget: number
) {
  if (calorieTarget <= 0) {
    return 0;
  }

  const deltaScore = Math.max(
    0,
    100 - (Math.abs(calorieTargetDelta) / calorieTarget) * 250
  );
  const hitRateScore = calorieTargetHitRate * 100;

  return Math.round(deltaScore * 0.55 + hitRateScore * 0.45);
}

function getUnderLoggingRisk(
  calorieAverage: number,
  calorieTarget: number
): NutritionDiagnosis["underLoggingRisk"] {
  if (calorieAverage <= 0 || calorieTarget <= 0) {
    return "Unknown";
  }

  if (calorieAverage < calorieTarget * 0.75) {
    return "High";
  }

  if (calorieAverage < calorieTarget * 0.85) {
    return "Moderate";
  }

  return "Low";
}

function getVolatileIntakeRisk(
  calorieVariance: number
): NutritionDiagnosis["volatileIntakeRisk"] {
  if (calorieVariance <= 0) {
    return "Unknown";
  }

  if (calorieVariance > 500) {
    return "High";
  }

  if (calorieVariance > 300) {
    return "Moderate";
  }

  return "Low";
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
  if (blocker === "Calorie target execution") {
    return "Align calories with the active target before changing the plan.";
  }

  if (blocker === "Protein execution") {
    return "Improve protein before changing calories.";
  }

  if (blocker === "Nutrition logging") {
    return "Improve logging accuracy before changing targets.";
  }

  return "Stabilize calorie consistency before adjusting the deficit.";
}

function getRecommendation(blocker: string) {
  if (blocker === "Calorie target execution") {
    return "Keep the same target for 7 days and focus on landing closer to it before asking the agent to change calories.";
  }

  if (blocker === "Protein execution") {
    return "Anchor each day around a protein minimum so weight changes are easier to interpret and training recovery is protected.";
  }

  if (blocker === "Nutrition logging") {
    return "Log every calorie day for the next week, including weekends and restaurant meals, before trusting maintenance or deficit changes.";
  }

  return "Keep calories inside a tighter daily band for 7 days, then reassess the weight trend before changing calories.";
}

function getNutritionNextAction({
  weakestMetric,
  underLoggingRisk,
  volatileIntakeRisk,
}: {
  weakestMetric: string;
  underLoggingRisk: NutritionDiagnosis["underLoggingRisk"];
  volatileIntakeRisk: NutritionDiagnosis["volatileIntakeRisk"];
}) {
  if (underLoggingRisk === "High") {
    return "Audit calorie logging for missed oils, snacks, drinks, sauces, and restaurant estimates before lowering calories.";
  }

  if (volatileIntakeRisk === "High") {
    return "Keep calories inside a tighter range for 7 days so the agent can trust the trend.";
  }

  if (weakestMetric === "Protein execution") {
    return "Hit the protein minimum before making the deficit harder.";
  }

  if (weakestMetric === "Nutrition logging") {
    return "Log every calorie and protein day this week, including partial or imperfect days.";
  }

  return "Hold the current nutrition target and execute it consistently for the next 7 days.";
}

function getAgentNutritionInsight({
  weakestMetric,
  calorieTargetDelta,
  calorieTargetHitRate,
  underLoggingRisk,
  volatileIntakeRisk,
}: {
  weakestMetric: string;
  calorieTargetDelta: number;
  calorieTargetHitRate: number;
  underLoggingRisk: NutritionDiagnosis["underLoggingRisk"];
  volatileIntakeRisk: NutritionDiagnosis["volatileIntakeRisk"];
}) {
  if (underLoggingRisk !== "Low" && underLoggingRisk !== "Unknown") {
    return `FitCheck sees ${underLoggingRisk.toLowerCase()} under-logging risk, so the agent should audit tracking before reducing calories.`;
  }

  if (volatileIntakeRisk !== "Low" && volatileIntakeRisk !== "Unknown") {
    return `FitCheck sees ${volatileIntakeRisk.toLowerCase()} intake volatility, so consistency should come before a target change.`;
  }

  if (Math.abs(calorieTargetDelta) > 200) {
    return `Calories are averaging ${formatDelta(
      calorieTargetDelta
    )} from target, with ${Math.round(
      calorieTargetHitRate * 100
    )}% of logged days near target.`;
  }

  return `Nutrition blocker: ${weakestMetric}. Calories are close enough to target for the agent to judge the trend.`;
}

function formatDelta(value: number) {
  if (value === 0) {
    return "on target";
  }

  return `${value > 0 ? "+" : "-"}${Math.abs(Math.round(value))} cal`;
}
