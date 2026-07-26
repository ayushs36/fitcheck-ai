import type { LoggingQuality } from "@/lib/logQuality";
import type {
  AgentDecision,
  DataFreshness,
  Goal,
  GoalFeasibility,
  GoalForecast,
  MaintenanceEstimate,
  NutritionDiagnosis,
  PlanAdherence,
  ReadinessScore,
  TrainingSignal,
} from "@/types/fitness";

type AgentDecisionTraceInput = {
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
  agentDecision: AgentDecision;
  dataFreshness: DataFreshness;
  loggingQuality: LoggingQuality;
  nutritionDiagnosis: NutritionDiagnosis;
  planAdherence: PlanAdherence;
  readinessScore: ReadinessScore;
  trainingSignal: TrainingSignal;
  goalForecast: GoalForecast;
};

export type AgentDecisionTraceSignal = {
  label: string;
  value: string;
  interpretation: string;
  weight: "High" | "Medium" | "Low";
};

export type AgentDecisionTrace = {
  summary: string;
  topSignals: AgentDecisionTraceSignal[];
  decisionPath: string[];
  guardrails: string[];
  suppressedActions: string[];
  nextDataNeeded: string[];
};

const PROTEIN_TARGET = 130;
const STEP_TARGET = 10000;

export function getAgentDecisionTrace(
  input: AgentDecisionTraceInput
): AgentDecisionTrace {
  const topSignals = getTopSignals(input);
  const decisionPath = getDecisionPath(input);
  const guardrails = getGuardrails(input);
  const suppressedActions = getSuppressedActions(input);
  const nextDataNeeded = getNextDataNeeded(input);

  return {
    summary: `FitCheck chose "${input.agentDecision.action}" because ${input.agentDecision.rationale.toLowerCase()}`,
    topSignals,
    decisionPath,
    guardrails,
    suppressedActions,
    nextDataNeeded,
  };
}

function getTopSignals(input: AgentDecisionTraceInput) {
  const {
    agentDecision,
    avgCalories,
    avgProtein,
    avgSteps,
    currentPace,
    dataFreshness,
    goal,
    goalForecast,
    loggingQuality,
    maintenanceEstimate,
    nutritionDiagnosis,
    planAdherence,
    readinessScore,
    requiredWeeklyLoss,
    trainingSignal,
  } = input;

  const signals: AgentDecisionTraceSignal[] = [
    {
      label: "Decision",
      value: agentDecision.action,
      interpretation: agentDecision.priority,
      weight: "High",
    },
    {
      label: "Trend pace",
      value: formatPace(currentPace, goal),
      interpretation:
        requiredWeeklyLoss > 0
          ? `Needs about ${requiredWeeklyLoss.toFixed(1)} lb/week for the current goal.`
          : "No loss pace required for the current goal.",
      weight: "High",
    },
    {
      label: "Nutrition execution",
      value: `${nutritionDiagnosis.score}/100`,
      interpretation: nutritionDiagnosis.biggestBlocker,
      weight: nutritionDiagnosis.score < 70 ? "High" : "Medium",
    },
    {
      label: "Training signal",
      value: trainingSignal.status,
      interpretation: trainingSignal.agentTrainingInsight,
      weight:
        trainingSignal.status === "Recovery risk" ||
        trainingSignal.status === "Stalled"
          ? "High"
          : "Medium",
    },
    {
      label: "Data quality",
      value: `${loggingQuality.averageCoverageScore}% coverage`,
      interpretation: loggingQuality.summary,
      weight: loggingQuality.averageCoverageScore < 70 ? "High" : "Medium",
    },
    {
      label: "Freshness",
      value: dataFreshness.status,
      interpretation: dataFreshness.recommendation,
      weight: dataFreshness.status === "Stale" ? "High" : "Low",
    },
    {
      label: "Maintenance",
      value: `${maintenanceEstimate.confidence} confidence`,
      interpretation: maintenanceEstimate.confidenceReason,
      weight: maintenanceEstimate.confidence === "Low" ? "High" : "Medium",
    },
    {
      label: "Plan adherence",
      value: `${planAdherence.score}/100`,
      interpretation: planAdherence.biggestBlocker,
      weight: planAdherence.score < 70 ? "High" : "Medium",
    },
    {
      label: "Goal forecast",
      value: goalForecast.status,
      interpretation: goalForecast.recommendation,
      weight: goalForecast.status === "Unrealistic" ? "High" : "Medium",
    },
    {
      label: "Current averages",
      value: `${Math.round(avgCalories || 0)} cal, ${Math.round(
        avgProtein || 0
      )}g protein, ${Math.round(avgSteps || 0).toLocaleString()} steps`,
      interpretation: "Used as the execution baseline before changing targets.",
      weight: "Low",
    },
  ];

  return signals
    .sort((a, b) => weightRank(b.weight) - weightRank(a.weight))
    .slice(0, 5);
}

function getDecisionPath(input: AgentDecisionTraceInput) {
  const path = [
    `Checked logging quality first: ${input.loggingQuality.summary}`,
    `Checked goal feasibility: ${input.goalFeasibility.verdict} with ${input.goalFeasibility.score}/100 score.`,
    `Checked nutrition execution: ${input.nutritionDiagnosis.biggestBlocker}`,
    `Checked training and recovery: ${input.trainingSignal.status}; ${input.readinessScore.status}.`,
  ];

  if (input.agentDecision.action === "Improve protein") {
    path.push(
      `Protein averaged ${Math.round(
        input.avgProtein
      )}g, below the ${PROTEIN_TARGET}g minimum target.`
    );
  }

  if (input.agentDecision.action === "Increase steps") {
    path.push(
      `Steps averaged ${Math.round(
        input.avgSteps
      ).toLocaleString()}, below the ${STEP_TARGET.toLocaleString()} target.`
    );
  }

  if (input.agentDecision.action === "Reduce calories") {
    path.push(
      "Protein and steps were close enough to target, so the agent allowed a small calorie adjustment."
    );
  }

  if (input.agentDecision.action === "Adjust goal timeline") {
    path.push(
      `Goal pace needed ${input.requiredWeeklyLoss.toFixed(
        1
      )} lb/week, so timeline pressure was the primary issue.`
    );
  }

  if (input.agentDecision.action === "Focus recovery") {
    path.push(
      "Training performance/recovery risk was prioritized before making the deficit harder."
    );
  }

  path.push(`Final action: ${input.agentDecision.action}.`);

  return path;
}

function getGuardrails(input: AgentDecisionTraceInput) {
  const guardrails = [
    "Partial logs count as unknown data, not failed adherence.",
    "One lighter workout does not count as strength loss when it may be form or technique work.",
    "The agent waits for a 2-3 week training comparison before calling strength regression.",
  ];

  if (
    input.maintenanceEstimate.confidence === "Low" ||
    input.maintenanceEstimate.trendWarning
  ) {
    guardrails.push(
      "Low-confidence maintenance estimates cannot trigger aggressive calorie cuts."
    );
  }

  if (input.dataFreshness.status === "Aging" || input.dataFreshness.status === "Stale") {
    guardrails.push("Stale data lowers confidence before any plan change.");
  }

  if (input.readinessScore.status === "Recovery priority") {
    guardrails.push("Recovery risk blocks extra deficit pressure.");
  }

  return guardrails;
}

function getSuppressedActions(input: AgentDecisionTraceInput) {
  const suppressed: string[] = [];

  if (input.agentDecision.action !== "Reduce calories") {
    suppressed.push(
      input.maintenanceEstimate.confidence === "Low"
        ? "Did not reduce calories because maintenance confidence is low."
        : "Did not reduce calories because another blocker had higher priority."
    );
  }

  if (input.agentDecision.action !== "Increase steps" && input.avgSteps < STEP_TARGET) {
    suppressed.push(
      "Did not make steps the main action because the current decision has a stronger limiting factor."
    );
  }

  if (
    input.agentDecision.action !== "Improve protein" &&
    input.avgProtein > 0 &&
    input.avgProtein < PROTEIN_TARGET
  ) {
    suppressed.push(
      "Protein is still watched, but it was not the highest-priority adjustment."
    );
  }

  if (
    input.agentDecision.action !== "Adjust goal timeline" &&
    input.goalForecast.status !== "Unrealistic"
  ) {
    suppressed.push("Did not change the goal date because the forecast is not forced yet.");
  }

  return suppressed.slice(0, 4);
}

function getNextDataNeeded(input: AgentDecisionTraceInput) {
  const nextData: string[] = [];

  if (input.logsCount < 14) {
    nextData.push("At least 14 logs for a stronger trend read.");
  }

  if (input.loggingQuality.commonMissingFields.length > 0) {
    nextData.push(
      `More complete ${input.loggingQuality.commonMissingFields.join(
        ", "
      ).toLowerCase()} logs.`
    );
  }

  if (input.trainingSignal.weeklyComparisonCount < 2) {
    nextData.push("More repeat workouts so strength can be compared fairly.");
  }

  if (input.dataFreshness.status !== "Fresh") {
    nextData.push("A fresh log before making a high-confidence adjustment.");
  }

  if (nextData.length === 0) {
    nextData.push("Another 7-day trend window to confirm the decision.");
  }

  return nextData;
}

function formatPace(pace: number, goal: Goal) {
  if (!Number.isFinite(pace) || pace === 0) {
    return goal === "Maintaining" ? "Weight stable" : "No clear trend";
  }

  const direction =
    pace > 0 ? (goal === "Bulking" ? "gaining" : "losing") : "gaining";

  return `${Math.abs(pace).toFixed(1)} lb/week ${direction}`;
}

function weightRank(weight: AgentDecisionTraceSignal["weight"]) {
  if (weight === "High") return 3;
  if (weight === "Medium") return 2;
  return 1;
}
