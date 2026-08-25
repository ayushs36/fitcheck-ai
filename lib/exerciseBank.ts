export type ExerciseBankItem = {
  name: string;
  muscleGroup: string;
  isBodyweight?: boolean;
};

const defaultExerciseBank: Record<string, ExerciseBankItem[]> = {
  push: [
    { name: "Bench Press", muscleGroup: "Chest" },
    { name: "Incline Dumbbell Press", muscleGroup: "Chest" },
    { name: "Shoulder Press", muscleGroup: "Shoulders" },
    { name: "Lateral Raise", muscleGroup: "Shoulders" },
    { name: "Triceps Pushdown", muscleGroup: "Triceps" },
  ],
  pull: [
    { name: "Pull-Up", muscleGroup: "Back", isBodyweight: true },
    { name: "Lat Pulldown", muscleGroup: "Back" },
    { name: "Seated Cable Row", muscleGroup: "Back" },
    { name: "Rear Delt Fly", muscleGroup: "Rear Delts" },
    { name: "Dumbbell Curl", muscleGroup: "Biceps" },
  ],
  legs: [
    { name: "Squat", muscleGroup: "Quads" },
    { name: "Romanian Deadlift", muscleGroup: "Hamstrings" },
    { name: "Leg Press", muscleGroup: "Quads" },
    { name: "Leg Curl", muscleGroup: "Hamstrings" },
    { name: "Calf Raise", muscleGroup: "Calves" },
  ],
  upper: [
    { name: "Bench Press", muscleGroup: "Chest" },
    { name: "Lat Pulldown", muscleGroup: "Back" },
    { name: "Shoulder Press", muscleGroup: "Shoulders" },
    { name: "Seated Cable Row", muscleGroup: "Back" },
    { name: "Dumbbell Curl", muscleGroup: "Biceps" },
  ],
  lower: [
    { name: "Squat", muscleGroup: "Quads" },
    { name: "Romanian Deadlift", muscleGroup: "Hamstrings" },
    { name: "Bulgarian Split Squat", muscleGroup: "Quads" },
    { name: "Hip Thrust", muscleGroup: "Glutes" },
    { name: "Calf Raise", muscleGroup: "Calves" },
  ],
  "full body": [
    { name: "Squat", muscleGroup: "Quads" },
    { name: "Bench Press", muscleGroup: "Chest" },
    { name: "Row", muscleGroup: "Back" },
    { name: "Shoulder Press", muscleGroup: "Shoulders" },
    { name: "Plank", muscleGroup: "Core", isBodyweight: true },
  ],
  cardio: [
    { name: "Treadmill", muscleGroup: "Cardio" },
    { name: "Bike", muscleGroup: "Cardio" },
    { name: "StairMaster", muscleGroup: "Cardio" },
    { name: "Incline Walk", muscleGroup: "Cardio" },
  ],
};

export function getExerciseBankForWorkout(workout: string) {
  return defaultExerciseBank[workout.trim().toLowerCase()] ?? [];
}
