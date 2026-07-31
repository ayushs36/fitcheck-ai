import type {
  AgentCheck,
  AgentDecision,
  DailyBrief,
  DataFreshness,
  Goal,
  GoalMemory,
  LogEntry,
  NutritionDiagnosis,
  ReadinessScore,
  TrainingSignal,
} from "@/types/fitness";
import type { LoggingQuality } from "@/lib/logQuality";

type DailyBriefInput = {
  goal: Goal;
  goalMemory: GoalMemory;
  logs: LogEntry[];
  latestAgentCheck?: AgentCheck;
  agentDecision: AgentDecision;
  dataFreshness: DataFreshness;
  loggingQuality: LoggingQuality;
  readinessScore: ReadinessScore;
  nutritionDiagnosis: NutritionDiagnosis;
  trainingSignal: TrainingSignal;
};

export function getDailyBrief({
  goal,
  goalMemory,
  logs,
  latestAgentCheck,
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
  const operatingMode = getAgentOperatingMode({
    logs: sortedLogs,
    latestAgentCheck,
    dataFreshness,
    loggingQuality,
    agentDecision,
  });

  return {
    status,
    agentMode: operatingMode.mode,
    todayFocus: getTodayFocus(status, agentDecision, goal),
    goalContext: goalMemory.summary,
    checkpointStatus: operatingMode.checkpointStatus,
    agentRunAdvice: operatingMode.advice,
    changedSinceLastLog: getChangeSummary(latestLog, previousLog),
    nextAction:
      status === "Nutrition focus"
        ? nutritionDiagnosis.nutritionNextAction
        : getNextAction(agentDecision),
    confidence: getBriefConfidence(agentDecision, dataFreshness, loggingQuality),
    evidence: [
      `Decision: ${agentDecision.action}`,
      `Agent mode: ${operatingMode.mode}`,
      `Readiness: ${readinessScore.status} (${readinessScore.score}/100)`,
      `Logging: ${loggingQuality.summary}`,
      `Training: ${trainingSignal.status}`,
    ],
  };
}

function getAgentOperatingMode({
  logs,
  latestAgentCheck,
  dataFreshness,
  loggingQuality,
  agentDecision,
}: {
  logs: LogEntry[];
  latestAgentCheck?: AgentCheck;
  dataFreshness: DataFreshness;
  loggingQuality: LoggingQuality;
  agentDecision: AgentDecision;
}): {
  mode: DailyBrief["agentMode"];
  checkpointStatus: string;
  advice: string;
} {
  if (logs.length < 7) {
    return {
      mode: "Build baseline",
      checkpointStatus: `${logs.length}/7 logs saved before a reliable agent check.`,
      advice:
        "Keep logging whatever reliable fields you have. Run the agent after 7 saved days.",
    };
  }

  if (
    dataFreshness.status === "No data" ||
    dataFreshness.status === "Aging" ||
    dataFreshness.status === "Stale"
  ) {
    return {
      mode: "Refresh data",
      checkpointStatus: dataFreshness.message,
      advice: dataFreshness.recommendation,
    };
  }

  if (!latestAgentCheck) {
    return {
      mode: "Ready to run",
      checkpointStatus: "No saved agent check yet.",
      advice:
        "Run FitCheck Agent once so the app can save a baseline recommendation and start tracking follow-through.",
    };
  }

  const logsAfterCheck = getLogsAfterAgentCheck(logs, latestAgentCheck);
  const daysSinceCheck = getDaysSinceAgentCheck(latestAgentCheck);

  if (latestAgentCheck.decision && latestAgentCheck.decision !== agentDecision.action) {
    return {
      mode: "Rerun due",
      checkpointStatus: `Decision changed from ${latestAgentCheck.decision} to ${agentDecision.action}.`,
      advice:
        "Run FitCheck Agent again so the saved recommendation matches the current trend and decision engine.",
    };
  }

  if (logsAfterCheck.length >= 4 || daysSinceCheck >= 7) {
    return {
      mode: "Rerun due",
      checkpointStatus:
        logsAfterCheck.length >= 4
          ? `${logsAfterCheck.length} logs have been added since the last agent check.`
          : `Last agent check was ${daysSinceCheck} days ago.`,
      advice:
        "Run FitCheck Agent to convert the new logs into an updated recommendation.",
    };
  }

  if (loggingQuality.averageCoverageScore < 50) {
    return {
      mode: "Build baseline",
      checkpointStatus: `Recent logging coverage is ${loggingQuality.averageCoverageScore}%.`,
      advice:
        "Improve logging coverage before asking the agent to change calories, steps, or training.",
    };
  }

  return {
    mode: "Follow plan",
    checkpointStatus:
      logsAfterCheck.length > 0
        ? `${logsAfterCheck.length} log${
            logsAfterCheck.length === 1 ? "" : "s"
          } since the last agent check.`
        : "No new logs since the last agent check.",
    advice:
      "Keep executing the current recommendation until enough new data accumulates.",
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

  if (trainingSignal.status === "Technique watch") {
    return "Normal day";
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

function getLogsAfterAgentCheck(logs: LogEntry[], latestAgentCheck: AgentCheck) {
  const checkDate = parseAgentDate(latestAgentCheck.date);

  if (!checkDate) {
    return logs.slice(-7);
  }

  return logs.filter((log) => parseLogDate(log.date) > checkDate);
}

function getDaysSinceAgentCheck(latestAgentCheck: AgentCheck) {
  const checkDate = parseAgentDate(latestAgentCheck.date);

  if (!checkDate) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.floor((today.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24))
  );
}

function parseAgentDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function parseLogDate(date: string) {
  return new Date(`${date}T00:00:00`);
}
