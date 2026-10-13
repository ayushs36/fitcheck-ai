import type { DailyLog, GoalPhase, PhaseTargets, UserSettings } from "../types/fitness.ts";
import { getTodayKey } from "./date.ts";

export function offsetDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return getTodayKey(value);
}

export function phaseTargets(settings: UserSettings): PhaseTargets {
  return {
    defaultGoal: settings.defaultGoal, startingWeightLbs: settings.startingWeightLbs,
    targetWeightLbs: settings.targetWeightLbs, weeklyGoalPaceLbs: settings.weeklyGoalPaceLbs,
    calorieTarget: settings.calorieTarget, proteinTarget: settings.proteinTarget, stepTarget: settings.stepTarget,
  };
}

export function averageWeight(logs: DailyLog[], start: string, end: string) {
  const rows = [...new Map(logs.map(log => [log.date, log])).values()]
    .filter(log => log.date >= start && log.date <= end && typeof log.weightLbs === "number"
      && Number.isFinite(log.weightLbs) && log.weightLbs > 0);
  return { count: rows.length, value: rows.length ? rows.reduce((sum, log) => sum + log.weightLbs!, 0) / rows.length : undefined };
}

export function activePhase(settings: UserSettings | null): GoalPhase | undefined {
  return settings?.goalPhases?.find(phase => !phase.endDate);
}

export function logsForActivePhase(logs: DailyLog[], settings: UserSettings | null): DailyLog[] {
  const phase = activePhase(settings);
  return phase ? logs.filter(log => log.date >= phase.startDate) : logs;
}

// Phase boundaries are local calendar days; the new phase owns its start day.
export function savePhaseSettings(previous: UserSettings | null, next: UserSettings, logs: DailyLog[],
  today: string, id: string, startNew = false): UserSettings {
  const phases = previous?.goalPhases ?? [];
  const current = activePhase(previous);
  if (current && !startNew && current.targets.defaultGoal === next.defaultGoal) {
    return { ...previous, ...next, goalPhases: phases.map(phase => phase.id === current.id
      ? { ...phase, targets: phaseTargets(next) } : phase) };
  }
  if (current && today < current.startDate) throw new Error("The next phase cannot start before the current phase.");
  if (phases.length >= 100) throw new Error("Phase history is full. Export your account records before contacting support.");
  const end = offsetDate(today, -1);
  const closed = phases.map(phase => phase.endDate ? phase : {
    ...phase, endDate: today,
    endAverageLbs: averageWeight(logs, phase.startDate > offsetDate(end, -6) ? phase.startDate : offsetDate(end, -6), end).value,
    loggedDays: new Set(logs.filter(log => log.date >= phase.startDate && log.date < today).map(log => log.date)).size,
  });
  const phase: GoalPhase = {
    id, startDate: today, initialTargets: phaseTargets(next), targets: phaseTargets(next),
    startAverageLbs: averageWeight(logs, offsetDate(today, -7), end).value,
  };
  return { ...previous, ...next, goalPhases: [...closed, phase] };
}
