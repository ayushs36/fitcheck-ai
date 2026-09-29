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

function getDateKeyOffset(dateKey: string, offsetDays: number): string {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function validWeight(log: DailyLog | undefined): number | undefined {
  return typeof log?.weightLbs === "number" && Number.isFinite(log.weightLbs) && log.weightLbs > 0
    ? log.weightLbs
    : undefined;
}

function weightsInWindow(logsByDate: Map<string, DailyLog>, endDate: string, days: number): number[] {
  return Array.from({length: days}, (_, index) => validWeight(logsByDate.get(getDateKeyOffset(endDate, -index))))
    .filter((weight): weight is number => typeof weight === "number");
}

// Weight is a seven-calendar-day average. Missing entries are not treated as zero.
// Pace compares that window to the preceding seven calendar days when both have enough data.
export function getWeightTrendSummary(logs: DailyLog[]): WeightTrendSummary {
  const logsByDate = new Map(logs.map(log => [log.date, log]));
  const latestWeightDate = logs
    .filter(log => validWeight(log) !== undefined)
    .map(log => log.date)
    .sort()
    .at(-1);

  if (!latestWeightDate) {
    return {movingAverage7LoggedDays: 0};
  }

  const recent7Weights = weightsInWindow(logsByDate, latestWeightDate, 7);
  const prior7Weights = weightsInWindow(logsByDate, getDateKeyOffset(latestWeightDate, -7), 7);
  const fourteenDayWeights = [...prior7Weights, ...recent7Weights];

  return {
    movingAverage7: average(recent7Weights),
    movingAverage7LoggedDays: recent7Weights.length,
    fourteenLogAverage: average(fourteenDayWeights),
    weeklyWeightChange:
      recent7Weights.length >= 3 && prior7Weights.length >= 3
        ? (average(recent7Weights) ?? 0) - (average(prior7Weights) ?? 0)
        : undefined,
  };
}

export function weeklyWeightChange(logs: DailyLog[]): number | undefined {
  return getWeightTrendSummary(logs).weeklyWeightChange;
}
