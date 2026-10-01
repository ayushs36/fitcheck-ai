import {test} from "node:test";
import assert from "node:assert/strict";
import {getSevenDayMetricAverage, getWeightTrendSummary} from "../src/utils/weightTrend.ts";

function log(day, weightLbs) {
  return {
    id: `log-${day}`,
    date: `2026-09-${String(day).padStart(2, "0")}`,
    goal: "cut",
    ...(weightLbs ? {weightLbs} : {}),
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
  };
}

test("weight windows use recent calendar days and blanks do not count as zero", () => {
  const logs = [
    log(1, 130), log(2, 131), log(3, 132), log(4, 133), log(5, 134), log(6, 135), log(7, 136),
    log(8, 137), log(9), log(10, 139), log(11, 140), log(12), log(13, 142), log(14, 143),
  ];

  const summary = getWeightTrendSummary(logs);

  assert.equal(summary.movingAverage7LoggedDays, 5);
  assert.equal(summary.movingAverage7, (137 + 139 + 140 + 142 + 143) / 5);
  assert.equal(summary.fourteenLogAverage, (130 + 131 + 132 + 133 + 134 + 135 + 136 + 137 + 139 + 140 + 142 + 143) / 12);
});

test("saving a blank weight leaves the seven-day average unchanged", () => {
  const sevenWeighIns = Array.from({length: 7}, (_, index) => log(index + 1, 130 + index));
  const before = getWeightTrendSummary(sevenWeighIns);
  const after = getWeightTrendSummary([...sevenWeighIns, log(8)]);

  assert.equal(after.movingAverage7LoggedDays, 7);
  assert.equal(after.movingAverage7, before.movingAverage7);
});

test("weekly pace compares the latest seven calendar days with the previous seven", () => {
  const logs = Array.from({length: 14}, (_, index) => log(index + 1, 130 + index));

  const summary = getWeightTrendSummary(logs);

  assert.equal(summary.movingAverage7, 140);
  assert.equal(summary.weeklyWeightChange, 7);
});

test("weekly pace needs at least three weigh-ins in each calendar week", () => {
  const logs = [log(1, 130), log(3, 131), log(6, 132), log(10, 133), log(12, 134)];
  assert.equal(getWeightTrendSummary(logs).weeklyWeightChange, undefined);
});

test("chart averages use each metric's latest seven calendar days and skip missing values", () => {
  const logs = [
    {...log(1), calories: 9000, steps: 30000},
    {...log(8), calories: 1800, steps: 8000},
    {...log(10), calories: 2200},
    {...log(14), steps: 12000},
    log(15),
  ];
  assert.equal(getSevenDayMetricAverage(logs, "calories"), 2000);
  assert.equal(getSevenDayMetricAverage(logs, "steps"), 10000);
  assert.equal(getSevenDayMetricAverage(logs.reverse(), "steps"), 10000);
  assert.equal(getSevenDayMetricAverage([], "calories"), undefined);
  assert.equal(getSevenDayMetricAverage([{...log(15), calories: NaN}], "calories"), undefined);
});

test("weekly loss pace is the difference between valid weekly means", () => {
  const logs = [log(1, 150), log(3, 151), log(6, 149), log(8, 149), log(10, 150), log(14, 148), log(15)];
  assert.equal(getWeightTrendSummary(logs).weeklyWeightChange, -1);
  assert.equal(getSevenDayMetricAverage(logs, "weightLbs"), 149);
});
