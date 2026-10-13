export type GoalType = "cut" | "maintain" | "bulk";

export type WorkoutType = string;

export type ExerciseSet = {
  id: string;
  reps?: number;
  weightLbs?: number;
  isBodyweight?: boolean;
  formFocus?: boolean;
  isWarmup?: boolean;
  rir?: number;
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
  durationSeconds?: number;
  createdAt: string;
  updatedAt: string;
};

export type DailyLog = {
  id: string;
  date: string;
  goal: GoalType;
  weightLbs?: number;
  calories?: number;
  proteinGrams?: number;
  steps?: number;
  measurements?: {
    waistInches?: number;
    chestInches?: number;
    hipInches?: number;
  };
  workoutType?: WorkoutType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserSettings = {
  unitSystem: "imperial" | "metric";
  defaultGoal: GoalType;
  startingWeightLbs?: number;
  targetWeightLbs?: number;
  weeklyGoalPaceLbs?: number;
  calorieTarget?: number;
  proteinTarget?: number;
  stepTarget?: number;
  hasCompletedOnboarding?: boolean;
  updatedAt?: string;
  goalPhases?: GoalPhase[];
  weeklyReviews?: WeeklyReviewDecision[];
  exerciseTargets?: ExerciseTarget[];
};

export type PhaseTargets = Pick<UserSettings, "defaultGoal" | "startingWeightLbs" | "targetWeightLbs" | "weeklyGoalPaceLbs" | "calorieTarget" | "proteinTarget" | "stepTarget">;

export type GoalPhase = {
  id: string;
  startDate: string;
  endDate?: string;
  initialTargets: PhaseTargets;
  targets: PhaseTargets;
  startAverageLbs?: number;
  endAverageLbs?: number;
  loggedDays?: number;
};

export type WeeklyReviewDecision = {
  id: string;
  phaseId?: string;
  reviewedAt: string;
  baselineStart: string;
  baselineEnd: string;
  goal: GoalType;
  action: string;
  status: "accepted" | "dismissed";
  baselineWeight?: number;
  baselineWeighIns: number;
  outcome?: "helped" | "notYet" | "skipped";
};

export type ExerciseTarget = {
  key: string;
  name: string;
  mode: "weighted" | "bodyweight";
  reps: number;
  weightLbs?: number;
};

export type MobileAccount = {
  id: string;
  displayName: string;
  email: string;
  authProvider: "local";
  privateAIAccess: "backend-required";
  createdAt: string;
  updatedAt: string;
};

export type TodayLogDraft = {
  goal: GoalType;
  weightLbs: string;
  calories: string;
  proteinGrams: string;
  steps: string;
  waistInches: string;
  chestInches: string;
  hipInches: string;
  workoutType: WorkoutType;
  notes: string;
};

export type ExerciseSetDraft = {
  id: string;
  reps: string;
  weightLbs: string;
  isBodyweight: boolean;
  formFocus: boolean;
  isWarmup: boolean;
  rir: string;
  notes: string;
};

export type ExerciseDraft = {
  id: string;
  name: string;
  muscleGroup: string;
  sets: ExerciseSetDraft[];
};

export type WorkoutDraft = {
  type: WorkoutType;
  exercises: ExerciseDraft[];
  notes: string;
};
