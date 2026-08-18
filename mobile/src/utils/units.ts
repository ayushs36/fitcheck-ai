import { UserSettings } from "../types/fitness";

export type UnitSystem = UserSettings["unitSystem"];

const poundsPerKilogram = 2.20462;

export function getWeightUnitLabel(unitSystem: UnitSystem): string {
  return unitSystem === "metric" ? "kg" : "lb";
}

export function convertWeightFromLbs(value: number, unitSystem: UnitSystem): number {
  return unitSystem === "metric" ? value / poundsPerKilogram : value;
}

export function parseWeightToLbs(value: string, unitSystem: UnitSystem): number | undefined {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || value.trim() === "") {
    return undefined;
  }

  const weightLbs = unitSystem === "metric" ? parsedValue * poundsPerKilogram : parsedValue;
  return Math.round(weightLbs * 10) / 10;
}

export function formatWeightFromLbs(value: number | undefined, unitSystem: UnitSystem): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "";
  }

  const displayValue = convertWeightFromLbs(value, unitSystem);
  return String(Math.round(displayValue * 10) / 10);
}
