import type { DailyLog, UserSettings, WeeklyReviewDecision } from "../types/fitness.ts";
import { activePhase, averageWeight, offsetDate } from "./goalPhases.ts";
import { getTodayKey } from "./date.ts";

function metricAverage(logs: DailyLog[], key: "calories" | "proteinGrams" | "steps") {
  const values = logs.map(log => log[key]).filter((n): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0);
  return { count: values.length, value: values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined };
}

export function buildWeeklyReview(logs: DailyLog[], settings: UserSettings | null, today: string) {
  // Review complete days only, with one stable decision per calendar week and phase.
  const day = new Date(`${today}T12:00:00`).getDay();
  const monday = offsetDate(today, -((day + 6) % 7));
  const end = offsetDate(monday, -1);
  const start = offsetDate(end, -6);
  const priorStart = offsetDate(start, -7);
  const priorEnd = offsetDate(start, -1);
  const phase = activePhase(settings);
  const eligible = [...new Map(logs.map(log => [log.date, log])).values()]
    .filter(log => !phase || log.date >= phase.startDate);
  const recent = averageWeight(eligible, start, end);
  const prior = averageWeight(eligible, priorStart, priorEnd);
  const enough = recent.count >= 3 && prior.count >= 3;
  const change = enough ? recent.value! - prior.value! : undefined;
  const rows = eligible.filter(log => log.date >= start && log.date <= end);
  const metrics = {
    calories: metricAverage(rows, "calories"), protein: metricAverage(rows, "proteinGrams"), steps: metricAverage(rows, "steps"),
  };
  let action = "Keep your current targets for another week and review the next check-in.";
  if (!enough) action = "Build a baseline with at least three weigh-ins each week, under similar conditions.";
  else if (typeof settings?.calorieTarget === "number" && settings.calorieTarget > 0 && metrics.calories.count < 4)
    action = "Record your intake on more days this week before considering a calorie-target change.";
  else if (typeof settings?.proteinTarget === "number" && settings.proteinTarget > 0 && metrics.protein.count >= 4
    && metrics.protein.value! < settings.proteinTarget * 0.9)
    action = "Focus on consistently reaching the protein target you selected this week.";
  else if (typeof settings?.stepTarget === "number" && settings.stepTarget > 0 && metrics.steps.count >= 4
    && metrics.steps.value! < settings.stepTarget * 0.9)
    action = "Focus on consistently reaching the step target you selected this week.";
  else if (typeof settings?.calorieTarget === "number" && settings.calorieTarget > 0 && metrics.calories.count >= 4
    && Math.abs(metrics.calories.value! - settings.calorieTarget) > settings.calorieTarget * 0.1)
    action = "Review how your logged intake compares with your chosen calorie target before changing the plan.";
  return {
    id: `${phase?.id ?? "legacy"}:${monday}`, phaseId: phase?.id, start, end, recent, prior, change, enough, action,
    confidence: !enough ? "Building baseline" : recent.count >= 5 && prior.count >= 5 ? "Good weight coverage" : "Limited weight coverage",
    metrics, goal: settings?.defaultGoal ?? "maintain",
  };
}

export function recordWeeklyDecision(settings: UserSettings, review: ReturnType<typeof buildWeeklyReview>,
  status: WeeklyReviewDecision["status"], now: string): UserSettings {
  const decision: WeeklyReviewDecision = {
    id: review.id, phaseId: review.phaseId, reviewedAt: now, baselineStart: review.start, baselineEnd: review.end,
    goal: review.goal, action: review.action, status, baselineWeight: review.recent.value, baselineWeighIns: review.recent.count,
  };
  return { ...settings, updatedAt: now,
    weeklyReviews: [...(settings.weeklyReviews ?? []).filter(row => row.id !== review.id), decision].slice(-52) };
}

export function reviewFollowUp(decision: WeeklyReviewDecision, logs: DailyLog[], today: string) {
  // A full week after acceptance avoids attributing days before the decision to it.
  const start = offsetDate(getTodayKey(new Date(decision.reviewedAt)), 1);
  const end = offsetDate(start, 6);
  const result = averageWeight(logs, start, end);
  return { start, end, ready: today > end, count: result.count,
    change: today > end && result.count >= 3 && decision.baselineWeighIns >= 3 && decision.baselineWeight !== undefined
      ? result.value! - decision.baselineWeight : undefined };
}
