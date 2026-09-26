import {test} from "node:test";
import assert from "node:assert/strict";
import {getWeightTrendSummary} from "../src/utils/weightTrend.ts";

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

test("weight windows use valid weigh-ins so blank daily logs do not change the average", () => {
  const logs = [
    log(1, 130), log(2, 131), log(3, 132), log(4, 133), log(5, 134), log(6, 135), log(7, 136),
    log(8, 137), log(9), log(10, 139), log(11, 140), log(12), log(13, 142), log(14, 143),
  ];

  const summary = getWeightTrendSummary(logs);

  assert.equal(summary.movingAverage7LoggedDays, 7);
  assert.equal(summary.movingAverage7, (135 + 136 + 137 + 139 + 140 + 142 + 143) / 7);
  assert.equal(summary.fourteenLogAverage, (130 + 131 + 132 + 133 + 134 + 135 + 136 + 137 + 139 + 140 + 142 + 143) / 12);
});

test("saving a blank weight leaves the seven-weigh-in average unchanged", () => {
  const sevenWeighIns = Array.from({length: 7}, (_, index) => log(index + 1, 130 + index));
  const before = getWeightTrendSummary(sevenWeighIns);
  const after = getWeightTrendSummary([...sevenWeighIns, log(8)]);

  assert.equal(after.movingAverage7LoggedDays, 7);
  assert.equal(after.movingAverage7, before.movingAverage7);
});

test("weekly pace compares the latest seven weigh-ins with the previous seven", () => {
  const logs = Array.from({length: 14}, (_, index) => log(index + 1, 130 + index));

  const summary = getWeightTrendSummary(logs);

  assert.equal(summary.movingAverage7, 140);
  assert.equal(summary.weeklyWeightChange, 7);
});
