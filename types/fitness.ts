export type Goal = "Cutting" | "Bulking" | "Maintaining";

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
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
  fatLossCaloriesOnePound: number;
  fatLossCaloriesOnePointFivePounds: number;
  fatLossCaloriesTwoPounds: number;
  confidence: "Low" | "Medium" | "High";
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

export type NutritionTargets = {
  calorieTarget: number;
  calorieRange: string;
  proteinTarget: number;
  proteinRange: string;
  priority: string;
  guidance: string;
  confidence: "Low" | "Medium" | "High";
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

export type CheckInEntry = {
  id: string;
  date: string;
  hunger: number;
  sleepQuality: number;
  soreness: number;
  energy: number;
  stress: number;
  notes: string;
};

export type CheckInSummary = {
  readinessScore: number;
  status: "Ready" | "Manage Load" | "Recovery Priority" | "Need check-in";
  latestCheckIn: CheckInEntry | null;
  averageHunger: number;
  averageSleepQuality: number;
  averageSoreness: number;
  averageEnergy: number;
  averageStress: number;
  recommendation: string;
};
