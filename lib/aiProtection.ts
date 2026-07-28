const LIVE_AI_HEADER = "x-fitcheck-agent-secret";
const PERSONAL_APP_HEADER = "x-fitcheck-app-mode";
const PERSONAL_USERNAME = "ayushs36";
const DEFAULT_RATE_LIMIT_MAX = 12;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type LiveAIStatus = {
  allowed: boolean;
  reason: string;
};

type RateLimitResult = {
  allowed: boolean;
  resetAt: number;
  remaining: number;
};

export type FitCheckAIContext = {
  goal?: string;
  latestWeight?: number;
  effectiveWeight?: number;
  movingAverage?: number;
  fourteenDayAverage?: number;
  goalWeight?: number;
  goalDate?: string;
  poundsRemaining?: number;
  currentPace?: number;
  trendPace?: number;
  trendDirection?: string;
  trendPaceLabel?: string;
  goalTrendStatus?: string;
  requiredWeeklyLoss?: number;
  projectedGoalDateText?: string;
  goalStatus?: string;
  plateauStatus?: string;
  avgCalories?: number;
  avgProtein?: number;
  avgSteps?: number;
  strengthStatus?: string;
  strengthInsight?: string;
  maintenanceEstimate?: {
    pointEstimate?: number;
    confidence?: string;
    reason?: string;
  };
  goalFeasibility?: {
    verdict?: string;
    reason?: string;
    recommendation?: string;
  };
  agentDecision?: {
    action?: string;
    priority?: string;
    rationale?: string;
    confidence?: string;
    calorieGuidance?: string;
    proteinGuidance?: string;
    stepGuidance?: string;
    recoveryGuidance?: string;
    timelineGuidance?: string;
  };
  agentDecisionTrace?: {
    summary?: string;
    topSignals?: Array<{
      label?: string;
      value?: string;
      interpretation?: string;
      weight?: string;
    }>;
    guardrails?: string[];
    nextDataNeeded?: string[];
  };
  dataFreshness?: {
    status?: string;
    recommendation?: string;
  };
  weeklyPlan?: {
    calories?: string;
    protein?: string;
    steps?: string;
    training?: string;
    recovery?: string;
    adjustment?: {
      status?: string;
      recommendation?: string;
      trigger?: string;
      guardrail?: string;
      reviewWindow?: string;
      confidence?: string;
    };
  };
  planAdherence?: {
    status?: string;
    summary?: string;
    biggestBlocker?: string;
  };
  nutritionDiagnosis?: {
    status?: string;
    biggestBlocker?: string;
    recommendation?: string;
    calorieTarget?: number;
    proteinAverage?: number;
    nutritionNextAction?: string;
    agentNutritionInsight?: string;
  };
  loggingQuality?: {
    summary?: string;
    averageCoverageScore?: number;
  };
  dailyBrief?: {
    status?: string;
    todayFocus?: string;
    nextAction?: string;
    confidence?: string;
    evidence?: string[];
  };
  agentMemory?: {
    noticedPattern?: string;
    actionResult?: string;
    actionEvidence?: string;
    actionNextStep?: string;
  };
  weeklyCoachingReview?: {
    status?: string;
    summary?: string;
    biggestChange?: string;
    biggestBlocker?: string;
    priority?: string;
    evidence?: string[];
    nextActions?: string[];
    confidence?: string;
  };
  goalForecast?: {
    status?: string;
    recommendation?: string;
    requiredWeeklyPace?: number;
    expectedWeeklyPace?: number;
  };
  trainingSignal?: {
    status?: string;
    agentTrainingInsight?: string;
    trainingBalanceInsight?: string;
    recommendation?: string;
  };
  recommendation?: string;
  logsCount?: number;
};

const rateLimitEntries = new Map<string, RateLimitEntry>();

export function getLiveAIStatus(request: Request): LiveAIStatus {
  const configuredSecret = process.env.FITCHECK_AGENT_SECRET;
  const requestSecret = request.headers.get(LIVE_AI_HEADER);

  if (configuredSecret && requestSecret === configuredSecret) {
    return {
      allowed: true,
      reason: "Private agent access accepted.",
    };
  }

  if (isAuthenticatedPersonalRequest(request)) {
    return {
      allowed: true,
      reason: "Password-protected personal app access accepted.",
    };
  }

  if (process.env.FITCHECK_ALLOW_PUBLIC_AI === "true") {
    return {
      allowed: true,
      reason: "Public AI calls are enabled for this deployment.",
    };
  }

  return {
    allowed: false,
    reason:
      "Public demo protection is active, so this response did not use a live OpenAI call.",
  };
}

function isAuthenticatedPersonalRequest(request: Request) {
  if (request.headers.get(PERSONAL_APP_HEADER) !== "personal") {
    return false;
  }

  const personalPassword = process.env.FITCHECK_PERSONAL_PASSWORD;

  if (!personalPassword) {
    return false;
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Basic ")) {
    return false;
  }

  try {
    const decoded = atob(authHeader.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    const username = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);

    return username === PERSONAL_USERNAME && password === personalPassword;
  } catch {
    return false;
  }
}

export function checkAIRateLimit(request: Request): RateLimitResult {
  const maxRequests = Number(
    process.env.FITCHECK_AI_RATE_LIMIT_MAX ?? DEFAULT_RATE_LIMIT_MAX
  );

  if (!Number.isFinite(maxRequests) || maxRequests <= 0) {
    return {
      allowed: true,
      resetAt: Date.now() + RATE_LIMIT_WINDOW_MS,
      remaining: Number.POSITIVE_INFINITY,
    };
  }

  const now = Date.now();
  const clientId = getClientId(request);
  const currentEntry = rateLimitEntries.get(clientId);

  if (!currentEntry || currentEntry.resetAt <= now) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateLimitEntries.set(clientId, { count: 1, resetAt });

    return {
      allowed: true,
      resetAt,
      remaining: Math.max(maxRequests - 1, 0),
    };
  }

  if (currentEntry.count >= maxRequests) {
    return {
      allowed: false,
      resetAt: currentEntry.resetAt,
      remaining: 0,
    };
  }

  currentEntry.count += 1;
  rateLimitEntries.set(clientId, currentEntry);

  return {
    allowed: true,
    resetAt: currentEntry.resetAt,
    remaining: Math.max(maxRequests - currentEntry.count, 0),
  };
}

export function createProtectedFitnessAnswer(
  question: string,
  context: FitCheckAIContext,
  protectionReason: string
) {
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes("weekly") || lowerQuestion.includes("report")) {
    return createWeeklyReport(context, protectionReason);
  }

  if (lowerQuestion.includes("goal strategy") || lowerQuestion.includes("timeline")) {
    return createGoalStrategy(context, protectionReason);
  }

  if (
    lowerQuestion.includes("fitcheck agent") ||
    lowerQuestion.includes("autonomous fitness coaching agent") ||
    context.agentDecision
  ) {
    return createAgentReport(context, protectionReason);
  }

  return createAskAIAnswer(question, context, protectionReason);
}

function getClientId(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown-client";
  }

  return request.headers.get("x-real-ip") ?? "unknown-client";
}

function createAgentReport(context: FitCheckAIContext, protectionReason: string) {
  const decision = context.agentDecision;
  const weeklyReview = context.weeklyCoachingReview;
  const dailyBrief = context.dailyBrief;
  const weeklyPlan = context.weeklyPlan;
  const adjustment = weeklyPlan?.adjustment;
  const nutrition = context.nutritionDiagnosis;
  const training = context.trainingSignal;
  const forecast = context.goalForecast;
  const logging = context.loggingQuality;
  const memory = context.agentMemory;

  return [
    `Protected mode: ${protectionReason}`,
    "",
    `Overall Status: ${dailyBrief?.status ?? weeklyReview?.status ?? context.goalStatus ?? "Needs more logged data"}`,
    `Today's Brief: ${dailyBrief?.todayFocus ?? weeklyReview?.priority ?? "Keep logging weight, calories, protein, steps, and workouts so the agent can evaluate the plan."}`,
    `Weekly Review: ${weeklyReview?.summary ?? "The agent has enough structure to review the trend once more complete weekly logs are available."}`,
    `Agent Memory: ${memory?.noticedPattern ?? "No repeated pattern is strong enough yet to override the current plan."}`,
    `Biggest Risk: ${weeklyReview?.biggestBlocker ?? nutrition?.biggestBlocker ?? "Reacting too aggressively to short-term scale noise."}`,
    `Evidence: ${formatEvidence(context)}`,
    `Decision Engine Action: ${decision?.action ?? "Hold the current plan"} - ${decision?.rationale ?? "Use the rule-based decision engine as the baseline before making changes."}`,
    `Forecast Outlook: ${forecast?.status ?? context.goalFeasibility?.verdict ?? "Monitor the next 7-14 days"}; ${forecast?.recommendation ?? context.goalFeasibility?.recommendation ?? "adjust only after the trend confirms it."}`,
    `Logging Quality: ${logging?.summary ?? "Partial logs are treated as unknown instead of failed adherence."}`,
    `Nutrition Diagnosis: ${nutrition?.agentNutritionInsight ?? nutrition?.recommendation ?? "Keep calories and protein consistent before changing targets."}`,
    `Training Signal: ${training?.agentTrainingInsight ?? training?.recommendation ?? context.strengthInsight ?? "Judge strength over matching workouts across 2-3 weeks, not from one lighter form-focused session."}`,
    `Calorie Target: ${weeklyPlan?.calories ?? decision?.calorieGuidance ?? formatCalories(context)}`,
    `Protein Target: ${weeklyPlan?.protein ?? decision?.proteinGuidance ?? formatProtein(context)}`,
    `Step Target: ${weeklyPlan?.steps ?? decision?.stepGuidance ?? formatSteps(context)}`,
    `Training Focus: ${weeklyPlan?.training ?? decision?.recoveryGuidance ?? training?.trainingBalanceInsight ?? "Progress with controlled reps, good form, and adequate recovery."}`,
    `Next 7-Day Action Plan: ${dailyBrief?.nextAction ?? adjustment?.recommendation ?? decision?.priority ?? context.recommendation ?? "Log consistently for 7 more days and rerun the agent."}`,
    `Confidence Level: ${decision?.confidence ?? weeklyReview?.confidence ?? context.maintenanceEstimate?.confidence ?? "Moderate"}`,
  ].join("\n");
}

function createWeeklyReport(context: FitCheckAIContext, protectionReason: string) {
  const weeklyReview = context.weeklyCoachingReview;

  return [
    `Protected mode: ${protectionReason}`,
    "",
    `Weekly status: ${weeklyReview?.status ?? context.goalTrendStatus ?? "Needs review"}.`,
    `Win: You have ${context.logsCount ?? 0} logs available, which gives the app enough context to compare weight, calories, protein, steps, and training signals.`,
    `Problem: ${weeklyReview?.biggestBlocker ?? context.planAdherence?.biggestBlocker ?? "The main risk is making changes before the trend is clear."}`,
    `Biggest risk: ${context.plateauStatus ?? "Trend noise or incomplete logging could distort the recommendation."}`,
    `Next week's priority: ${weeklyReview?.priority ?? context.agentDecision?.priority ?? "Keep logging consistently and follow the current plan for another week."}`,
    `Goal outlook: ${context.goalFeasibility?.verdict ?? context.goalStatus ?? "Monitor trend pace"}; ${context.goalFeasibility?.recommendation ?? "use the next agent check before changing calories."}`,
  ].join("\n");
}

function createGoalStrategy(context: FitCheckAIContext, protectionReason: string) {
  const plan = context.weeklyPlan;

  return [
    `Protected mode: ${protectionReason}`,
    "",
    `Goal strategy: ${context.goalFeasibility?.verdict ?? "Keep the current timeline under review"}.`,
    `Calories: ${plan?.calories ?? context.agentDecision?.calorieGuidance ?? formatCalories(context)}.`,
    `Protein: ${plan?.protein ?? context.agentDecision?.proteinGuidance ?? formatProtein(context)}.`,
    `Steps: ${plan?.steps ?? context.agentDecision?.stepGuidance ?? formatSteps(context)}.`,
    `Training: ${plan?.training ?? context.trainingSignal?.recommendation ?? "Use matching workouts over 2-3 weeks to judge real progress."}`,
    `Recovery: ${plan?.recovery ?? context.agentDecision?.recoveryGuidance ?? "Avoid aggressive changes when soreness, sleep, or logging quality is the limiter."}`,
    `Timeline: ${context.goalForecast?.recommendation ?? context.agentDecision?.timelineGuidance ?? "Adjust the date only when the moving average trend confirms the current pace is unrealistic."}`,
  ].join("\n");
}

function createAskAIAnswer(
  question: string,
  context: FitCheckAIContext,
  protectionReason: string
) {
  return [
    `Protected mode: ${protectionReason}`,
    "",
    `For your question, "${question}", the safest coaching read is to follow the current decision engine output: ${context.agentDecision?.action ?? "hold the plan and keep collecting complete logs"}.`,
    `Key context: weight trend is ${context.trendPaceLabel ?? "not fully established"}, average calories are ${formatNumber(context.avgCalories, "unknown")} cal/day, protein averages ${formatNumber(context.avgProtein, "unknown")} g/day, and steps average ${formatNumber(context.avgSteps, "unknown")} per day.`,
    `Next action: ${context.dailyBrief?.nextAction ?? context.agentDecision?.priority ?? context.recommendation ?? "log the next full day and rerun the agent."}`,
  ].join("\n");
}

function formatEvidence(context: FitCheckAIContext) {
  const evidence = [
    context.dailyBrief?.evidence?.join("; "),
    context.weeklyCoachingReview?.evidence?.join("; "),
    context.agentDecisionTrace?.summary,
    context.agentDecisionTrace?.topSignals
      ?.slice(0, 3)
      .map((signal) => `${signal.label}: ${signal.value}`)
      .join("; "),
    context.trendPaceLabel ? `Trend pace: ${context.trendPaceLabel}` : undefined,
    context.avgCalories ? `Average calories: ${Math.round(context.avgCalories)}` : undefined,
    context.avgProtein ? `Average protein: ${Math.round(context.avgProtein)}g` : undefined,
    context.avgSteps ? `Average steps: ${Math.round(context.avgSteps)}` : undefined,
  ].filter(Boolean);

  return evidence.length > 0 ? evidence.join("; ") : "Not enough complete evidence yet.";
}

function formatCalories(context: FitCheckAIContext) {
  if (context.nutritionDiagnosis?.calorieTarget) {
    return `${Math.round(context.nutritionDiagnosis.calorieTarget)} cal/day`;
  }

  if (context.maintenanceEstimate?.pointEstimate) {
    return `Use maintenance estimate of about ${Math.round(context.maintenanceEstimate.pointEstimate)} cal/day as context, not a hard prescription.`;
  }

  return "Keep the current calorie target until trend data improves.";
}

function formatProtein(context: FitCheckAIContext) {
  if (context.nutritionDiagnosis?.proteinAverage) {
    return `Current average is ${Math.round(context.nutritionDiagnosis.proteinAverage)}g/day; keep protein consistent.`;
  }

  if (context.avgProtein) {
    return `Current average is ${Math.round(context.avgProtein)}g/day; keep protein consistent.`;
  }

  return "Log protein consistently before changing the target.";
}

function formatSteps(context: FitCheckAIContext) {
  if (context.avgSteps) {
    return `Current average is ${Math.round(context.avgSteps).toLocaleString()} steps/day; increase only if recovery is fine.`;
  }

  return "Log steps consistently before changing the target.";
}

function formatNumber(value: number | undefined, fallback: string) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value).toLocaleString()
    : fallback;
}
