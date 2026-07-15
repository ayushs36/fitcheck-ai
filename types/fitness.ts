export type Goal = "Cutting" | "Bulking" | "Maintaining";

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
};

export type ExerciseSignal = {
  name: string;
  status: "Improving" | "Stable" | "Stalled" | "Declining";
  latestVolume: number;
  previousVolume: number;
  volumeChange: number;
  summary: string;
};

export type LogEntry = {
  id: string;
  date: string;
  weight: number;
  calories: number;
  protein: number;
  steps: number;
  workout: string;
  exercises: Exercise[];
};

export type GoalFeasibility = {
  score: number;
  verdict: string;
  currentWeight: number;
  goalWeight: number;
  targetDate: string;
  poundsRemaining: number;
  daysRemaining: number;
  currentLossRate: number;
  requiredLossRate: number;
  recommendation: string;
};

export type ForecastScenario = {
  label: "Conservative" | "Expected" | "Optimistic";
  weeklyPace: number;
  projectedDate: string;
  projectedDays: number;
  projectedWeightAtTargetDate: number;
  summary: string;
};

export type GoalForecast = {
  status: "Need more data" | "On track" | "At risk" | "Unrealistic";
  confidence: "Low" | "Medium" | "High";
  confidenceReason: string;
  targetDate: string;
  targetWeight: number;
  currentWeight: number;
  poundsRemaining: number;
  requiredWeeklyPace: number;
  expectedWeeklyPace: number;
  scenarios: ForecastScenario[];
  recommendation: string;
};

export type TrainingSignal = {
  status: "Progressing" | "Stable" | "Stalled" | "Recovery risk" | "Need more data";
  score: number;
  agentAction: string;
  workoutFrequency: number;
  latestWorkoutVolume: number;
  previousWorkoutVolume: number;
  volumeChange: number;
  improvingLifts: ExerciseSignal[];
  stalledLifts: ExerciseSignal[];
  decliningLifts: ExerciseSignal[];
  recommendation: string;
};

export type AIConversation = {
  id: string;
  type: "Ask AI" | "Weekly Report";
  question: string;
  answer: string;
  createdAt: string;
};

export type AgentCheck = {
  id: string;
  date: string;
  status: string;
  decision?: AgentDecisionAction;
  biggestRisk: string;
  evidence?: string;
  nextAction?: string;
  recommendation: string;
  confidence: string;
  changeSummary?: string;
  fullResponse: string;
};

export type AgentDecisionAction =
  | "Hold calories"
  | "Reduce calories"
  | "Increase steps"
  | "Improve protein"
  | "Focus recovery"
  | "Adjust goal timeline";

export type AgentDecision = {
  action: AgentDecisionAction;
  priority: string;
  rationale: string;
  calorieGuidance: string;
  proteinGuidance: string;
  stepGuidance: string;
  recoveryGuidance: string;
  timelineGuidance: string;
  confidence: "Low" | "Medium" | "High";
};

export type MaintenanceEstimate = {
  estimatedMaintenance: number;
  trendBasedMaintenance: number;
  plausibilityFloor: number;
  maintenanceRangeLow: number;
  maintenanceRangeHigh: number;
  calorieTargetsReliable: boolean;
  fatLossCaloriesOnePound: number;
  fatLossCaloriesOnePointFivePounds: number;
  fatLossCaloriesTwoPounds: number;
  confidence: "Low" | "Medium" | "High";
  confidenceReason: string;
  calculationMethod: "Same-day calories" | "Lag-adjusted calories";
  trendWarning?: string;
  adjustmentGuidance: string;
  explanation: string;
};

export type GoalAdaptation = {
  status: string;
  suggestedGoalDate: string | null;
  suggestedCalories: number | null;
  recommendation: string;
  reason: string;
  confidence: "Low" | "Medium" | "High";
};

export type GoalAdaptationRecord = {
  id: string;
  createdAt: string;
  status: "Accepted" | "Rejected";
  changeType: "Goal date" | "Calories" | "Full suggestion";
  previousGoalDate: string;
  previousGoalWeight: number;
  suggestedGoalDate: string | null;
  suggestedCalories: number | null;
  reason: string;
};

export type NutritionTargets = {
  calorieTarget: number;
  calorieRange: string;
  proteinTarget: number;
  proteinRange: string;
  priority: string;
  guidance: string;
  confidence: "Low" | "Medium" | "High";
};

export type NutritionDiagnosisMetric = {
  label: string;
  score: number;
  target: string;
  actual: string;
  status: "Strong" | "Watch" | "Needs work";
};

export type NutritionDiagnosis = {
  score: number;
  status: "Dialed in" | "Mostly consistent" | "Needs attention" | "Insufficient data";
  biggestBlocker: string;
  agentAction: string;
  calorieAverage: number;
  calorieVariance: number;
  proteinAverage: number;
  proteinHitRate: number;
  loggingCompleteness: number;
  metrics: NutritionDiagnosisMetric[];
  recommendation: string;
};

export type WeeklyPlan = {
  focus: string;
  calories: string;
  protein: string;
  steps: string;
  training: string;
  recovery: string;
  adherenceScore: number;
  adherenceSummary: string;
};

export type CoachingPlanRecord = {
  id: string;
  createdAt: string;
  plan: WeeklyPlan;
  decision: AgentDecisionAction;
  priority: string;
  confidence: "Low" | "Medium" | "High";
  changesFromPrevious: string[];
};

export type RecoveryRisk = {
  score: number;
  level: "Low" | "Medium" | "High";
  drivers: string[];
  recommendation: string;
};

export type DataFreshness = {
  score: number;
  status: "No data" | "Fresh" | "Aging" | "Stale";
  lastLogDate: string | null;
  daysSinceLastLog: number | null;
  missedDaysLast14: number;
  longestGapDays: number;
  confidenceImpact: "None" | "Slight" | "Moderate" | "High";
  message: string;
  recommendation: string;
};

export type PlanAdherenceMetric = {
  label: string;
  score: number;
  target: string;
  actual: string;
  status: "On track" | "Needs attention" | "Off track";
};

export type PlanAdherence = {
  score: number;
  trend: "Improving" | "Stable" | "Declining" | "Need more data";
  biggestBlocker: string;
  blockerRecommendation: string;
  metrics: PlanAdherenceMetric[];
  weeklyScores: Array<{
    label: string;
    score: number;
  }>;
};

export type ReadinessScore = {
  score: number;
  status: "Train hard" | "Maintain plan" | "Manage load" | "Recovery priority";
  drivers: string[];
  recommendation: string;
};
