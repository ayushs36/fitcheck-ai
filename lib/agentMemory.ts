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
  trainingSignal: TrainingSignal;
  loggingQuality: LoggingQuality;
};

export function getAgentMemory({
  agentHistory,
  logs,
  avgProtein,
  avgSteps,
  avgCalories,
  trainingSignal,
  loggingQuality,
}: AgentMemoryInput): AgentMemory {
  const recentChecks = agentHistory.slice(0, 6);
  const recurringRisk = getMostCommonRisk(recentChecks);
  const repeatedDecision = getMostCommonDecision(recentChecks);
  const latestDecision = agentHistory[0]?.decision;
  const followThrough = getFollowThrough({
    decision: latestDecision,
    logs,
    avgProtein,
    avgSteps,
    avgCalories,
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
    noticedPattern: getNoticedPattern({
      memoryDepth: agentHistory.length,
      recurringRisk,
      repeatedDecision,
      followThrough,
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

function getNoticedPattern({
  memoryDepth,
  recurringRisk,
  repeatedDecision,
  followThrough,
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
}) {
  if (memoryDepth === 0) {
    return "FitCheck has no saved agent checks yet. Run the agent to start building memory.";
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
