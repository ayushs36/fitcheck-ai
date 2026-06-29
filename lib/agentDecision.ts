import type {
  AgentDecision,
  Goal,
  GoalFeasibility,
  MaintenanceEstimate,
} from "@/types/fitness";

type AgentDecisionInput = {
  goal: Goal;
  logsCount: number;
  avgCalories: number;
  avgProtein: number;
  avgSteps: number;
  currentPace: number;
  requiredWeeklyLoss: number;
  plateauStatus: string;
  strengthStatus: string;
  goalStatus: string;
  goalFeasibility: GoalFeasibility;
  maintenanceEstimate: MaintenanceEstimate;
};

const PROTEIN_TARGET = 130;
const STEP_TARGET = 10000;

export function getAgentDecision(input: AgentDecisionInput): AgentDecision {
  const {
    goal,
    logsCount,
    avgCalories,
    avgProtein,
    avgSteps,
    currentPace,
    requiredWeeklyLoss,
    plateauStatus,
    strengthStatus,
    goalStatus,
    goalFeasibility,
    maintenanceEstimate,
  } = input;

  const confidence = getDecisionConfidence(logsCount, maintenanceEstimate);
  const calorieTarget = getCalorieTarget(avgCalories, maintenanceEstimate);
  const proteinTargetText = `${PROTEIN_TARGET}-150g/day`;
  const stepTargetText = `${STEP_TARGET.toLocaleString()} steps/day`;
  const isCutting = goal === "Cutting";
  const proteinLow = avgProtein > 0 && avgProtein < PROTEIN_TARGET;
  const stepsLow = avgSteps > 0 && avgSteps < STEP_TARGET;
  const plateauDetected = plateauStatus === "Potential plateau detected";
  const strengthDropping = strengthStatus === "Strength/performance dropping";
  const goalUnrealistic =
    goalFeasibility.verdict === "Unlikely" ||
    goalStatus === "Behind schedule" ||
    (requiredWeeklyLoss > 2 && goalFeasibility.daysRemaining > 0);
  const paceTooSlow =
    isCutting &&
    requiredWeeklyLoss > 0 &&
    (currentPace <= 0 || currentPace < requiredWeeklyLoss * 0.75);
  const paceAggressive = isCutting && currentPace >= 1.5;

  if (goalUnrealistic) {
    return {
      action: "Adjust goal timeline",
      priority: "Goal feasibility",
      rationale:
        "The current deadline requires more progress than your trend supports.",
      calorieGuidance:
        "Do not force an extreme deficit to rescue the timeline. Keep calories in a sustainable fat-loss range.",
      proteinGuidance: `Keep protein near ${proteinTargetText} while changing the timeline.`,
      stepGuidance: `Hold steps near ${stepTargetText} before adding more pressure.`,
      recoveryGuidance:
        "Protect lifting performance and sleep while the goal date is adjusted.",
      timelineGuidance:
        "Extend the goal date or reduce the aggressiveness of the target before lowering calories further.",
      confidence,
    };
  }

  if (proteinLow) {
    return {
      action: "Improve protein",
      priority: "Muscle retention",
      rationale:
        "Protein is below the minimum target for preserving strength and lean mass.",
      calorieGuidance:
        "Hold calories steady while shifting food choices toward higher-protein meals.",
      proteinGuidance: `Raise protein from ${avgProtein.toFixed(
        0
      )}g toward ${proteinTargetText}.`,
      stepGuidance: `Keep steps close to ${stepTargetText}; do not trade protein consistency for more cardio.`,
      recoveryGuidance:
        "Keep training performance stable while protein intake catches up.",
      timelineGuidance:
        "Do not change the goal date based on protein alone unless progress also falls behind.",
      confidence,
    };
  }

  if (strengthDropping && (paceAggressive || maintenanceEstimate.confidence !== "Low")) {
    return {
      action: "Focus recovery",
      priority: "Training performance",
      rationale:
        "Strength is dropping, so recovery should be addressed before making the deficit harder.",
      calorieGuidance:
        "Hold calories for now; avoid cutting lower until performance stabilizes.",
      proteinGuidance: `Keep protein near ${proteinTargetText}.`,
      stepGuidance:
        "Keep steps consistent instead of adding large spikes in activity.",
      recoveryGuidance:
        "Prioritize sleep, manage fatigue, and consider easier training volume for the next week.",
      timelineGuidance:
        "If performance keeps falling, use a slower goal pace rather than a harsher deficit.",
      confidence,
    };
  }

  if ((plateauDetected || paceTooSlow) && stepsLow) {
    return {
      action: "Increase steps",
      priority: "Activity consistency",
      rationale:
        "Progress is slow or flat while average steps are below target.",
      calorieGuidance:
        "Hold calories while increasing activity first; this is usually easier to recover from than cutting food harder.",
      proteinGuidance: `Keep protein near ${proteinTargetText}.`,
      stepGuidance: `Increase steps from ${avgSteps.toFixed(
        0
      )} toward ${stepTargetText}.`,
      recoveryGuidance:
        "Add steps gradually so leg fatigue does not hurt workouts.",
      timelineGuidance:
        "Reassess the timeline after 7 more days at the higher step baseline.",
      confidence,
    };
  }

  if (plateauDetected || paceTooSlow) {
    return {
      action: "Reduce calories",
      priority: "Calorie adjustment",
      rationale:
        "Progress is slow or flat while protein and steps are already near target.",
      calorieGuidance:
        calorieTarget > 0
          ? `Reduce calories slightly toward about ${calorieTarget} cal/day.`
          : "Reduce calories slightly by about 100-150 cal/day.",
      proteinGuidance: `Keep protein near ${proteinTargetText}.`,
      stepGuidance: `Keep steps near ${stepTargetText}.`,
      recoveryGuidance:
        "Watch workout performance for the next week after reducing calories.",
      timelineGuidance:
        "Reassess the goal date after 7-14 days with the new calorie target.",
      confidence,
    };
  }

  return {
    action: "Hold calories",
    priority: "Consistency",
    rationale:
      "The current plan does not show a clear need for a calorie, step, recovery, or timeline change.",
    calorieGuidance:
      avgCalories > 0
        ? `Hold near your current ${avgCalories.toFixed(0)} cal/day average.`
        : "Keep calories consistent while more data comes in.",
    proteinGuidance: `Keep protein near ${proteinTargetText}.`,
    stepGuidance: `Keep steps near ${stepTargetText}.`,
    recoveryGuidance:
      "Keep training and sleep consistent so the trend data stays useful.",
    timelineGuidance:
      "Keep the current goal timeline unless the next trend check falls behind.",
    confidence,
  };
}

function getDecisionConfidence(
  logsCount: number,
  maintenanceEstimate: MaintenanceEstimate
): AgentDecision["confidence"] {
  if (logsCount >= 28 && maintenanceEstimate.confidence === "High") {
    return "High";
  }

  if (logsCount >= 14 && maintenanceEstimate.confidence !== "Low") {
    return "Medium";
  }

  return "Low";
}

function getCalorieTarget(
  avgCalories: number,
  maintenanceEstimate: MaintenanceEstimate
) {
  if (maintenanceEstimate.fatLossCaloriesOnePound > 0) {
    return Math.round(maintenanceEstimate.fatLossCaloriesOnePound);
  }

  if (avgCalories > 0) {
    return Math.round(avgCalories - 150);
  }

  return 0;
}
