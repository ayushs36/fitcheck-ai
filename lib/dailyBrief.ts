import type {
  AgentDecision,
  DailyBrief,
  DataFreshness,
  Goal,
  LogEntry,
  NutritionDiagnosis,
  ReadinessScore,
  TrainingSignal,
} from "@/types/fitness";
import type { LoggingQuality } from "@/lib/logQuality";

type DailyBriefInput = {
  goal: Goal;
  logs: LogEntry[];
  agentDecision: AgentDecision;
  dataFreshness: DataFreshness;
  loggingQuality: LoggingQuality;
  readinessScore: ReadinessScore;
  nutritionDiagnosis: NutritionDiagnosis;
  trainingSignal: TrainingSignal;
};

export function getDailyBrief({
  goal,
  logs,
  agentDecision,
  dataFreshness,
  loggingQuality,
  readinessScore,
  nutritionDiagnosis,
  trainingSignal,
}: DailyBriefInput): DailyBrief {
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const latestLog = sortedLogs[sortedLogs.length - 1];
  const previousLog = sortedLogs[sortedLogs.length - 2];
  const status = getBriefStatus({
    dataFreshness,
    readinessScore,
    nutritionDiagnosis,
    trainingSignal,
  });

  return {
    status,
    todayFocus: getTodayFocus(status, agentDecision, goal),
    changedSinceLastLog: getChangeSummary(latestLog, previousLog),
    nextAction: getNextAction(agentDecision),
    confidence: getBriefConfidence(agentDecision, dataFreshness, loggingQuality),
    evidence: [
      `Decision: ${agentDecision.action}`,
      `Readiness: ${readinessScore.status} (${readinessScore.score}/100)`,
      `Logging: ${loggingQuality.summary}`,
      `Training: ${trainingSignal.status}`,
    ],
  };
}

function getBriefStatus({
  dataFreshness,
  readinessScore,
  nutritionDiagnosis,
  trainingSignal,
}: {
  dataFreshness: DataFreshness;
  readinessScore: ReadinessScore;
  nutritionDiagnosis: NutritionDiagnosis;
  trainingSignal: TrainingSignal;
}): DailyBrief["status"] {
  if (dataFreshness.status === "Aging" || dataFreshness.status === "Stale") {
    return "Data refresh";
  }

  if (
    readinessScore.status === "Recovery priority" ||
    trainingSignal.status === "Recovery risk"
  ) {
    return "Recovery watch";
  }

  if (nutritionDiagnosis.status === "Needs attention") {
    return "Nutrition focus";
  }

  if (trainingSignal.status === "Progressing") {
    return "Progress day";
  }

  return "Normal day";
}

function getTodayFocus(
  status: DailyBrief["status"],
  agentDecision: AgentDecision,
  goal: Goal
) {
  if (status === "Data refresh") {
    return "Refresh today's log before treating trend changes as decisive.";
  }

  if (status === "Recovery watch") {
    return "Protect recovery and avoid adding stress until performance stabilizes.";
  }

  if (status === "Nutrition focus") {
    return "Tighten calorie and protein execution before changing the plan.";
  }

  if (status === "Progress day") {
    return "Keep the current plan steady and repeat what is working.";
  }

  return goal === "Maintaining"
    ? "Keep inputs steady and watch for trend drift."
    : `${agentDecision.priority}: ${agentDecision.rationale}`;
}

function getChangeSummary(
  latestLog: LogEntry | undefined,
  previousLog: LogEntry | undefined
) {
  if (!latestLog) {
    return "No saved logs yet.";
  }

  if (!previousLog) {
    return `Latest saved log is ${latestLog.date}. Add another log to compare changes.`;
  }

  const changes = [
    getNumberChange("Weight", latestLog.weight, previousLog.weight, "lbs"),
    getNumberChange("Calories", latestLog.calories, previousLog.calories, "cal"),
    getNumberChange("Protein", latestLog.protein, previousLog.protein, "g"),
    getNumberChange("Steps", latestLog.steps, previousLog.steps, "steps"),
    getWorkoutChange(latestLog, previousLog),
  ].filter(Boolean);

  return changes.length > 0
    ? changes.slice(0, 3).join(" | ")
    : "No comparable changes from the previous saved log.";
}

function getNumberChange(
  label: string,
  latestValue: number,
  previousValue: number,
  suffix: string
) {
  if (latestValue <= 0 || previousValue <= 0) {
    return null;
  }

  const change = latestValue - previousValue;

  if (change === 0) {
    return `${label}: no change`;
  }

  const direction = change > 0 ? "up" : "down";
  const formattedChange =
    suffix === "lbs" ? Math.abs(change).toFixed(1) : Math.abs(Math.round(change));

  return `${label}: ${direction} ${formattedChange} ${suffix}`;
}

function getWorkoutChange(latestLog: LogEntry, previousLog: LogEntry) {
  const latestWorkout = latestLog.workout.trim();
  const previousWorkout = previousLog.workout.trim();

  if (!latestWorkout || latestWorkout === previousWorkout) {
    return null;
  }

  return `Workout: ${previousWorkout || "none"} -> ${latestWorkout}`;
}

function getNextAction(agentDecision: AgentDecision) {
  if (agentDecision.action === "Improve protein") {
    return agentDecision.proteinGuidance;
  }

  if (agentDecision.action === "Increase steps") {
    return agentDecision.stepGuidance;
  }

  if (agentDecision.action === "Focus recovery") {
    return agentDecision.recoveryGuidance;
  }

  if (agentDecision.action === "Adjust goal timeline") {
    return agentDecision.timelineGuidance;
  }

  return agentDecision.calorieGuidance;
}

function getBriefConfidence(
  agentDecision: AgentDecision,
  dataFreshness: DataFreshness,
  loggingQuality: LoggingQuality
): DailyBrief["confidence"] {
  if (
    dataFreshness.confidenceImpact === "High" ||
    loggingQuality.averageCoverageScore < 50
  ) {
    return "Low";
  }

  if (
    agentDecision.confidence === "High" &&
    loggingQuality.averageCoverageScore >= 75
  ) {
    return "High";
  }

  return agentDecision.confidence === "Low" ? "Low" : "Medium";
}
