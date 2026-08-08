import { WorkoutType } from "../types/fitness";

export type ExerciseTemplate = {
  name: string;
  muscleGroup: string;
  isBodyweight?: boolean;
};

export const exerciseTemplatesByWorkoutType: Record<WorkoutType, ExerciseTemplate[]> = {
  Push: [
    { name: "Bench Press", muscleGroup: "Chest" },
    { name: "Incline Dumbbell Press", muscleGroup: "Chest" },
    { name: "Shoulder Press", muscleGroup: "Shoulders" },
    { name: "Lateral Raise", muscleGroup: "Shoulders" },
    { name: "Triceps Pushdown", muscleGroup: "Triceps" },
  ],
  Pull: [
    { name: "Pull-Up", muscleGroup: "Back", isBodyweight: true },
    { name: "Lat Pulldown", muscleGroup: "Back" },
    { name: "Seated Cable Row", muscleGroup: "Back" },
    { name: "Rear Delt Fly", muscleGroup: "Rear Delts" },
    { name: "Dumbbell Curl", muscleGroup: "Biceps" },
  ],
  Legs: [
    { name: "Squat", muscleGroup: "Quads" },
    { name: "Romanian Deadlift", muscleGroup: "Hamstrings" },
    { name: "Leg Press", muscleGroup: "Quads" },
    { name: "Leg Curl", muscleGroup: "Hamstrings" },
    { name: "Calf Raise", muscleGroup: "Calves" },
  ],
  Upper: [
    { name: "Bench Press", muscleGroup: "Chest" },
    { name: "Lat Pulldown", muscleGroup: "Back" },
    { name: "Shoulder Press", muscleGroup: "Shoulders" },
    { name: "Seated Cable Row", muscleGroup: "Back" },
    { name: "Dumbbell Curl", muscleGroup: "Biceps" },
  ],
  Lower: [
    { name: "Squat", muscleGroup: "Quads" },
    { name: "Romanian Deadlift", muscleGroup: "Hamstrings" },
    { name: "Bulgarian Split Squat", muscleGroup: "Quads" },
    { name: "Hip Thrust", muscleGroup: "Glutes" },
    { name: "Calf Raise", muscleGroup: "Calves" },
  ],
  "Full Body": [
    { name: "Squat", muscleGroup: "Quads" },
    { name: "Bench Press", muscleGroup: "Chest" },
    { name: "Row", muscleGroup: "Back" },
    { name: "Shoulder Press", muscleGroup: "Shoulders" },
    { name: "Plank", muscleGroup: "Core", isBodyweight: true },
  ],
  Cardio: [
    { name: "Treadmill", muscleGroup: "Cardio" },
    { name: "Bike", muscleGroup: "Cardio" },
    { name: "StairMaster", muscleGroup: "Cardio" },
    { name: "Incline Walk", muscleGroup: "Cardio" },
  ],
  Rest: [],
  Other: [
    { name: "Custom Exercise", muscleGroup: "" },
    { name: "Mobility", muscleGroup: "Recovery", isBodyweight: true },
    { name: "Core Circuit", muscleGroup: "Core", isBodyweight: true },
  ],
};
