import type {
  AgentDecision,
  DataFreshness,
  Goal,
  GoalForecast,
  LogEntry,
  NutritionDiagnosis,
  PlanAdherence,
  ReadinessScore,
  TrainingSignal,
  WeeklyCoachingReview,
} from "@/types/fitness";
import type { LoggingQuality } from "@/lib/logQuality";

type WeeklyCoachingReviewInput = {
  goal: Goal;
  logs: LogEntry[];
  currentPace: number;
  requiredWeeklyLoss: number;
  agentDecision: AgentDecision;
  dataFreshness: DataFreshness;
  loggingQuality: LoggingQuality;
  nutritionDiagnosis: NutritionDiagnosis;
  planAdherence: PlanAdherence;
  readinessScore: ReadinessScore;
  trainingSignal: TrainingSignal;
  goalForecast: GoalForecast;
};

export function getWeeklyCoachingReview({
  goal,
  logs,
  currentPace,
  requiredWeeklyLoss,
  agentDecision,
  dataFreshness,
  loggingQuality,
  nutritionDiagnosis,
  planAdherence,
  readinessScore,
  trainingSignal,
  goalForecast,
}: WeeklyCoachingReviewInput): WeeklyCoachingReview {
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const recentLogs = sortedLogs.slice(-7);
  const previousLogs = sortedLogs.slice(-14, -7);
  const recentStats = getWeekStats(recentLogs);
  const previousStats = getWeekStats(previousLogs);
  const biggestChange = getBiggestChange(recentStats, previousStats);
  const confidence = getConfidence({
    recentLogs,
    dataFreshness,
    loggingQuality,
    goalForecastConfidence: goalForecast.confidence,
  });
  const status = getStatus({
    dataFreshness,
    loggingQuality,
    readinessScore,
    goalForecast,
    planAdherence,
    nutritionDiagnosis,
    trainingSignal,
  });
  const biggestBlocker = getBiggestBlocker({
    dataFreshness,
    loggingQuality,
    nutritionDiagnosis,
    planAdherence,
    readinessScore,
    trainingSignal,
    goalForecast,
  });
  const evidence = [
    `${recentStats.logCount}/7 days logged`,
    getWeightEvidence(goal, currentPace, requiredWeeklyLoss),
    `${recentStats.averageCalories > 0 ? `${recentStats.averageCalories.toFixed(0)} cal/day` : "Calories incomplete"}`,
    `${recentStats.averageProtein > 0 ? `${recentStats.averageProtein.toFixed(0)}g protein/day` : "Protein incomplete"}`,
    `${recentStats.averageSteps > 0 ? `${recentStats.averageSteps.toFixed(0)} steps/day` : "Steps incomplete"}`,
    `${recentStats.workouts} workout${recentStats.workouts === 1 ? "" : "s"}`,
  ];

  return {
    status,
    weekRange: getWeekRange(recentLogs),
    summary: getSummary({
      goal,
      recentStats,
      currentPace,
      requiredWeeklyLoss,
      status,
      goalForecast,
    }),
    biggestChange,
    biggestBlocker,
    agentPriority: agentDecision.priority,
    nextActions: getNextActions({
      agentDecision,
      biggestBlocker,
      nutritionDiagnosis,
      readinessScore,
      trainingSignal,
      loggingQuality,
    }),
    evidence,
    confidence,
  };
}

type WeekStats = {
  logCount: number;
  averageWeight: number;
  averageCalories: number;
  averageProtein: number;
  averageSteps: number;
  workouts: number;
};

function getWeekStats(logs: LogEntry[]): WeekStats {
  return {
    logCount: logs.length,
    averageWeight: average(logs.map((log) => log.weight)),
    averageCalories: average(logs.map((log) => log.calories)),
    averageProtein: average(logs.map((log) => log.protein)),
    averageSteps: average(logs.map((log) => log.steps)),
    workouts: logs.filter((log) => log.exercises.length > 0).length,
  };
}

function getWeekRange(logs: LogEntry[]) {
  if (logs.length === 0) {
    return "No recent logs";
  }

  const first = logs[0].date;
  const last = logs[logs.length - 1].date;

  return first === last ? first : `${first} to ${last}`;
}

function getBiggestChange(current: WeekStats, previous: WeekStats) {
  if (previous.logCount === 0) {
    return "This is the first review window, so FitCheck is building a baseline.";
  }

  const changes = [
    {
      label: "Calories",
      value: current.averageCalories - previous.averageCalories,
      text: `${formatSigned(current.averageCalories - previous.averageCalories)} cal/day vs previous week`,
      valid: current.averageCalories > 0 && previous.averageCalories > 0,
    },
    {
      label: "Protein",
      value: current.averageProtein - previous.averageProtein,
      text: `${formatSigned(current.averageProtein - previous.averageProtein)}g protein/day vs previous week`,
      valid: current.averageProtein > 0 && previous.averageProtein > 0,
    },
    {
      label: "Steps",
      value: current.averageSteps - previous.averageSteps,
      text: `${formatSigned(current.averageSteps - previous.averageSteps)} steps/day vs previous week`,
      valid: current.averageSteps > 0 && previous.averageSteps > 0,
    },
    {
      label: "Workouts",
      value: current.workouts - previous.workouts,
      text: `${formatSigned(current.workouts - previous.workouts)} workouts vs previous week`,
      valid: true,
    },
  ].filter((change) => change.valid);

  const biggest = changes.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];

  return biggest ? `${biggest.label}: ${biggest.text}` : "Not enough matching data to compare weekly changes.";
}

function getStatus({
  dataFreshness,
  loggingQuality,
  readinessScore,
  goalForecast,
  planAdherence,
  nutritionDiagnosis,
  trainingSignal,
}: {
  dataFreshness: DataFreshness;
  loggingQuality: LoggingQuality;
  readinessScore: ReadinessScore;
  goalForecast: GoalForecast;
  planAdherence: PlanAdherence;
  nutritionDiagnosis: NutritionDiagnosis;
  trainingSignal: TrainingSignal;
}): WeeklyCoachingReview["status"] {
  if (
    dataFreshness.status === "Stale" ||
    loggingQuality.averageCoverageScore < 55
  ) {
    return "Logging needed";
  }

  if (
    readinessScore.status === "Recovery priority" ||
    trainingSignal.status === "Recovery risk"
  ) {
    return "Recovery watch";
  }

  if (
    goalForecast.status === "Unrealistic" ||
    goalForecast.status === "At risk"
  ) {
    return "Goal mismatch";
  }

  if (planAdherence.score < 70 || nutritionDiagnosis.status === "Needs attention") {
    return "Needs attention";
  }

  return "On track";
}

function getBiggestBlocker({
  dataFreshness,
  loggingQuality,
  nutritionDiagnosis,
  planAdherence,
  readinessScore,
  trainingSignal,
  goalForecast,
}: {
  dataFreshness: DataFreshness;
  loggingQuality: LoggingQuality;
  nutritionDiagnosis: NutritionDiagnosis;
  planAdherence: PlanAdherence;
  readinessScore: ReadinessScore;
  trainingSignal: TrainingSignal;
  goalForecast: GoalForecast;
}) {
  if (dataFreshness.status === "Stale") {
    return dataFreshness.recommendation;
  }

  if (loggingQuality.averageCoverageScore < 70) {
    return `Improve logging quality: ${loggingQuality.summary}.`;
  }

  if (readinessScore.status === "Recovery priority") {
    return readinessScore.recommendation;
  }

  if (trainingSignal.status === "Recovery risk") {
    return trainingSignal.recommendation;
  }

  if (
    goalForecast.status === "Unrealistic" ||
    goalForecast.status === "At risk"
  ) {
    return goalForecast.recommendation;
  }

  if (nutritionDiagnosis.status === "Needs attention") {
    return nutritionDiagnosis.recommendation;
  }

  return planAdherence.blockerRecommendation;
}

function getSummary({
  goal,
  recentStats,
  currentPace,
  requiredWeeklyLoss,
  status,
  goalForecast,
}: {
  goal: Goal;
  recentStats: WeekStats;
  currentPace: number;
  requiredWeeklyLoss: number;
  status: WeeklyCoachingReview["status"];
  goalForecast: GoalForecast;
}) {
  if (recentStats.logCount < 7) {
    return `FitCheck has ${recentStats.logCount} of 7 recent days logged, so this review is directional instead of final.`;
  }

  if (goal === "Cutting") {
    return `Your current pace is about ${currentPace.toFixed(1)} lb/week toward fat loss versus ${requiredWeeklyLoss.toFixed(1)} lb/week required. Weekly status: ${status}.`;
  }

  if (goal === "Bulking") {
    return `Your current pace is about ${currentPace.toFixed(1)} lb/week while bulking. Weekly status: ${status}.`;
  }

  return `Your maintenance trend is being judged against weight stability and execution quality. Goal forecast: ${goalForecast.status}.`;
}

function getWeightEvidence(goal: Goal, currentPace: number, requiredWeeklyLoss: number) {
  if (goal === "Cutting") {
    return `${currentPace.toFixed(1)} lb/week loss pace vs ${requiredWeeklyLoss.toFixed(1)} required`;
  }

  if (goal === "Bulking") {
    return `${currentPace.toFixed(1)} lb/week gain pace`;
  }

  return `${Math.abs(currentPace).toFixed(1)} lb/week trend from maintenance`;
}

function getNextActions({
  agentDecision,
  biggestBlocker,
  nutritionDiagnosis,
  readinessScore,
  trainingSignal,
  loggingQuality,
}: {
  agentDecision: AgentDecision;
  biggestBlocker: string;
  nutritionDiagnosis: NutritionDiagnosis;
  readinessScore: ReadinessScore;
  trainingSignal: TrainingSignal;
  loggingQuality: LoggingQuality;
}) {
  const actions = [
    agentDecision.rationale,
    biggestBlocker,
    nutritionDiagnosis.nutritionNextAction,
    readinessScore.recommendation,
    trainingSignal.agentTrainingInsight,
    `Logging quality: ${loggingQuality.summary}`,
  ];

  return Array.from(new Set(actions.filter(Boolean))).slice(0, 3);
}

function getConfidence({
  recentLogs,
  dataFreshness,
  loggingQuality,
  goalForecastConfidence,
}: {
  recentLogs: LogEntry[];
  dataFreshness: DataFreshness;
  loggingQuality: LoggingQuality;
  goalForecastConfidence: GoalForecast["confidence"];
}): WeeklyCoachingReview["confidence"] {
  if (
    recentLogs.length >= 7 &&
    dataFreshness.status === "Fresh" &&
    loggingQuality.averageCoverageScore >= 80 &&
    goalForecastConfidence !== "Low"
  ) {
    return "High";
  }

  if (recentLogs.length >= 5 && dataFreshness.status !== "Stale") {
    return "Medium";
  }

  return "Low";
}

function average(values: number[]) {
  const validValues = values.filter((value) => value > 0);

  if (validValues.length === 0) return 0;

  return validValues.reduce((total, value) => total + value, 0) / validValues.length;
}

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(0)}`;
}
