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
  const isBulking = goal === "Bulking";
  const isMaintaining = goal === "Maintaining";
  const proteinLow = avgProtein > 0 && avgProtein < PROTEIN_TARGET;
  const stepsLow = avgSteps > 0 && avgSteps < STEP_TARGET;
  const plateauDetected = plateauStatus === "Potential plateau detected";
  const strengthDropping = strengthStatus === "Strength/performance dropping";
  const goalUnrealistic =
    !isMaintaining &&
    (goalFeasibility.verdict === "Unlikely" ||
      goalStatus === "Behind schedule" ||
      (requiredWeeklyLoss > 2 && goalFeasibility.daysRemaining > 0));
  const paceTooSlow =
    !isMaintaining &&
    requiredWeeklyLoss > 0 &&
    (currentPace <= 0 || currentPace < requiredWeeklyLoss * 0.75);
  const paceAggressive = isCutting && currentPace >= 1.5;
  const bulkPaceFast = isBulking && currentPace >= 1;
  const maintenanceDrifting = isMaintaining && goalStatus !== "On track";

  if (goalUnrealistic) {
    return {
      action: "Adjust goal timeline",
      priority: "Goal feasibility",
      rationale:
        "The current deadline requires more progress than your trend supports.",
      calorieGuidance:
        isBulking
          ? "Do not force an excessive surplus to rescue the timeline. Keep the bulk slow enough to support training without unnecessary fat gain."
          : "Do not force an extreme deficit to rescue the timeline. Keep calories in a sustainable fat-loss range.",
      proteinGuidance: `Keep protein near ${proteinTargetText} while changing the timeline.`,
      stepGuidance: `Hold steps near ${stepTargetText} before adding more pressure.`,
      recoveryGuidance:
        "Protect lifting performance and sleep while the goal date is adjusted.",
      timelineGuidance:
        "Extend the goal date or reduce the aggressiveness of the target before lowering calories further.",
      confidence,
    };
  }

  if (isMaintaining && maintenanceDrifting) {
    return {
      action: "Hold calories",
      priority: "Weight stability",
      rationale:
        "The active goal is maintenance, so the agent is watching whether weight stays inside a stable range instead of chasing loss or gain.",
      calorieGuidance:
        "Hold calories steady for the next 7 days and use the trend before making a small 100-150 calorie adjustment.",
      proteinGuidance: `Keep protein near ${proteinTargetText}.`,
      stepGuidance: `Keep steps close to ${stepTargetText} so maintenance is easier to interpret.`,
      recoveryGuidance:
        "Keep training, sleep, sodium, carbs, and weigh-in timing consistent before changing the plan.",
      timelineGuidance:
        "A maintenance goal does not need an aggressive deadline; review stability after the next trend window.",
      confidence,
    };
  }

  if (isCutting && maintenanceEstimate.confidence === "Low" && maintenanceEstimate.trendWarning) {
    return {
      action: "Hold calories",
      priority: "Data validation",
      rationale:
        "The weight trend is moving against the fat-loss goal, but the maintenance estimate is low-confidence, so a calorie cut would be premature.",
      calorieGuidance:
        "Hold calories steady for the next 7 days if adherence is solid. If the trend keeps rising, audit tracking accuracy before lowering calories.",
      proteinGuidance: `Keep protein near ${proteinTargetText}.`,
      stepGuidance: `Keep steps close to ${stepTargetText} so the next trend check is easier to interpret.`,
      recoveryGuidance:
        "Watch sleep, soreness, sodium, carbs, and digestion because water-weight noise can hide the real trend.",
      timelineGuidance:
        "Do not adjust the goal timeline from this maintenance estimate alone.",
      confidence: "Low",
    };
  }

  if (isBulking && bulkPaceFast) {
    return {
      action: "Hold calories",
      priority: "Lean bulk control",
      rationale:
        "Weight is rising faster than a controlled bulk usually needs, so the agent is preventing an unnecessary surplus increase.",
      calorieGuidance:
        "Hold calories or trim the surplus slightly if the next 7-day trend is still gaining quickly.",
      proteinGuidance: `Keep protein near ${proteinTargetText}.`,
      stepGuidance: `Keep steps close to ${stepTargetText} instead of letting activity swing wildly.`,
      recoveryGuidance:
        "Keep training performance progressing without using scale gain as the only success metric.",
      timelineGuidance:
        "Keep the bulk timeline flexible so gaining stays controlled.",
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
        goal === "Cutting"
          ? "Strength is dropping, so recovery should be addressed before making the deficit harder."
          : "Strength is dropping, so recovery should be addressed before changing calories.",
      calorieGuidance:
        goal === "Cutting"
          ? "Hold calories for now; avoid cutting lower until performance stabilizes."
          : "Hold calories for now; avoid changing the target until performance stabilizes.",
      proteinGuidance: `Keep protein near ${proteinTargetText}.`,
      stepGuidance:
        "Keep steps consistent instead of adding large spikes in activity.",
      recoveryGuidance:
        "Prioritize sleep, manage fatigue, and consider easier training volume for the next week.",
      timelineGuidance:
        goal === "Cutting"
          ? "If performance keeps falling, use a slower goal pace rather than a harsher deficit."
          : "If performance keeps falling, use a slower goal pace rather than forcing more scale movement.",
      confidence,
    };
  }

  if ((plateauDetected || paceTooSlow) && stepsLow) {
    return {
      action: isBulking ? "Hold calories" : "Increase steps",
      priority: isBulking ? "Bulk consistency" : "Activity consistency",
      rationale:
        isBulking
          ? "Weight gain is slow, but steps are also below target, so the agent needs a consistent baseline before raising calories."
          : "Progress is slow or flat while average steps are below target.",
      calorieGuidance:
        isBulking
          ? "Hold calories until activity is consistent enough to judge whether the surplus is truly too small."
          : "Hold calories while increasing activity first; this is usually easier to recover from than cutting food harder.",
      proteinGuidance: `Keep protein near ${proteinTargetText}.`,
      stepGuidance: isBulking
        ? `Bring steps from ${avgSteps.toFixed(0)} toward a repeatable baseline near ${stepTargetText}.`
        : `Increase steps from ${avgSteps.toFixed(0)} toward ${stepTargetText}.`,
      recoveryGuidance:
        "Add steps gradually so leg fatigue does not hurt workouts.",
      timelineGuidance:
        isBulking
          ? "Reassess the bulk pace after 7 more days with steadier activity."
          : "Reassess the timeline after 7 more days at the higher step baseline.",
      confidence,
    };
  }

  if (plateauDetected || paceTooSlow) {
    return {
      action: isBulking ? "Increase calories" : "Reduce calories",
      priority: isBulking ? "Surplus review" : "Calorie adjustment",
      rationale:
        isBulking
          ? "Bulk progress is slow or flat while protein and steps are usable, so a small surplus increase is the next reasonable lever."
          : "Progress is slow or flat while protein and steps are already near target.",
      calorieGuidance:
        isBulking
          ? "Increase calories slightly by about 100-150/day, then judge the next 7-14 day trend."
          : calorieTarget > 0
          ? `Reduce calories slightly toward about ${calorieTarget} cal/day.`
          : "Reduce calories slightly by about 100-150 cal/day.",
      proteinGuidance: `Keep protein near ${proteinTargetText}.`,
      stepGuidance: `Keep steps near ${stepTargetText}.`,
      recoveryGuidance:
        isBulking
          ? "Use workout performance as the main check that the surplus is productive."
          : "Watch workout performance for the next week after reducing calories.",
      timelineGuidance:
        isBulking
          ? "Reassess the goal date after 7-14 days with the same activity baseline."
          : "Reassess the goal date after 7-14 days with the new calorie target.",
      confidence,
    };
  }

  return {
    action: "Hold calories",
    priority: "Consistency",
    rationale:
      isMaintaining
        ? "The current maintenance plan does not show a clear need for a calorie, step, recovery, or timeline change."
        : "The current plan does not show a clear need for a calorie, step, recovery, or timeline change.",
    calorieGuidance:
      avgCalories > 0
        ? `Hold near your current ${avgCalories.toFixed(0)} cal/day average.`
        : "Keep calories consistent while more data comes in.",
    proteinGuidance: `Keep protein near ${proteinTargetText}.`,
    stepGuidance: `Keep steps near ${stepTargetText}.`,
    recoveryGuidance:
      "Keep training and sleep consistent so the trend data stays useful.",
    timelineGuidance:
      isMaintaining
        ? "Maintenance success is based on trend stability, not forcing a target date."
        : "Keep the current goal timeline unless the next trend check falls behind.",
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
  if (!maintenanceEstimate.calorieTargetsReliable) {
    return avgCalories > 0 ? Math.round(avgCalories - 100) : 0;
  }

  if (maintenanceEstimate.fatLossCaloriesOnePound > 0) {
    return Math.round(maintenanceEstimate.fatLossCaloriesOnePound);
  }

  if (avgCalories > 0) {
    return Math.round(avgCalories - 150);
  }

  return 0;
}
