import type {
  AgentDecision,
  Goal,
  GoalAdaptation,
  GoalFeasibility,
  LogEntry,
  MaintenanceEstimate,
  NutritionTargets,
  PlanAdjustment,
  RecoveryRisk,
  WeeklyPlan,
} from "@/types/fitness";
import { addDays } from "@/lib/calculations";

type AdvancedInsightInput = {
  goal: Goal;
  logs: LogEntry[];
  effectiveWeight: number;
  goalWeight: number;
  goalDate: string;
  avgCalories: number;
  avgProtein: number;
  avgSteps: number;
  currentPace: number;
  requiredWeeklyLoss: number;
  goalStatus: string;
  plateauStatus: string;
  strengthStatus: string;
  volumeChange: number;
  goalFeasibility: GoalFeasibility;
  maintenanceEstimate: MaintenanceEstimate;
  agentDecision: AgentDecision;
};

export function getGoalAdaptation(input: AdvancedInsightInput): GoalAdaptation {
  const {
    goal,
    effectiveWeight,
    goalWeight,
    goalDate,
    avgCalories,
    currentPace,
    requiredWeeklyLoss,
    goalStatus,
    goalFeasibility,
    maintenanceEstimate,
  } = input;
  const poundsRemaining = Math.max(0, effectiveWeight - goalWeight);
  const needsTimelineChange =
    goal === "Cutting" &&
    poundsRemaining > 0 &&
    (goalFeasibility.verdict === "Unlikely" ||
      goalStatus === "Behind schedule" ||
      requiredWeeklyLoss > 1.5);
  const sustainablePace = currentPace >= 0.5 ? Math.min(currentPace, 1.25) : 0.75;
  const suggestedGoalDate =
    needsTimelineChange && poundsRemaining > 0
      ? addDays(new Date(), Math.ceil((poundsRemaining / sustainablePace) * 7))
          .toISOString()
          .slice(0, 10)
      : null;
  const suggestedCalories =
    maintenanceEstimate.fatLossCaloriesOnePound > 0
      ? Math.round(maintenanceEstimate.fatLossCaloriesOnePound)
      : avgCalories > 0
      ? Math.round(avgCalories - 150)
      : null;

  if (needsTimelineChange) {
    return {
      status: "Adapt goal timeline",
      suggestedGoalDate,
      suggestedCalories,
      recommendation:
        "Extend the target date and keep the deficit sustainable instead of forcing aggressive cuts.",
      reason: `The required pace is ${requiredWeeklyLoss.toFixed(
        1
      )} lbs/week, which is above the current trend.`,
      confidence: goalFeasibility.score >= 45 ? "Medium" : "High",
    };
  }

  return {
    status: "Goal plan is acceptable",
    suggestedGoalDate: null,
    suggestedCalories,
    recommendation:
      "Keep the current target date and only make small nutrition/activity changes if the next trend check slips.",
    reason: `Current status is ${goalStatus} with a feasibility score of ${goalFeasibility.score}/100.`,
    confidence: goalFeasibility.score >= 70 ? "High" : "Medium",
  };
}

export function getNutritionTargets(
  input: AdvancedInsightInput
): NutritionTargets {
  const { goal, effectiveWeight, avgCalories, avgProtein, maintenanceEstimate } =
    input;
  const proteinTarget = Math.round(Math.max(130, effectiveWeight));
  const calorieTarget =
    goal === "Cutting"
      ? maintenanceEstimate.fatLossCaloriesOnePound || avgCalories - 150
      : goal === "Bulking"
      ? maintenanceEstimate.estimatedMaintenance + 250 || avgCalories + 200
      : maintenanceEstimate.estimatedMaintenance || avgCalories;
  const roundedCalories = Math.max(1200, Math.round(calorieTarget || 0));
  const calorieRange =
    roundedCalories > 0
      ? `${roundedCalories - 100}-${roundedCalories + 100} cal/day`
      : "Need more calorie data";

  return {
    calorieTarget: roundedCalories,
    calorieRange,
    proteinTarget,
    proteinRange: `${proteinTarget}-${proteinTarget + 20}g/day`,
    priority:
      avgProtein < proteinTarget
        ? "Raise protein first"
        : "Keep calories consistent",
    guidance:
      avgProtein < proteinTarget
        ? "Protein is the highest-leverage nutrition target before changing calories again."
        : "Nutrition is close enough that consistency matters more than another aggressive adjustment.",
    confidence: maintenanceEstimate.confidence,
  };
}

export function getWeeklyPlan(input: AdvancedInsightInput): WeeklyPlan {
  const nutritionTargets = getNutritionTargets(input);
  const workoutLogs = input.logs.slice(-7).filter((log) => log.exercises.length > 0);
  const caloriesHit = input.avgCalories > 0 ? 25 : 0;
  const proteinHit =
    input.avgProtein >= nutritionTargets.proteinTarget ? 25 : Math.round((input.avgProtein / nutritionTargets.proteinTarget) * 25);
  const stepsHit = input.avgSteps >= 10000 ? 25 : Math.round((input.avgSteps / 10000) * 25);
  const trainingHit = workoutLogs.length >= 3 ? 25 : Math.round((workoutLogs.length / 3) * 25);
  const adherenceScore = Math.min(100, caloriesHit + proteinHit + stepsHit + trainingHit);

  return {
    focus: input.agentDecision.action,
    calories: nutritionTargets.calorieRange,
    protein: nutritionTargets.proteinRange,
    steps: input.avgSteps >= 10000 ? "Hold 10,000+ steps/day" : "Build toward 10,000 steps/day",
    training:
      workoutLogs.length >= 3
        ? "Keep 3-4 lifting sessions with stable performance."
        : "Log at least 3 lifting sessions this week.",
    recovery:
      input.strengthStatus === "Strength/performance dropping"
        ? "Add recovery emphasis before increasing deficit."
        : "Keep sleep and fatigue steady while trend data updates.",
    adjustment: getPlanAdjustment(input, nutritionTargets),
    adherenceScore,
    adherenceSummary: `${adherenceScore}/100 based on calorie logging, protein, steps, and lifting frequency over the last 7 logs.`,
  };
}

function getPlanAdjustment(
  input: AdvancedInsightInput,
  nutritionTargets: NutritionTargets
): PlanAdjustment {
  const calorieTargetText =
    nutritionTargets.calorieTarget > 0
      ? `${nutritionTargets.calorieTarget} cal/day`
      : "a measured calorie target";

  if (input.agentDecision.action === "Adjust goal timeline") {
    return {
      status: "Change goal pace",
      recommendation:
        "Adjust the goal date or weekly pace before making nutrition more aggressive.",
      trigger: `Required pace is ${input.requiredWeeklyLoss.toFixed(1)} lb/week.`,
      guardrail:
        "Do not use an extreme deficit to force a timeline that the trend does not support.",
      reviewWindow: "Review after accepting or rejecting the goal adaptation.",
      confidence: input.goalFeasibility.score < 50 ? "High" : "Medium",
    };
  }

  if (input.agentDecision.action === "Improve protein") {
    return {
      status: "Improve protein first",
      recommendation:
        "Hold calories steady and make protein the adjustment before cutting food lower.",
      trigger: `Average protein is ${input.avgProtein.toFixed(0)}g/day versus ${nutritionTargets.proteinTarget}g+ target.`,
      guardrail:
        "Do not lower calories until protein execution is strong enough to protect training and lean mass.",
      reviewWindow: "Review after 7 more protein logs.",
      confidence: input.agentDecision.confidence,
    };
  }

  if (input.agentDecision.action === "Increase steps") {
    return {
      status: "Increase activity",
      recommendation:
        "Raise the step baseline before reducing calories again.",
      trigger: `Average steps are ${input.avgSteps.toFixed(0)}/day while progress is slow or flat.`,
      guardrail:
        "Increase steps gradually so fatigue does not interfere with lifting performance.",
      reviewWindow: "Review after 7 days near the higher step baseline.",
      confidence: input.agentDecision.confidence,
    };
  }

  if (input.agentDecision.action === "Focus recovery") {
    return {
      status: "Protect recovery",
      recommendation:
        "Hold calories and reduce fatigue pressure until training performance stabilizes.",
      trigger: input.strengthStatus,
      guardrail:
        "Do not add more deficit, cardio pressure, or volume while recovery is the limiting signal.",
      reviewWindow: "Review after the next 2 matching workouts.",
      confidence: input.agentDecision.confidence,
    };
  }

  if (input.agentDecision.action === "Reduce calories") {
    return {
      status: "Adjust calories",
      recommendation: `Move toward ${calorieTargetText} with a small adjustment, not a crash cut.`,
      trigger:
        input.plateauStatus === "Potential plateau detected"
          ? "Plateau risk is active while protein and steps are usable."
          : `Current pace is ${input.currentPace.toFixed(1)} lb/week versus ${input.requiredWeeklyLoss.toFixed(1)} required.`,
      guardrail:
        "Only keep the reduction if logging quality is solid and training performance does not slide.",
      reviewWindow: "Review after 7-14 days at the new calorie average.",
      confidence: input.agentDecision.confidence,
    };
  }

  return {
    status: "Hold plan",
    recommendation:
      "Keep the current plan and let the next trend window confirm whether a change is needed.",
    trigger:
      "No calorie, step, protein, recovery, or timeline change is strongly justified right now.",
    guardrail:
      "Do not adjust multiple levers at once when the current trend is interpretable.",
    reviewWindow: "Review after 7 more logged days.",
    confidence: input.agentDecision.confidence,
  };
}

export function getRecoveryRisk(input: AdvancedInsightInput): RecoveryRisk {
  const drivers: string[] = [];
  let score = 15;

  if (input.strengthStatus === "Strength/performance dropping") {
    score += 30;
    drivers.push("Strength/performance is dropping.");
  }

  if (input.currentPace >= 1.5) {
    score += 20;
    drivers.push("Weight loss pace is aggressive.");
  }

  if (input.avgProtein < 130) {
    score += 15;
    drivers.push("Protein is below the muscle-retention target.");
  }

  if (input.volumeChange < -10) {
    score += 20;
    drivers.push("Latest workout volume is down more than 10%.");
  }

  if (input.avgSteps > 14000) {
    score += 10;
    drivers.push("Steps are high enough to add fatigue.");
  }

  const cappedScore = Math.min(100, score);
  const level = cappedScore >= 70 ? "High" : cappedScore >= 40 ? "Medium" : "Low";

  return {
    score: cappedScore,
    level,
    drivers: drivers.length > 0 ? drivers : ["No major recovery red flags detected."],
    recommendation:
      level === "High"
        ? "Hold calories, protect sleep, and reduce training stress for 3-5 days."
        : level === "Medium"
        ? "Keep the plan steady, but watch strength and fatigue before adding more deficit."
        : "Recovery risk is low. Continue the current plan and monitor performance.",
  };
}
