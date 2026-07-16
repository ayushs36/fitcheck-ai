import type { DataFreshness, Goal, GoalForecast, LogEntry } from "@/types/fitness";
import { addDays, formatDate } from "./calculations";

type ForecastInput = {
  goal: Goal;
  logs: LogEntry[];
  currentWeight: number;
  goalWeight: number;
  goalDate: string;
  currentPace: number;
  requiredWeeklyPace: number;
  dataFreshness: DataFreshness;
};

export function getGoalForecast(input: ForecastInput): GoalForecast {
  const {
    goal,
    logs,
    currentWeight,
    goalWeight,
    goalDate,
    currentPace,
    requiredWeeklyPace,
    dataFreshness,
  } = input;

  const today = new Date();
  const targetDate = new Date(`${goalDate}T00:00:00`);
  const daysUntilTarget = Math.max(
    0,
    Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );
  const signedPoundsRemaining = goalWeight - currentWeight;
  const poundsRemaining =
    goal === "Bulking"
      ? Math.max(0, signedPoundsRemaining)
      : goal === "Cutting"
      ? Math.max(0, -signedPoundsRemaining)
      : Math.abs(signedPoundsRemaining);

  if (logs.length < 14 || currentWeight <= 0 || poundsRemaining <= 0) {
    return {
      status: "Need more data",
      confidence: "Low",
      confidenceReason:
        logs.length < 14
          ? "At least 14 logs are needed for scenario forecasting."
          : "The current weight is already at or beyond the goal.",
      targetDate: goalDate,
      targetWeight: goalWeight,
      currentWeight,
      poundsRemaining,
      requiredWeeklyPace,
      expectedWeeklyPace: currentPace,
      scenarios: [],
      recommendation:
        logs.length < 14
          ? "Keep logging until FitCheck has enough trend data for a reliable forecast."
          : "Move into a maintenance or new-goal planning phase.",
    };
  }

  const confidence = getForecastConfidence(logs.length, dataFreshness);
  const effectivePace = getEffectivePace(goal, currentPace, requiredWeeklyPace);
  const scenarios = [
    buildScenario("1 lb/week", 1, input, daysUntilTarget),
    buildScenario("1.5 lb/week", 1.5, input, daysUntilTarget),
    buildScenario("2 lb/week", 2, input, daysUntilTarget),
  ];

  const currentTrendProjectedDays =
    effectivePace > 0 ? Math.ceil((poundsRemaining / effectivePace) * 7) : 0;
  const status = getForecastStatus(
    currentTrendProjectedDays,
    daysUntilTarget,
    requiredWeeklyPace,
    effectivePace
  );

  return {
    status,
    confidence,
    confidenceReason: getConfidenceReason(logs.length, dataFreshness, currentPace),
    targetDate: goalDate,
    targetWeight: goalWeight,
    currentWeight,
    poundsRemaining,
    requiredWeeklyPace,
    expectedWeeklyPace: effectivePace,
    scenarios,
    recommendation: getForecastRecommendation(status, confidence),
  };
}

function getEffectivePace(
  goal: Goal,
  currentPace: number,
  requiredWeeklyPace: number
) {
  if (goal === "Maintaining") {
    return 0;
  }

  if (currentPace > 0) {
    return currentPace;
  }

  if (requiredWeeklyPace > 0) {
    return Math.min(requiredWeeklyPace, 0.75);
  }

  return 0.5;
}

function buildScenario(
  label: "1 lb/week" | "1.5 lb/week" | "2 lb/week",
  weeklyPace: number,
  input: ForecastInput,
  daysUntilTarget: number
) {
  const { goal, currentWeight, goalWeight } = input;
  const safePace = Math.max(weeklyPace, 0.1);
  const poundsRemaining =
    goal === "Bulking"
      ? Math.max(0, goalWeight - currentWeight)
      : Math.max(0, currentWeight - goalWeight);
  const projectedDays = Math.ceil((poundsRemaining / safePace) * 7);
  const projectedDate = formatDate(addDays(new Date(), projectedDays));
  const projectedChangeByTarget = safePace * (daysUntilTarget / 7);
  const projectedWeightAtTargetDate =
    goal === "Bulking"
      ? currentWeight + projectedChangeByTarget
      : currentWeight - projectedChangeByTarget;

  return {
    label,
    weeklyPace: safePace,
    projectedDate,
    projectedDays,
    projectedWeightAtTargetDate,
    summary: `${label} projects ${projectedDate}.`,
  };
}

function getForecastStatus(
  projectedDays: number,
  daysUntilTarget: number,
  requiredWeeklyPace: number,
  expectedWeeklyPace: number
): GoalForecast["status"] {
  if (daysUntilTarget <= 0 || expectedWeeklyPace <= 0) {
    return "Need more data";
  }

  if (expectedWeeklyPace >= requiredWeeklyPace) {
    return "On track";
  }

  if (projectedDays <= daysUntilTarget + 14) {
    return "At risk";
  }

  return "Unrealistic";
}

function getForecastConfidence(
  logsCount: number,
  dataFreshness: DataFreshness
): GoalForecast["confidence"] {
  if (logsCount >= 35 && dataFreshness.status === "Fresh") {
    return "High";
  }

  if (logsCount >= 21 && dataFreshness.status !== "Stale") {
    return "Medium";
  }

  return "Low";
}

function getConfidenceReason(
  logsCount: number,
  dataFreshness: DataFreshness,
  currentPace: number
) {
  const reasons = [`${logsCount} logs available.`];
  reasons.push(`Data freshness is ${dataFreshness.status.toLowerCase()}.`);

  if (currentPace <= 0) {
    reasons.push("Current trend is not yet moving toward the goal.");
  }

  return reasons.join(" ");
}

function getForecastRecommendation(
  status: GoalForecast["status"],
  confidence: GoalForecast["confidence"]
) {
  if (confidence === "Low") {
    return "Treat this forecast as directional. Keep logging and avoid major goal changes from this projection alone.";
  }

  if (status === "On track") {
    return "Keep the current plan and reassess after the next 7-day trend window.";
  }

  if (status === "At risk") {
    return "Tighten adherence before changing the goal date. Review calories, protein, steps, and recovery.";
  }

  if (status === "Unrealistic") {
    return "Adjust the goal date or target pace before making the deficit more aggressive.";
  }

  return "Keep logging until the forecast has enough signal.";
}
