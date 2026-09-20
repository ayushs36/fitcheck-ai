import type {DailyLog} from "../types/fitness.ts";

export type WeightTrendSummary = {
  movingAverage7?: number;
  movingAverage7LoggedDays: number;
  fourteenLogAverage?: number;
  weeklyWeightChange?: number;
};

function average(values: number[]): number | undefined {
  if (!values.length) return undefined;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function loggedWeights(logs: DailyLog[]): number[] {
  return logs
    .map(log => log.weightLbs)
    .filter((weight): weight is number =>
      typeof weight === "number" && Number.isFinite(weight) && weight > 0,
    );
}

// Matches FitCheck AI web: windows use the most recent saved log days, while
// blank weigh-ins are excluded from each average instead of treated as zero.
export function getWeightTrendSummary(logs: DailyLog[]): WeightTrendSummary {
  const chronologicalLogs = logs.slice().sort((a, b) => a.date.localeCompare(b.date));
  const last7Logs = chronologicalLogs.slice(-7);
  const last14Logs = chronologicalLogs.slice(-14);
  const validWeightLogs = chronologicalLogs.filter(log =>
    typeof log.weightLbs === "number" && Number.isFinite(log.weightLbs) && log.weightLbs > 0,
  );
  const recent14WeighIns = validWeightLogs.slice(-14);

  return {
    movingAverage7: average(loggedWeights(last7Logs)),
    movingAverage7LoggedDays: loggedWeights(last7Logs).length,
    fourteenLogAverage: average(loggedWeights(last14Logs)),
    weeklyWeightChange:
      recent14WeighIns.length === 14
        ? (average(loggedWeights(recent14WeighIns.slice(7))) ?? 0) -
          (average(loggedWeights(recent14WeighIns.slice(0, 7))) ?? 0)
        : undefined,
  };
}

export function weeklyWeightChange(logs: DailyLog[]): number | undefined {
  return getWeightTrendSummary(logs).weeklyWeightChange;
}
