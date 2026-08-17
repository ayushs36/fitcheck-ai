import type { Goal } from "@/types/fitness";

export type ProteinTarget = {
  target: number;
  low: number;
  high: number;
  range: string;
  gramsPerPound: {
    low: number;
    high: number;
  };
};

const DEFAULT_WEIGHT_LBS = 150;

export function getProteinTarget(goal: Goal, bodyWeightLbs: number): ProteinTarget {
  const weight = bodyWeightLbs > 0 ? bodyWeightLbs : DEFAULT_WEIGHT_LBS;
  const gramsPerPound =
    goal === "Cutting"
      ? { low: 0.9, high: 1.1 }
      : goal === "Bulking"
      ? { low: 0.7, high: 0.9 }
      : { low: 0.8, high: 1.0 };
  const low = Math.round(weight * gramsPerPound.low);
  const high = Math.round(weight * gramsPerPound.high);
  const target = Math.round(weight);

  return {
    target,
    low,
    high,
    range: `${low}-${high}g/day`,
    gramsPerPound,
  };
}
