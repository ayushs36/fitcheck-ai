import {
  isHealthDataAvailable,
  queryStatisticsForQuantity,
  requestAuthorization,
} from "@kingstinct/react-native-healthkit";

export async function readTodayAppleHealthSteps() {
  if (!isHealthDataAvailable()) throw new Error("Apple Health is unavailable on this device.");
  await requestAuthorization({ toRead: ["HKQuantityTypeIdentifierStepCount"] });
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const result = await queryStatisticsForQuantity(
    "HKQuantityTypeIdentifierStepCount",
    ["cumulativeSum"],
    { filter: { date: { startDate: start, endDate: new Date() } }, unit: "count" },
  );
  return Math.round(result.sumQuantity?.quantity ?? 0);
}
