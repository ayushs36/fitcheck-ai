import type { CheckInEntry, CheckInSummary } from "@/types/fitness";

export function getCheckInSummary(checkIns: CheckInEntry[]): CheckInSummary {
  const sortedCheckIns = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
  const recentCheckIns = sortedCheckIns.slice(-7);
  const latestCheckIn = sortedCheckIns[sortedCheckIns.length - 1] ?? null;

  if (recentCheckIns.length === 0) {
    return {
      readinessScore: 0,
      status: "Need check-in",
      latestCheckIn: null,
      averageHunger: 0,
      averageSleepQuality: 0,
      averageSoreness: 0,
      averageEnergy: 0,
      averageStress: 0,
      recommendation:
        "Complete a check-in so FitCheck Agent can factor readiness into coaching decisions.",
    };
  }

  const averageHunger = average(recentCheckIns.map((item) => item.hunger));
  const averageSleepQuality = average(
    recentCheckIns.map((item) => item.sleepQuality)
  );
  const averageSoreness = average(recentCheckIns.map((item) => item.soreness));
  const averageEnergy = average(recentCheckIns.map((item) => item.energy));
  const averageStress = average(recentCheckIns.map((item) => item.stress));
  const readinessScore = Math.round(
    ((averageSleepQuality + averageEnergy + (6 - averageSoreness) + (6 - averageStress)) /
      20) *
      100
  );

  return {
    readinessScore,
    status: getReadinessStatus(readinessScore),
    latestCheckIn,
    averageHunger,
    averageSleepQuality,
    averageSoreness,
    averageEnergy,
    averageStress,
    recommendation: getReadinessRecommendation(readinessScore, averageHunger),
  };
}

function getReadinessStatus(score: number): CheckInSummary["status"] {
  if (score >= 75) return "Ready";
  if (score >= 55) return "Manage Load";
  return "Recovery Priority";
}

function getReadinessRecommendation(score: number, hunger: number) {
  if (score < 55) {
    return "Prioritize recovery before adding more deficit or training volume.";
  }

  if (hunger >= 4) {
    return "Hunger is elevated, so keep protein high and avoid unnecessary calorie cuts.";
  }

  if (score < 75) {
    return "Keep the plan steady and monitor sleep, soreness, energy, and stress.";
  }

  return "Readiness is strong enough to continue the current plan.";
}

function average(values: number[]) {
  if (values.length === 0) return 0;

  return values.reduce((total, value) => total + value, 0) / values.length;
}
