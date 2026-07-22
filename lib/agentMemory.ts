import type {
  AgentCheck,
  AgentDecisionAction,
  AgentMemory,
  LogEntry,
  TrainingSignal,
} from "@/types/fitness";
import type { LoggingQuality } from "@/lib/logQuality";

const PROTEIN_TARGET = 130;
const STEP_TARGET = 10000;

type AgentMemoryInput = {
  agentHistory: AgentCheck[];
  logs: LogEntry[];
  avgProtein: number;
  avgSteps: number;
  avgCalories: number;
  currentDecision: AgentDecisionAction;
  trainingSignal: TrainingSignal;
  loggingQuality: LoggingQuality;
};

export function getAgentMemory({
  agentHistory,
  logs,
  avgProtein,
  avgSteps,
  avgCalories,
  currentDecision,
  trainingSignal,
  loggingQuality,
}: AgentMemoryInput): AgentMemory {
  const recentChecks = agentHistory.slice(0, 6);
  const recurringRisk = getMostCommonRisk(recentChecks);
  const repeatedDecision = getMostCommonDecision(recentChecks);
  const latestCheck = agentHistory[0];
  const latestDecision = latestCheck?.decision;
  const followThrough = getFollowThrough({
    decision: latestDecision,
    logs,
    avgProtein,
    avgSteps,
    avgCalories,
    trainingSignal,
    loggingQuality,
  });
  const actionReview = getActionReview({
    latestCheck,
    logs,
    currentDecision,
    trainingSignal,
    loggingQuality,
  });

  return {
    memoryDepth: agentHistory.length,
    recurringRisk: recurringRisk.value,
    recurringRiskCount: recurringRisk.count,
    repeatedDecision: repeatedDecision.value,
    repeatedDecisionCount: repeatedDecision.count,
    followThroughStatus: followThrough.status,
    followThroughEvidence: followThrough.evidence,
    trackedAction: actionReview.trackedAction,
    actionWindow: actionReview.window,
    actionResult: actionReview.result,
    actionEvidence: actionReview.evidence,
    actionNextStep: actionReview.nextStep,
    noticedPattern: getNoticedPattern({
      memoryDepth: agentHistory.length,
      recurringRisk,
      repeatedDecision,
      followThrough,
      actionReview,
    }),
  };
}

function getMostCommonRisk(agentHistory: AgentCheck[]) {
  const counts = new Map<string, { label: string; count: number }>();

  agentHistory.forEach((check) => {
    const risk = cleanMemoryText(check.biggestRisk);

    if (!risk) {
      return;
    }

    const key = risk.toLowerCase();
    const current = counts.get(key);
    counts.set(key, {
      label: current?.label ?? risk,
      count: (current?.count ?? 0) + 1,
    });
  });

  const mostCommon = Array.from(counts.values()).sort(
    (a, b) => b.count - a.count
  )[0];

  return {
    value: mostCommon?.label ?? "Not enough memory",
    count: mostCommon?.count ?? 0,
  };
}

function getMostCommonDecision(agentHistory: AgentCheck[]): {
  value: AgentDecisionAction | "Not enough memory";
  count: number;
} {
  const counts = new Map<AgentDecisionAction, number>();

  agentHistory.forEach((check) => {
    if (!check.decision) {
      return;
    }

    counts.set(check.decision, (counts.get(check.decision) ?? 0) + 1);
  });

  const mostCommon = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];

  return {
    value: mostCommon?.[0] ?? "Not enough memory",
    count: mostCommon?.[1] ?? 0,
  };
}

function getFollowThrough({
  decision,
  logs,
  avgProtein,
  avgSteps,
  avgCalories,
  trainingSignal,
  loggingQuality,
}: {
  decision: AgentDecisionAction | undefined;
  logs: LogEntry[];
  avgProtein: number;
  avgSteps: number;
  avgCalories: number;
  trainingSignal: TrainingSignal;
  loggingQuality: LoggingQuality;
}): {
  status: AgentMemory["followThroughStatus"];
  evidence: string;
} {
  if (!decision || logs.length < 7) {
    return {
      status: "Not enough data",
      evidence: "Run FitCheck Agent and save at least 7 logs to judge follow-through.",
    };
  }

  if (decision === "Improve protein") {
    return avgProtein >= PROTEIN_TARGET
      ? {
          status: "On track",
          evidence: `Protein is averaging ${avgProtein.toFixed(0)}g, which meets the ${PROTEIN_TARGET}g minimum.`,
        }
      : {
          status: "Needs follow-through",
          evidence: `Protein is averaging ${avgProtein.toFixed(0)}g, still below the ${PROTEIN_TARGET}g minimum.`,
        };
  }

  if (decision === "Increase steps") {
    return avgSteps >= STEP_TARGET
      ? {
          status: "On track",
          evidence: `Steps are averaging ${avgSteps.toFixed(0)}, which meets the ${STEP_TARGET.toLocaleString()} step target.`,
        }
      : {
          status: "Needs follow-through",
          evidence: `Steps are averaging ${avgSteps.toFixed(0)}, still below the ${STEP_TARGET.toLocaleString()} step target.`,
        };
  }

  if (decision === "Focus recovery") {
    return trainingSignal.status === "Recovery risk"
      ? {
          status: "Needs follow-through",
          evidence:
            "Training still shows recovery risk, so the recovery recommendation has not resolved yet.",
        }
      : {
          status: "On track",
          evidence: `Training is currently ${trainingSignal.status.toLowerCase()}, so recovery risk is not the active signal.`,
        };
  }

  if (decision === "Reduce calories") {
    const calorieTrend = getRecentCalorieTrend(logs);

    if (calorieTrend === null || avgCalories <= 0) {
      return {
        status: "Not enough data",
        evidence: "There are not enough recent calorie logs to judge the calorie reduction.",
      };
    }

    return calorieTrend < 0
      ? {
          status: "On track",
          evidence: `Recent calories are down about ${Math.abs(
            calorieTrend
          ).toFixed(0)} cal/day compared with the previous week.`,
        }
      : {
          status: "Needs follow-through",
          evidence: `Recent calories are not lower yet; the weekly average is up about ${calorieTrend.toFixed(0)} cal/day.`,
        };
  }

  if (decision === "Hold calories") {
    return loggingQuality.averageCoverageScore >= 70
      ? {
          status: "On track",
          evidence: `Logging coverage is ${loggingQuality.averageCoverageScore}%, so holding the plan can be judged with usable data.`,
        }
      : {
          status: "Mixed",
          evidence: `Logging coverage is ${loggingQuality.averageCoverageScore}%, so the hold-calories recommendation is harder to verify.`,
        };
  }

  return {
    status: "Mixed",
    evidence:
      "Goal timeline changes need an accepted plan update before follow-through can be judged automatically.",
  };
}

function getRecentCalorieTrend(logs: LogEntry[]) {
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const recentLogs = sortedLogs.slice(-7).filter((log) => log.calories > 0);
  const previousLogs = sortedLogs
    .slice(-14, -7)
    .filter((log) => log.calories > 0);

  if (recentLogs.length < 3 || previousLogs.length < 3) {
    return null;
  }

  return average(recentLogs.map((log) => log.calories)) -
    average(previousLogs.map((log) => log.calories));
}

function getActionReview({
  latestCheck,
  logs,
  currentDecision,
  trainingSignal,
  loggingQuality,
}: {
  latestCheck: AgentCheck | undefined;
  logs: LogEntry[];
  currentDecision: AgentDecisionAction;
  trainingSignal: TrainingSignal;
  loggingQuality: LoggingQuality;
}): {
  trackedAction: AgentMemory["trackedAction"];
  window: string;
  result: AgentMemory["actionResult"];
  evidence: string;
  nextStep: string;
} {
  if (!latestCheck?.decision) {
    return {
      trackedAction: "No saved action",
      window: "No prior agent check",
      result: "Not tracked",
      evidence: "Run and save a FitCheck Agent check to start action tracking.",
      nextStep: "Run FitCheck Agent after your next complete week of logs.",
    };
  }

  const checkDate = parseAgentCheckDate(latestCheck.date);
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const logsAfterCheck = checkDate
    ? sortedLogs.filter((log) => parseLogDate(log.date) > checkDate)
    : sortedLogs.slice(-7);
  const previousLogs = checkDate
    ? sortedLogs.filter((log) => parseLogDate(log.date) <= checkDate).slice(-7)
    : sortedLogs.slice(-14, -7);
  const window =
    logsAfterCheck.length > 0
      ? `${logsAfterCheck[0].date} to ${logsAfterCheck[logsAfterCheck.length - 1].date}`
      : "Waiting for logs after last agent check";

  if (logsAfterCheck.length < 2) {
    return {
      trackedAction: latestCheck.decision,
      window,
      result: "Too early",
      evidence:
        "FitCheck needs at least 2 logs after the last agent check before judging follow-through.",
      nextStep: getActionNextStep(latestCheck.decision),
    };
  }

  const stats = getActionStats(logsAfterCheck);
  const previousStats = getActionStats(previousLogs);

  if (latestCheck.decision === "Improve protein") {
    const result = stats.averageProtein >= PROTEIN_TARGET ? "Working" : "Needs action";
    return {
      trackedAction: latestCheck.decision,
      window,
      result,
      evidence:
        stats.averageProtein > 0
          ? `Protein after the check is averaging ${stats.averageProtein.toFixed(0)}g/day.`
          : "Protein has not been logged after the last agent check.",
      nextStep:
        result === "Working"
          ? "Keep protein anchored while watching weight and training response."
          : `Bring protein toward ${PROTEIN_TARGET}g/day before changing calories.`,
    };
  }

  if (latestCheck.decision === "Increase steps") {
    const result = stats.averageSteps >= STEP_TARGET ? "Working" : "Needs action";
    return {
      trackedAction: latestCheck.decision,
      window,
      result,
      evidence:
        stats.averageSteps > 0
          ? `Steps after the check are averaging ${stats.averageSteps.toFixed(0)}/day.`
          : "Steps have not been logged after the last agent check.",
      nextStep:
        result === "Working"
          ? "Hold the higher step baseline for the rest of the week."
          : `Raise steps toward ${STEP_TARGET.toLocaleString()}/day before cutting calories harder.`,
    };
  }

  if (latestCheck.decision === "Reduce calories") {
    const calorieDelta = stats.averageCalories - previousStats.averageCalories;
    const result =
      stats.averageCalories > 0 && previousStats.averageCalories > 0 && calorieDelta <= -75
        ? "Working"
        : "Needs action";

    return {
      trackedAction: latestCheck.decision,
      window,
      result,
      evidence:
        stats.averageCalories > 0 && previousStats.averageCalories > 0
          ? `Calories changed ${calorieDelta > 0 ? "+" : ""}${calorieDelta.toFixed(0)} cal/day versus before the check.`
          : "There are not enough calorie logs before and after the check to judge the reduction.",
      nextStep:
        result === "Working"
          ? "Hold the new calorie level long enough for the weight trend to respond."
          : "Make the calorie reduction measurable before asking the agent for a new adjustment.",
    };
  }

  if (latestCheck.decision === "Focus recovery") {
    const result = trainingSignal.status === "Recovery risk" ? "Needs action" : "Working";
    return {
      trackedAction: latestCheck.decision,
      window,
      result,
      evidence: `Training signal is currently ${trainingSignal.status.toLowerCase()}.`,
      nextStep:
        result === "Working"
          ? "Keep recovery habits steady and return to normal progression gradually."
          : "Reduce fatigue pressure before adding more calorie or step demands.",
    };
  }

  if (latestCheck.decision === "Adjust goal timeline") {
    const result = currentDecision === "Adjust goal timeline" ? "Needs action" : "Resolved";
    return {
      trackedAction: latestCheck.decision,
      window,
      result,
      evidence:
        result === "Resolved"
          ? "The current decision engine no longer flags goal timeline adjustment as the top action."
          : "The decision engine still sees the goal timeline as the top issue.",
      nextStep:
        result === "Resolved"
          ? "Keep executing the updated plan."
          : "Update the goal date or pace so the agent stops compensating with aggressive targets.",
    };
  }

  return {
    trackedAction: latestCheck.decision,
    window,
    result: loggingQuality.averageCoverageScore >= 70 ? "Working" : "Too early",
    evidence: `Logging coverage is ${loggingQuality.averageCoverageScore}% after the latest check.`,
    nextStep:
      loggingQuality.averageCoverageScore >= 70
        ? "Keep holding the plan while the weekly trend updates."
        : "Improve logging coverage before judging whether holding calories worked.",
  };
}

function getActionStats(logs: LogEntry[]) {
  return {
    averageCalories: average(logs.map((log) => log.calories)),
    averageProtein: average(logs.map((log) => log.protein)),
    averageSteps: average(logs.map((log) => log.steps)),
  };
}

function getActionNextStep(decision: AgentDecisionAction) {
  if (decision === "Improve protein") {
    return `Log protein and aim toward ${PROTEIN_TARGET}g/day.`;
  }

  if (decision === "Increase steps") {
    return `Log steps and build toward ${STEP_TARGET.toLocaleString()}/day.`;
  }

  if (decision === "Reduce calories") {
    return "Log calories consistently so FitCheck can verify the reduction.";
  }

  if (decision === "Focus recovery") {
    return "Log workouts and watch whether training performance stabilizes.";
  }

  if (decision === "Adjust goal timeline") {
    return "Update the goal date or target pace, then rerun the agent.";
  }

  return "Keep logging the plan for the next 2-3 days.";
}

function parseAgentCheckDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.toDateString());
}

function parseLogDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function getNoticedPattern({
  memoryDepth,
  recurringRisk,
  repeatedDecision,
  followThrough,
  actionReview,
}: {
  memoryDepth: number;
  recurringRisk: { value: string; count: number };
  repeatedDecision: {
    value: AgentDecisionAction | "Not enough memory";
    count: number;
  };
  followThrough: {
    status: AgentMemory["followThroughStatus"];
    evidence: string;
  };
  actionReview: {
    result: AgentMemory["actionResult"];
    evidence: string;
  };
}) {
  if (memoryDepth === 0) {
    return "FitCheck has no saved agent checks yet. Run the agent to start building memory.";
  }

  if (actionReview.result === "Working" || actionReview.result === "Resolved") {
    return `FitCheck noticed the last recommendation is being followed: ${actionReview.evidence}`;
  }

  if (actionReview.result === "Needs action") {
    return `FitCheck noticed the last recommendation still needs follow-through: ${actionReview.evidence}`;
  }

  if (recurringRisk.count >= 2) {
    return `FitCheck noticed this risk keeps coming back: ${recurringRisk.value}`;
  }

  if (repeatedDecision.count >= 2) {
    return `FitCheck noticed the recommendation has repeated: ${repeatedDecision.value}.`;
  }

  if (followThrough.status === "On track") {
    return "FitCheck noticed your latest logs are moving in the direction of the prior recommendation.";
  }

  return "FitCheck is still building memory. Save a few more agent checks to reveal stronger patterns.";
}

function cleanMemoryText(value: string) {
  const cleaned = value.trim();

  if (!cleaned || cleaned.toLowerCase() === "not specified") {
    return "";
  }

  return cleaned;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
