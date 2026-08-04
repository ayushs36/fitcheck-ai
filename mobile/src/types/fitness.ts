export type GoalType = "cut" | "maintain" | "bulk";

export type WorkoutType =
  | "Push"
  | "Pull"
  | "Legs"
  | "Upper"
  | "Lower"
  | "Full Body"
  | "Cardio"
  | "Rest"
  | "Other";

export type ExerciseSet = {
  id: string;
  reps?: number;
  weightLbs?: number;
  isBodyweight?: boolean;
  formFocus?: boolean;
  notes?: string;
};

export type ExerciseLog = {
  id: string;
  name: string;
  muscleGroup?: string;
  sets: ExerciseSet[];
};

export type WorkoutSession = {
  id: string;
  date: string;
  type: WorkoutType;
  exercises: ExerciseLog[];
  notes?: string;
};

export type DailyLog = {
  id: string;
  date: string;
  goal: GoalType;
  weightLbs?: number;
  calories?: number;
  proteinGrams?: number;
  steps?: number;
  workoutType?: WorkoutType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserSettings = {
  unitSystem: "imperial" | "metric";
  defaultGoal: GoalType;
  calorieTarget?: number;
  proteinTarget?: number;
  stepTarget?: number;
};

export type TodayLogDraft = {
  goal: GoalType;
  weightLbs: string;
  calories: string;
  proteinGrams: string;
  steps: string;
  workoutType: WorkoutType;
  notes: string;
};
