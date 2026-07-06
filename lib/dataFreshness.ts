import type { AgentDecision, DataFreshness, LogEntry } from "@/types/fitness";

const DAY_MS = 1000 * 60 * 60 * 24;

export function getDataFreshness(logs: LogEntry[]): DataFreshness {
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  if (sortedLogs.length === 0) {
    return {
      score: 0,
      status: "No data",
      lastLogDate: null,
      daysSinceLastLog: null,
      missedDaysLast14: 14,
      longestGapDays: 0,
      confidenceImpact: "High",
      message: "No saved logs yet.",
      recommendation:
        "Add at least 7 daily logs so FitCheck Agent can judge trends.",
    };
  }

  const today = startOfDay(new Date());
  const loggedDates = new Set(sortedLogs.map((log) => log.date));
  const latestLog = sortedLogs[sortedLogs.length - 1];
  const latestDate = parseLogDate(latestLog.date);
  const daysSinceLastLog = Math.max(
    0,
    Math.floor((today.getTime() - latestDate.getTime()) / DAY_MS)
  );
  const missedDaysLast14 = countMissedDays(loggedDates, today, 14);
  const longestGapDays = getLongestGapDays(sortedLogs);
  const score = Math.max(
    0,
    Math.min(
      100,
      100 - daysSinceLastLog * 15 - missedDaysLast14 * 3 - longestGapDays * 5
    )
  );

  let status: DataFreshness["status"] = "Fresh";
  let confidenceImpact: DataFreshness["confidenceImpact"] = "None";

  if (score < 45 || daysSinceLastLog >= 5) {
    status = "Stale";
    confidenceImpact = "High";
  } else if (score < 70 || daysSinceLastLog >= 3) {
    status = "Aging";
    confidenceImpact = "Moderate";
  } else if (score < 85 || missedDaysLast14 >= 3) {
    status = "Fresh";
    confidenceImpact = "Slight";
  }

  return {
    score,
    status,
    lastLogDate: latestLog.date,
    daysSinceLastLog,
    missedDaysLast14,
    longestGapDays,
    confidenceImpact,
    message: getFreshnessMessage(status, daysSinceLastLog, missedDaysLast14),
    recommendation: getFreshnessRecommendation(status),
  };
}

export function adjustDecisionForFreshness(
  decision: AgentDecision,
  freshness: DataFreshness
): AgentDecision {
  if (freshness.confidenceImpact === "None") {
    return decision;
  }

  return {
    ...decision,
    confidence: downgradeConfidence(decision.confidence, freshness),
    rationale: `${decision.rationale} Data freshness note: ${freshness.message}`,
  };
}

function countMissedDays(
  loggedDates: Set<string>,
  today: Date,
  windowDays: number
) {
  let missedDays = 0;

  for (let offset = 0; offset < windowDays; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);

    if (!loggedDates.has(date.toISOString().slice(0, 10))) {
      missedDays += 1;
    }
  }

  return missedDays;
}

function getLongestGapDays(logs: LogEntry[]) {
  if (logs.length < 2) return 0;

  return logs.slice(1).reduce((longestGap, log, index) => {
    const previousDate = parseLogDate(logs[index].date);
    const currentDate = parseLogDate(log.date);
    const gapBetweenLogs = Math.max(
      0,
      Math.floor((currentDate.getTime() - previousDate.getTime()) / DAY_MS) - 1
    );

    return Math.max(longestGap, gapBetweenLogs);
  }, 0);
}

function getFreshnessMessage(
  status: DataFreshness["status"],
  daysSinceLastLog: number,
  missedDaysLast14: number
) {
  if (status === "Stale") {
    return `Latest log is ${daysSinceLastLog} day${
      daysSinceLastLog === 1 ? "" : "s"
    } old, so agent confidence should be reduced.`;
  }

  if (status === "Aging") {
    return `Latest data is aging and ${missedDaysLast14} of the last 14 days are missing.`;
  }

  return `Data is current enough for normal coaching, with ${missedDaysLast14} missed day${
    missedDaysLast14 === 1 ? "" : "s"
  } in the last 14.`;
}

function getFreshnessRecommendation(status: DataFreshness["status"]) {
  if (status === "Stale") {
    return "Log today before making calorie or timeline changes.";
  }

  if (status === "Aging") {
    return "Add 1-2 fresh logs before treating trend changes as decisive.";
  }

  if (status === "No data") {
    return "Start with a daily weight, calorie, protein, step, and workout log.";
  }

  return "Keep logging daily to preserve high-confidence recommendations.";
}

function downgradeConfidence(
  confidence: AgentDecision["confidence"],
  freshness: DataFreshness
): AgentDecision["confidence"] {
  if (freshness.confidenceImpact === "High") {
    return "Low";
  }

  if (freshness.confidenceImpact === "Moderate" && confidence === "High") {
    return "Medium";
  }

  if (freshness.confidenceImpact === "Slight" && confidence === "High") {
    return "Medium";
  }

  return confidence;
}

function parseLogDate(date: string) {
  return startOfDay(new Date(`${date}T00:00:00`));
}

function startOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}
