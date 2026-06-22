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

export type MaintenanceEstimate = {
  estimatedMaintenance: number;
  fatLossCaloriesOnePound: number;
  fatLossCaloriesOnePointFivePounds: number;
  fatLossCaloriesTwoPounds: number;
  confidence: "Low" | "Medium" | "High";
  explanation: string;
};