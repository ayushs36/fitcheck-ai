import { isDailyLog, isUserSettings, isWorkoutSession } from "../storage/validateRecords.ts";

export function describeRecord(payload: Record<string, unknown>, deleted: boolean): string {
  if (deleted) return "Deleted record";
  const lines: string[] = [];
  const add = (label: string, value: unknown) => {
    if (value !== undefined && value !== null && value !== "") lines.push(`${label}: ${String(value)}`);
  };
  const goal = (value: string) => value === "cut" ? "Cutting" : value === "bulk" ? "Bulking" : "Maintaining";
  if (isDailyLog(payload)) {
    add("Date", payload.date); add("Goal", goal(payload.goal));
    add("Weight (lb)", payload.weightLbs); add("Calories", payload.calories);
    add("Protein (g)", payload.proteinGrams); add("Steps", payload.steps);
    add("Workout", payload.workoutType); add("Notes", payload.notes);
  } else if (isWorkoutSession(payload)) {
    add("Date", payload.date); add("Workout", payload.type);
    for (const exercise of payload.exercises) {
      lines.push("", exercise.name);
      add("Muscle group", exercise.muscleGroup);
      exercise.sets.forEach((set, index) => {
        const parts = [];
        if (set.reps !== undefined) parts.push(`${set.reps} reps`);
        if (set.isBodyweight) parts.push("bodyweight");
        if (set.weightLbs !== undefined) parts.push(`${set.weightLbs} lb`);
        if (set.formFocus) parts.push("form focus");
        lines.push(`Set ${index + 1}: ${parts.join(", ") || "No metrics logged"}`);
        add("Set notes", set.notes);
      });
    }
    add("Workout notes", payload.notes);
  } else if (isUserSettings(payload)) {
    add("Goal", goal(payload.defaultGoal)); add("Units", payload.unitSystem);
    add("Starting weight (lb)", payload.startingWeightLbs); add("Target weight (lb)", payload.targetWeightLbs);
    add("Weekly goal (lb)", payload.weeklyGoalPaceLbs); add("Calorie target", payload.calorieTarget);
    add("Protein target (g)", payload.proteinTarget); add("Step target", payload.stepTarget);
  } else return "Record could not be displayed. Export a backup before resolving.";
  return lines.join("\n");
}
