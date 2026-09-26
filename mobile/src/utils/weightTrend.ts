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

// A blank daily log must not displace a valid weigh-in from either average.
export function getWeightTrendSummary(logs: DailyLog[]): WeightTrendSummary {
  const chronologicalLogs = logs.slice().sort((a, b) => a.date.localeCompare(b.date));
  const validWeightLogs = chronologicalLogs.filter(log =>
    typeof log.weightLbs === "number" && Number.isFinite(log.weightLbs) && log.weightLbs > 0,
  );
  const recent7WeighIns = validWeightLogs.slice(-7);
  const recent14WeighIns = validWeightLogs.slice(-14);

  return {
    movingAverage7: average(loggedWeights(recent7WeighIns)),
    movingAverage7LoggedDays: recent7WeighIns.length,
    fourteenLogAverage: average(loggedWeights(recent14WeighIns)),
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
