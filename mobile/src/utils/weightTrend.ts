import type {DailyLog} from "../types/fitness.ts";

export function weeklyWeightChange(logs: DailyLog[]): number | undefined {
  const weights = logs.filter(log => typeof log.weightLbs === "number" && Number.isFinite(log.weightLbs) && log.weightLbs > 0)
    .sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  if (weights.length < 14) return undefined;
  const average = (rows: DailyLog[]) => rows.reduce((total, log) => total + log.weightLbs!, 0) / 7;
  return average(weights.slice(7)) - average(weights.slice(0, 7));
}
