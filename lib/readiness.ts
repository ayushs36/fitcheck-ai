import type {
  AgentDecision,
  DataFreshness,
  PlanAdherence,
  ReadinessScore,
  RecoveryRisk,
} from "@/types/fitness";

export function getReadinessScore({
  recoveryRisk,
  planAdherence,
  dataFreshness,
  strengthStatus,
  currentPace,
}: {
  recoveryRisk: RecoveryRisk;
  planAdherence: PlanAdherence;
  dataFreshness: DataFreshness;
  strengthStatus: string;
  currentPace: number;
}): ReadinessScore {
  const drivers: string[] = [];
  let score = 100;

  score -= recoveryRisk.score * 0.35;
  score -= Math.max(0, 100 - planAdherence.score) * 0.2;
  score -= Math.max(0, 100 - dataFreshness.score) * 0.2;

  if (strengthStatus === "Strength/performance dropping") {
    score -= 15;
    drivers.push("Strength trend is dropping.");
  }

  if (currentPace >= 1.5) {
    score -= 10;
    drivers.push("Weight-loss pace is aggressive.");
  }

  if (recoveryRisk.level !== "Low") {
    drivers.push(`${recoveryRisk.level} recovery risk.`);
  }

  if (planAdherence.score < 70) {
    drivers.push(`${planAdherence.biggestBlocker} is limiting adherence.`);
  }

  if (dataFreshness.status === "Aging" || dataFreshness.status === "Stale") {
    drivers.push(`Data freshness is ${dataFreshness.status.toLowerCase()}.`);
  }

  const roundedScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score: roundedScore,
    status: getReadinessStatus(roundedScore),
    drivers: drivers.length > 0 ? drivers : ["No major readiness limits detected."],
    recommendation: getReadinessRecommendation(roundedScore),
  };
}

export function adjustDecisionForReadiness(
  decision: AgentDecision,
  readinessScore: ReadinessScore
): AgentDecision {
  if (readinessScore.status !== "Recovery priority") {
    return decision;
  }

  return {
    ...decision,
    action: "Focus recovery",
    priority: "Readiness",
    rationale:
      "Automatic readiness score is low, so recovery should come before harder dieting or training changes.",
    calorieGuidance:
      "Hold calories steady while recovery risk is elevated.",
    stepGuidance:
      "Keep steps consistent, but avoid forcing high-output activity days.",
    recoveryGuidance:
      "Prioritize sleep, fatigue management, and stable training performance for the next few days.",
    timelineGuidance:
      "Do not make the goal timeline more aggressive until readiness improves.",
  };
}

function getReadinessStatus(score: number): ReadinessScore["status"] {
  if (score >= 80) return "Train hard";
  if (score >= 65) return "Maintain plan";
  if (score >= 45) return "Manage load";
  return "Recovery priority";
}

function getReadinessRecommendation(score: number) {
  if (score >= 80) {
    return "Readiness is strong. Continue the active plan and train normally.";
  }

  if (score >= 65) {
    return "Maintain the plan, but avoid adding new stressors this week.";
  }

  if (score >= 45) {
    return "Manage training load and avoid aggressive calorie reductions.";
  }

  return "Prioritize recovery before making calorie, step, or timeline changes.";
}
