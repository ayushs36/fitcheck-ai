import { GoalType } from "../types/fitness";

export type ProteinTarget = {
  target: number;
  low: number;
  high: number;
  range: string;
};

const fallbackWeightLbs = 150;

export function getProteinTarget(goal: GoalType, bodyWeightLbs: number): ProteinTarget {
  const weight = bodyWeightLbs > 0 ? bodyWeightLbs : fallbackWeightLbs;
  const gramsPerPound =
    goal === "cut"
      ? { low: 0.9, high: 1.1 }
      : goal === "bulk"
      ? { low: 0.7, high: 0.9 }
      : { low: 0.8, high: 1.0 };
  const low = Math.round(weight * gramsPerPound.low);
  const high = Math.round(weight * gramsPerPound.high);

  return {
    target: Math.round(weight),
    low,
    high,
    range: `${low}-${high} g/day`,
  };
}
