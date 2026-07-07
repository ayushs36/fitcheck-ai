"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import type {
  Goal,
  Exercise,
  LogEntry,
  GoalFeasibility,
  AIConversation,
  MaintenanceEstimate,
  AgentCheck,
} from "@/types/fitness";
import {
  calculateExerciseVolume,
  addDays,
  formatDate,
} from "@/lib/calculations";
import { getAgentDecision } from "@/lib/agentDecision";
import {
  getGoalAdaptation,
  getNutritionTargets,
  getRecoveryRisk,
  getWeeklyPlan,
} from "@/lib/advancedInsights";
import { createDemoAgentHistory, createDemoLogs } from "@/lib/demoData";
import {
  adjustDecisionForFreshness,
  getDataFreshness,
} from "@/lib/dataFreshness";
import { getPlanAdherence } from "@/lib/planAdherence";

import { Stat } from "@/components/Stat";

import { StatusBadge } from "@/components/StatusBadge";

import { GoalProgressBar } from "@/components/GoalProgressBar";

import { Input, NumberInput, Select } from "@/components/FormInputs";

import { AskAICard } from "@/components/AskAICard";

import { AIWeeklyReportCard } from "@/components/AIWeeklyReportCard";

import { GoalStrategyCard } from "@/components/GoalStrategyCard";

import { DailyLogCard } from "@/components/DailyLogCard";

import { FitCheckAgentCard } from "@/components/FitCheckAgentCard";

import { AgentHistoryCard } from "@/components/AgentHistoryCard";

import { AgentDashboardCard } from "@/components/AgentDashboardCard";

import { GoalAdaptationCard } from "@/components/GoalAdaptationCard";

import { DemoModeCard } from "@/components/DemoModeCard";

import { WeeklyPlanCard } from "@/components/WeeklyPlanCard";

import { NutritionTargetsCard } from "@/components/NutritionTargetsCard";

import { RecoveryRiskCard } from "@/components/RecoveryRiskCard";

import { DataFreshnessCard } from "@/components/DataFreshnessCard";

import { PlanAdherenceCard } from "@/components/PlanAdherenceCard";

const STORAGE_KEY = "fitcheck-logs-v1";
const SETTINGS_KEY = "fitcheck-settings-v1";
const AI_HISTORY_KEY = "fitcheck-ai-history-v1";
const AGENT_HISTORY_KEY = "fitcheck-agent-history-v1";

export default function Home() {
  const [goal, setGoal] = useState<Goal>("Cutting");
  const [goalWeight, setGoalWeight] = useState(130);
  const [goalDate, setGoalDate] = useState("2026-06-17");

  const [entry, setEntry] = useState<LogEntry>({
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
    weight: 138.3,
    calories: 1850,
    protein: 145,
    steps: 12000,
    workout: "Push Day",
    exercises: [],
  });

  const [exercise, setExercise] = useState<Exercise>({
    id: crypto.randomUUID(),
    name: "",
    sets: 3,
    reps: 10,
    weight: 0,
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedLogMonths, setExpandedLogMonths] = useState<string[]>([]);
  const [coachQuestion, setCoachQuestion] = useState("");
const [coachAnswer, setCoachAnswer] = useState(
  "Ask FitCheck AI a question..."
);
const [isCoachLoading, setIsCoachLoading] = useState(false);

const [aiWeeklyReport, setAiWeeklyReport] = useState(
  "Generate an AI weekly report once you have at least 7 saved logs."
);

const [isWeeklyReportLoading, setIsWeeklyReportLoading] =
  useState(false);
  const [aiHistory, setAiHistory] = useState<AIConversation[]>([]);
  const [goalStrategy, setGoalStrategy] = useState(
  "Generate an AI goal strategy to get a personalized plan for reaching your target."
);
const [isGoalStrategyLoading, setIsGoalStrategyLoading] = useState(false); 
const [agentReport, setAgentReport] = useState(
  "Run FitCheck Agent to analyze your latest trends and generate your next action plan."
);

const [isAgentLoading, setIsAgentLoading] = useState(false);
const [agentHistory, setAgentHistory] = useState<AgentCheck[]>([]);
const [expandedAgentCheckId, setExpandedAgentCheckId] =
  useState<string | null>(null);
  useEffect(() => {
    const savedAiHistory = localStorage.getItem(AI_HISTORY_KEY);
    if (savedAiHistory) setAiHistory(JSON.parse(savedAiHistory));
  }, []);
  useEffect(() => {
    const savedLogs = localStorage.getItem(STORAGE_KEY);
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);
useEffect(() => {
  const savedHistory = localStorage.getItem(AI_HISTORY_KEY);

  if (savedHistory) {
    setAiHistory(JSON.parse(savedHistory));
  }
}, []);
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);

    if (savedSettings) {
      const settings = JSON.parse(savedSettings);

      if (settings.goal) setGoal(settings.goal);
      if (settings.goalWeight) setGoalWeight(settings.goalWeight);
      if (settings.goalDate) setGoalDate(settings.goalDate);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);
useEffect(() => {
  localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(aiHistory));
}, [aiHistory]);
useEffect(() => {
  const savedAgentHistory = localStorage.getItem(AGENT_HISTORY_KEY);

  if (savedAgentHistory) {
    setAgentHistory(JSON.parse(savedAgentHistory));
  }
}, []);
useEffect(() => {
  localStorage.setItem(AGENT_HISTORY_KEY, JSON.stringify(agentHistory));
}, [agentHistory]);
  useEffect(() => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        goal,
        goalWeight,
        goalDate,
      })
    );
  }, [goal, goalWeight, goalDate]);

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => a.date.localeCompare(b.date)),
    [logs]
  );

  const last7Logs = sortedLogs.slice(-7);
  const last14Logs = sortedLogs.slice(-14);

  const average = (values: number[]) =>
    values.length === 0
      ? 0
      : values.reduce((sum, value) => sum + value, 0) / values.length;

  const latestLog = sortedLogs[sortedLogs.length - 1];
  const latestWeight = latestLog?.weight ?? 0;

  const movingAverage =
  last7Logs.length > 0 ? average(last7Logs.map((log) => log.weight)) : 0;

const fourteenDayAverage =
  last14Logs.length > 0 ? average(last14Logs.map((log) => log.weight)) : 0;

  const avgCalories = average(last7Logs.map((log) => log.calories));
  const avgProtein = average(last7Logs.map((log) => log.protein));
  const avgSteps = average(last7Logs.map((log) => log.steps));

  const plateauDifference = Math.abs(movingAverage - fourteenDayAverage);

  let plateauStatus = "Need more data";

  if (logs.length >= 14) {
    if (plateauDifference <= 0.3) {
      plateauStatus = "Potential plateau detected";
    } else if (movingAverage < fourteenDayAverage) {
      plateauStatus = "Progress trending down";
    } else {
      plateauStatus = "Weight trending up";
    }
  }

  let plateauRecommendation =
    "Log at least 14 days of data to detect plateaus accurately.";

  if (plateauStatus === "Potential plateau detected") {
    plateauRecommendation =
      "Your 7-day and 14-day averages are very close, which may indicate a plateau. Check calorie consistency, maintain protein, keep steps consistent, and reassess after several more days before making aggressive changes.";
  } else if (plateauStatus === "Progress trending down") {
    plateauRecommendation =
      "Your 7-day average is below your 14-day average, which means progress is still moving in the right direction.";
  } else if (plateauStatus === "Weight trending up") {
    plateauRecommendation =
      "Your 7-day average is above your 14-day average. Review recent calories, steps, sodium, carbs, and workout stress before assuming fat gain.";
  }

  const first7Weight = last7Logs[0]?.weight ?? latestWeight;
  const weeklyWeightChange =
    last7Logs.length >= 2 ? latestWeight - first7Weight : 0;

  const effectiveWeight =
    movingAverage > 0 ? movingAverage : latestWeight;

  const poundsToGoal = effectiveWeight - goalWeight;

  const poundsRemaining = Math.max(0, poundsToGoal);

  const startWeight = sortedLogs[0]?.weight ?? effectiveWeight;

  const totalGoalDistance = Math.max(0, startWeight - goalWeight);

  const weightLostTowardGoal = Math.max(0, startWeight - effectiveWeight);

  const goalProgressPercent =
    totalGoalDistance > 0
      ? Math.min(
          100,
          Math.round((weightLostTowardGoal / totalGoalDistance) * 100)
        )
      : 0;

  const today = new Date();
  const targetDate = new Date(goalDate);

  const daysUntilGoal = Math.max(
    0,
    Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  const weeksUntilGoal = daysUntilGoal / 7;

  const requiredWeeklyLoss =
    weeksUntilGoal > 0 ? poundsRemaining / weeksUntilGoal : 0;

  const weeklyAverageChange = useMemo(() => {
  const validWeightLogs = sortedLogs.filter((log) => log.weight > 0);

  if (validWeightLogs.length < 14) {
    return 0;
  }

  const previous7Logs = validWeightLogs.slice(-14, -7);
  const recent7Logs = validWeightLogs.slice(-7);

  const previous7Average = average(previous7Logs.map((log) => log.weight));
  const recent7Average = average(recent7Logs.map((log) => log.weight));

  return recent7Average - previous7Average;
}, [sortedLogs]);

const currentPace = weeklyAverageChange < 0 ? Math.abs(weeklyAverageChange) : 0;
      const maintenanceEstimate: MaintenanceEstimate = useMemo(() => {
  const validLogs = sortedLogs.filter(
    (log) => log.weight > 0 && log.calories > 0
  );

  if (validLogs.length < 14) {
    return {
      estimatedMaintenance: 0,
      fatLossCaloriesOnePound: 0,
      fatLossCaloriesOnePointFivePounds: 0,
      fatLossCaloriesTwoPounds: 0,
      confidence: "Low",
      explanation:
        "Log at least 14 days with weight and calories to estimate maintenance calories.",
    };
  }

  const recentLogs = validLogs.slice(-14);

  const averageCalories = average(recentLogs.map((log) => log.calories));

  const first7Logs = recentLogs.slice(0, 7);
  const last7LogsForMaintenance = recentLogs.slice(7);

  const first7Average = average(first7Logs.map((log) => log.weight));
  const last7Average = average(
    last7LogsForMaintenance.map((log) => log.weight)
  );

  const weeklyWeightChange = last7Average - first7Average;

  const estimatedDailyDeficit = -weeklyWeightChange * 500;

  const estimatedMaintenance = averageCalories + estimatedDailyDeficit;

  let confidence: MaintenanceEstimate["confidence"] = "Medium";

  if (validLogs.length >= 28) {
    confidence = "High";
  } else if (validLogs.length < 21) {
    confidence = "Low";
  }

  return {
    estimatedMaintenance,
    fatLossCaloriesOnePound: estimatedMaintenance - 500,
    fatLossCaloriesOnePointFivePounds: estimatedMaintenance - 750,
    fatLossCaloriesTwoPounds: estimatedMaintenance - 1000,
    confidence,
    explanation: `Based on your last 14 valid logs, your average intake is ${averageCalories.toFixed(
      0
    )} calories/day. Your first 7-day average weight was ${first7Average.toFixed(
      1
    )} lbs and your most recent 7-day average weight is ${last7Average.toFixed(
      1
    )} lbs. This suggests a weekly weight change of ${weeklyWeightChange.toFixed(
      1
    )} lbs/week and an estimated maintenance of about ${estimatedMaintenance.toFixed(
      0
    )} calories/day.`,
  };
}, [sortedLogs]);

  const projectedGoalDate =
    currentPace > 0 && poundsRemaining > 0
      ? addDays(today, (poundsRemaining / currentPace) * 7)
      : null;

  const projectedGoalDateText = projectedGoalDate
    ? formatDate(projectedGoalDate)
    : "Need more data";

  let goalStatus = "Need more data";

  if (projectedGoalDate && goalDate) {
    const differenceInDays =
      (projectedGoalDate.getTime() - targetDate.getTime()) /
      (1000 * 60 * 60 * 24);

    if (differenceInDays < -3) goalStatus = "Ahead of schedule";
    else if (differenceInDays <= 7) goalStatus = "On track";
    else goalStatus = "Behind schedule";
  }

  const confidenceScore = Math.min(95, Math.max(30, logs.length * 8 + 30));

  const goalFeasibility: GoalFeasibility = useMemo(() => {
    if (logs.length < 7) {
      return {
        score: 0,
        verdict: "Need more data",
        currentWeight: effectiveWeight,
        goalWeight,
        targetDate: goalDate,
        poundsRemaining,
        daysRemaining: daysUntilGoal,
        currentLossRate: currentPace,
        requiredLossRate: requiredWeeklyLoss,
        recommendation:
          "Log at least 7 days before using the Goal Feasibility Agent.",
      };
    }

    let score = 100;

    if (requiredWeeklyLoss <= 0) {
      score = 100;
    } else if (currentPace <= 0) {
      score = 25;
    } else {
      score = Math.round(
        Math.min(100, (currentPace / requiredWeeklyLoss) * 100)
      );
    }

    let verdict = "Realistic";
    let recommendation =
      "Your goal is realistic if you maintain your average-based trend.";

    if (score >= 90) {
      verdict = "Very realistic";
      recommendation =
        "Your average-based pace is strong enough to reach your goal. Stay consistent.";
    } else if (score >= 70) {
      verdict = "Realistic";
      recommendation =
        "Your current trend gives you a realistic chance of reaching your goal.";
    } else if (score >= 45) {
      verdict = "Aggressive";
      recommendation =
        "Your goal is possible, but it may require tighter calorie consistency, steady steps, and strong protein intake.";
    } else {
      verdict = "Unlikely";
      recommendation =
        "Your current average-based pace is not fast enough for this deadline. Consider extending the timeline or improving consistency.";
    }

    return {
      score,
      verdict,
      currentWeight: effectiveWeight,
      goalWeight,
      targetDate: goalDate,
      poundsRemaining,
      daysRemaining: daysUntilGoal,
      currentLossRate: currentPace,
      requiredLossRate: requiredWeeklyLoss,
      recommendation,
    };
  }, [
    logs.length,
    effectiveWeight,
    goalWeight,
    goalDate,
    poundsRemaining,
    daysUntilGoal,
    currentPace,
    requiredWeeklyLoss,
  ]);

  const chartData = sortedLogs.map((log, index) => {
  const recentLogsForAverage = sortedLogs.slice(
    Math.max(0, index - 6),
    index + 1
  );

  return {
    date: log.date.slice(5),
    weight: Number(log.weight.toFixed(1)),
    movingAverage:
  recentLogsForAverage.length > 0
    ? Number(
        average(recentLogsForAverage.map((item) => item.weight)).toFixed(1)
      )
    : Number(log.weight.toFixed(1)),
    calories: log.calories,
    protein: log.protein,
    steps: log.steps,
  };
});

  const totalExercises = sortedLogs.reduce(
    (total, log) => total + log.exercises.length,
    0
  );

  const workoutLogs = sortedLogs.filter((log) => log.exercises.length > 0);

const latestWorkout = workoutLogs[workoutLogs.length - 1];

const latestWorkoutExercises = latestWorkout?.exercises ?? [];

const previousMatchingWorkout = workoutLogs
  .slice(0, -1)
  .reverse()
  .find((log) =>
    log.exercises.some((exercise) =>
      latestWorkoutExercises.some(
        (latestExercise) =>
          latestExercise.name.toLowerCase().trim() ===
          exercise.name.toLowerCase().trim()
      )
    )
  );

const matchingExerciseComparisons =
  latestWorkout && previousMatchingWorkout
    ? latestWorkout.exercises
        .map((latestExercise) => {
          const previousExercise = previousMatchingWorkout.exercises.find(
            (exercise) =>
              exercise.name.toLowerCase().trim() ===
              latestExercise.name.toLowerCase().trim()
          );

          if (!previousExercise) return null;

          const latestTotalReps = latestExercise.sets * latestExercise.reps;
          const previousTotalReps = previousExercise.sets * previousExercise.reps;

          const latestVolume = calculateExerciseVolume(latestExercise);
          const previousVolume = calculateExerciseVolume(previousExercise);

          return {
            name: latestExercise.name,
            latestTotalReps,
            previousTotalReps,
            latestWeight: latestExercise.weight,
            previousWeight: previousExercise.weight,
            latestVolume,
            previousVolume,
            repChange: latestTotalReps - previousTotalReps,
            volumeChange: latestVolume - previousVolume,
          };
        })
        .filter((item) => item !== null)
    : [];

const latestWorkoutVolume =
  latestWorkout?.exercises.reduce(
    (total, exercise) => total + calculateExerciseVolume(exercise),
    0
  ) ?? 0;

const previousWorkoutVolume =
  previousMatchingWorkout?.exercises.reduce(
    (total, exercise) => total + calculateExerciseVolume(exercise),
    0
  ) ?? 0;

const volumeChange =
  previousWorkoutVolume > 0
    ? ((latestWorkoutVolume - previousWorkoutVolume) /
        previousWorkoutVolume) *
      100
    : 0;

let strengthStatus = "Need more matching workout data";

if (matchingExerciseComparisons.length > 0) {
  const improved = matchingExerciseComparisons.filter(
    (item) =>
      item.latestTotalReps > item.previousTotalReps ||
      item.latestWeight > item.previousWeight ||
      item.latestVolume > item.previousVolume
  ).length;

  const declined = matchingExerciseComparisons.filter(
    (item) =>
      item.latestTotalReps < item.previousTotalReps &&
      item.latestWeight <= item.previousWeight
  ).length;

  if (improved > declined) {
    strengthStatus = "Strength/performance improving";
  } else if (declined > improved) {
    strengthStatus = "Strength/performance dropping";
  } else {
    strengthStatus = "Strength/performance stable";
  }
}

let strengthInsight =
  "Add at least 2 workouts with matching exercises to track strength trends. Rest days and different muscle groups are ignored.";

if (strengthStatus === "Strength/performance improving") {
  strengthInsight =
    "Your matching exercises improved compared to the last time you performed them. This suggests strength or workout performance is improving.";
} else if (strengthStatus === "Strength/performance dropping") {
  strengthInsight =
    "Your matching exercises dropped in reps, weight, or volume compared to the last time you performed them. Watch recovery, sleep, calories, and fatigue.";
} else if (strengthStatus === "Strength/performance stable") {
  strengthInsight =
    "Your matching exercises are relatively stable. Rest days and unrelated workout days are not counted against your strength score.";
}

  const proteinTargetMet = avgProtein >= 130;
  const stepTargetMet = avgSteps >= 10000;
  const enoughData = logs.length >= 3;

  const trend =
    currentPace > 1
      ? "Losing"
      : weeklyWeightChange > 0.5
      ? "Gaining"
      : "Maintaining / Flat";

  const weeklyAIReview = useMemo(() => {
    if (logs.length < 7) {
      return {
        trend: "Not enough data",
        summary: "Log at least 7 days to unlock your Weekly AI Review.",
        mainAction:
          "Keep logging saved daily entries for weight, calories, protein, steps, and workouts.",
      };
    }

    let weeklyTrend = "Stable";
    let mainAction = "Stay consistent with your current plan.";

    if (currentPace >= 1.3) {
      weeklyTrend = "Strong fat-loss pace";
      mainAction =
        "Your average-based pace is strong. Keep protein high and monitor training performance.";
    } else if (currentPace >= 0.7) {
      weeklyTrend = "Steady fat loss";
      mainAction =
        "Continue your current calorie, protein, step, and training routine.";
    } else if (currentPace > 0) {
      weeklyTrend = "Slow fat loss";
      mainAction =
        "Check calorie consistency, sodium, sleep, and steps before making a change.";
    } else if (weeklyWeightChange > 0.5) {
      weeklyTrend = "Weight trending up";
      mainAction =
        "Review recent calories, sodium, carbs, and untracked meals before changing the plan.";
    } else {
      weeklyTrend = "Flat / maintenance trend";
      mainAction =
        "If your goal is cutting, improve consistency or slightly increase steps.";
    }

    if (goalFeasibility.verdict === "Unlikely") {
      mainAction =
        "Your deadline may be too aggressive. Either improve consistency or extend the goal timeline.";
    }

    if (plateauStatus === "Potential plateau detected") {
      mainAction =
        "Watch the next 7 days closely. If the plateau continues, slightly reduce calories or increase steps.";
    }

    return {
      trend: weeklyTrend,
      summary: `This week, your latest logged weight changed by ${weeklyWeightChange.toFixed(
        1
      )} lbs, while your average-based pace is ${currentPace.toFixed(
        1
      )} lbs/week. You averaged ${avgCalories.toFixed(
        0
      )} calories, ${avgProtein.toFixed(0)}g protein, and ${avgSteps.toFixed(
        0
      )} steps. Your current goal status is ${goalStatus}.`,
      mainAction,
    };
  }, [
    logs.length,
    weeklyWeightChange,
    currentPace,
    avgCalories,
    avgProtein,
    avgSteps,
    goalStatus,
    goalFeasibility.verdict,
    plateauStatus,
  ]);

  const weeklyReport = `
Goal: ${goal}
7-Day Average Weight: ${movingAverage.toFixed(1)} lbs
14-Day Average Weight: ${fourteenDayAverage.toFixed(1)} lbs
Goal Weight: ${goalWeight.toFixed(1)} lbs
Pounds to Goal: ${poundsToGoal.toFixed(1)} lbs
Average Calories: ${avgCalories.toFixed(0)}
Average Protein: ${avgProtein.toFixed(0)}g
Average Steps: ${avgSteps.toFixed(0)}
Weekly Weight Change: ${weeklyWeightChange.toFixed(1)} lbs
Current Pace: ${currentPace.toFixed(1)} lbs/week
Required Weekly Loss: ${requiredWeeklyLoss.toFixed(1)} lbs/week
Projected Goal Date: ${projectedGoalDateText}
Goal Status: ${goalStatus}
Plateau Status: ${plateauStatus}
7v14 Average Difference: ${plateauDifference.toFixed(1)} lbs
Plateau Recommendation: ${plateauRecommendation}
Total Exercises Logged: ${totalExercises}
Latest Workout Volume: ${latestWorkoutVolume.toFixed(0)}
Previous Workout Volume: ${previousWorkoutVolume.toFixed(0)}
Volume Change: ${volumeChange.toFixed(1)}%
Strength Status: ${strengthStatus}
AI Confidence Score: ${confidenceScore}%
`;

  const recommendation = getRecommendation({
    goal,
    logsCount: logs.length,
    avgProtein,
    avgSteps,
    avgCalories,
    weeklyWeightChange,
    requiredWeeklyLoss,
    poundsToGoal,
    totalExercises,
    strengthStatus,
    plateauStatus,
  });

  const dataFreshness = getDataFreshness(sortedLogs);
  const baseAgentDecision = getAgentDecision({
    goal,
    logsCount: logs.length,
    avgCalories,
    avgProtein,
    avgSteps,
    currentPace,
    requiredWeeklyLoss,
    plateauStatus,
    strengthStatus,
    goalStatus,
    goalFeasibility,
    maintenanceEstimate,
  });
  const agentDecision = adjustDecisionForFreshness(
    baseAgentDecision,
    dataFreshness
  );

  const latestAgentCheck = agentHistory[0];
  const previousAgentCheck = agentHistory[1];

  const advancedInsightInput = {
    goal,
    logs: sortedLogs,
    effectiveWeight,
    goalWeight,
    goalDate,
    avgCalories,
    avgProtein,
    avgSteps,
    currentPace,
    requiredWeeklyLoss,
    goalStatus,
    plateauStatus,
    strengthStatus,
    volumeChange,
    goalFeasibility,
    maintenanceEstimate,
    agentDecision,
    dataFreshness,
  };
  const goalAdaptation = getGoalAdaptation(advancedInsightInput);
  const nutritionTargets = getNutritionTargets(advancedInsightInput);
  const weeklyPlan = getWeeklyPlan(advancedInsightInput);
  const recoveryRisk = getRecoveryRisk(advancedInsightInput);
  const planAdherence = getPlanAdherence({
    logs: sortedLogs,
    nutritionTargets,
  });

  function resetEntry() {
    setEntry({
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      weight: latestWeight,
      calories: 1850,
      protein: 145,
      steps: 12000,
      workout: "",
      exercises: [],
    });

    setEditingId(null);
  }

  function addExercise() {
    if (!exercise.name.trim()) {
      alert("Please enter an exercise name.");
      return;
    }

    setEntry({
      ...entry,
      exercises: [...entry.exercises, { ...exercise, id: crypto.randomUUID() }],
    });

    setExercise({
      id: crypto.randomUUID(),
      name: "",
      sets: 3,
      reps: 10,
      weight: 0,
    });
  }

  function deleteExercise(id: string) {
    setEntry({
      ...entry,
      exercises: entry.exercises.filter((item) => item.id !== id),
    });
  }

  function saveLog() {
    if (!entry.date) return alert("Please enter a date.");
    if (entry.weight <= 0) return alert("Please enter a valid weight.");

    const duplicateDate = logs.some(
      (log) => log.date === entry.date && log.id !== editingId
    );

    if (duplicateDate) {
      alert(
        "A log already exists for this date. Edit that log or choose another date."
      );
      return;
    }

    if (editingId) {
      setLogs(
        logs.map((log) =>
          log.id === editingId ? { ...entry, id: editingId } : log
        )
      );
      resetEntry();
      return;
    }

    setLogs([...logs, { ...entry, id: crypto.randomUUID() }]);
    resetEntry();
  }

  function editLog(log: LogEntry) {
    setEntry(log);
    setEditingId(log.id);
  }

  function deleteLog(id: string) {
    setLogs(logs.filter((log) => log.id !== id));
  }

  function clearAllLogs() {
    if (confirm("Delete all logs?")) {
      setLogs([]);
      localStorage.removeItem(STORAGE_KEY);
      resetEntry();
    }
  }

  function loadDemoData() {
    const demoLogs = createDemoLogs();

    setGoal("Cutting");
    setGoalWeight(134);
    setGoalDate(addDays(new Date(), 28).toISOString().slice(0, 10));
    setLogs(demoLogs);
    setAgentHistory(createDemoAgentHistory());
    setExpandedLogMonths([]);
    setEntry({
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      weight: demoLogs[demoLogs.length - 1]?.weight ?? 138,
      calories: 1850,
      protein: 145,
      steps: 11000,
      workout: "",
      exercises: [],
    });
    setAgentReport(
      "Demo data loaded. Run FitCheck Agent to generate a fresh coaching check from the sample logs."
    );
  }

  function applyGoalDateSuggestion() {
    if (goalAdaptation.suggestedGoalDate) {
      setGoalDate(goalAdaptation.suggestedGoalDate);
    }
  }

  function applyCalorieSuggestion() {
    if (goalAdaptation.suggestedCalories) {
      setEntry({ ...entry, calories: goalAdaptation.suggestedCalories });
    }
  }


function saveAIConversation(
  type: AIConversation["type"],
  question: string,
  answer: string
) {
  const newConversation: AIConversation = {
    id: crypto.randomUUID(),
    type,
    question,
    answer,
    createdAt: new Date().toLocaleString(),
  };

  setAiHistory((current) => [newConversation, ...current]);
}

function getAgentSection(response: string, label: string) {
  const sections = [
    "Overall Status",
    "Biggest Risk",
    "Evidence",
    "Decision Engine Action",
    "Calorie Target",
    "Protein Target",
    "Step Target",
    "Training Focus",
    "Next 7-Day Action Plan",
    "Confidence Level",
  ];
  const escapedSections = sections
    .map((section) => section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `(?:^|\\n)\\s*(?:[-*]\\s*)?(?:\\*\\*)?${escapedLabel}(?:\\*\\*)?:?\\s*([\\s\\S]*?)(?=\\n\\s*(?:[-*]\\s*)?(?:\\*\\*)?(?:${escapedSections})(?:\\*\\*)?:|$)`,
    "i"
  );
  const match = response.match(regex);
  const value = match?.[1]
    ?.replace(/^[-*]\s*/, "")
    .replace(/\n+/g, " ")
    .trim();

  return value || "Not specified";
}

function saveAgentCheck(fullResponse: string) {
  setAgentHistory((current) => {
    const currentDecision = agentDecision.action;
    const previousDecision = current[0]?.decision;
    const changeSummary = previousDecision
      ? previousDecision === currentDecision
        ? "No change. The agent kept the same core recommendation."
        : `Previous: ${previousDecision}. Current: ${currentDecision}. Change reason: ${agentDecision.rationale}`
      : "First saved agent recommendation.";

    const newAgentCheck: AgentCheck = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleString(),
      status: getAgentSection(fullResponse, "Overall Status"),
      decision: currentDecision,
      biggestRisk: getAgentSection(fullResponse, "Biggest Risk"),
      evidence: getAgentSection(fullResponse, "Evidence"),
      nextAction: getAgentSection(fullResponse, "Next 7-Day Action Plan"),
      recommendation: getAgentSection(fullResponse, "Next 7-Day Action Plan"),
      confidence: getAgentSection(fullResponse, "Confidence Level"),
      changeSummary,
      fullResponse,
    };

    return [newAgentCheck, ...current];
  });
}

function clearAgentHistory() {
  setAgentHistory([]);
  setExpandedAgentCheckId(null);
}
  function askFitCheckAI() {
    const question = coachQuestion.toLowerCase().trim();

    if (!question) {
      setCoachAnswer("Ask a question first so FitCheck AI can analyze your data.");
      return;
    }

    if (logs.length < 7) {
      setCoachAnswer(
        "You need at least 7 saved logs before FitCheck AI can give a useful answer. Keep logging weight, calories, protein, steps, and workouts."
      );
      return;
    }

    if (
      question.includes("plateau") ||
      question.includes("stall") ||
      question.includes("stalled")
    ) {
      setCoachAnswer(
        `Your plateau status is: ${plateauStatus}. Your 7-day average is ${movingAverage.toFixed(
          1
        )} lbs and your 14-day average is ${fourteenDayAverage.toFixed(
          1
        )} lbs. ${plateauRecommendation}`
      );
      return;
    }

    if (
      question.includes("goal") ||
      question.includes("130") ||
      question.includes("on track") ||
      question.includes("timeline")
    ) {
      setCoachAnswer(
        `FitCheck AI is using ${effectiveWeight.toFixed(
          1
        )} lbs as your forecast weight. Your goal is ${goalWeight.toFixed(
          1
        )} lbs by ${goalDate}. You have ${poundsRemaining.toFixed(
          1
        )} lbs remaining. Your current pace is ${currentPace.toFixed(
          1
        )} lbs/week and your required pace is ${requiredWeeklyLoss.toFixed(
          1
        )} lbs/week. Verdict: ${goalFeasibility.verdict}. ${goalFeasibility.recommendation}`
      );
      return;
    }

    if (
      question.includes("calorie") ||
      question.includes("calories") ||
      question.includes("lower calories")
    ) {
      setCoachAnswer(
        `Your 7-day average calorie intake is ${avgCalories.toFixed(
          0
        )} calories. Your current pace is ${currentPace.toFixed(
          1
        )} lbs/week. If progress is too slow, improve calorie consistency first before making an aggressive cut.`
      );
      return;
    }

    if (question.includes("protein")) {
      setCoachAnswer(
        `Your 7-day average protein intake is ${avgProtein.toFixed(0)}g. ${
          avgProtein >= 130
            ? "This is strong for preserving muscle during a cut."
            : "This may be low for preserving muscle. Try to get closer to 130-150g per day."
        }`
      );
      return;
    }

    if (
      question.includes("steps") ||
      question.includes("walk") ||
      question.includes("walking")
    ) {
      setCoachAnswer(
        `Your 7-day average steps are ${avgSteps.toFixed(0)}. ${
          avgSteps >= 10000
            ? "Your activity level is solid. Keep steps consistent rather than forcing extreme days."
            : "Your steps could be higher. Increasing steps is often better than cutting calories harder."
        }`
      );
      return;
    }

    if (
      question.includes("strength") ||
      question.includes("workout") ||
      question.includes("lifting") ||
      question.includes("exercise")
    ) {
      setCoachAnswer(
        `Your strength status is: ${strengthStatus}. ${strengthInsight} Rest days are ignored in your strength analytics, so only actual workout logs affect this score.`
      );
      return;
    }

    if (question.includes("weekly") || question.includes("review")) {
      setCoachAnswer(
        `${weeklyAIReview.summary} Main action: ${weeklyAIReview.mainAction}`
      );
      return;
    }

    setCoachAnswer(
      `Based on your current data: your forecast weight is ${effectiveWeight.toFixed(
        1
      )} lbs, your current pace is ${currentPace.toFixed(
        1
      )} lbs/week, your plateau status is ${plateauStatus}, your goal feasibility is ${
        goalFeasibility.verdict
      }, and your strength status is ${strengthStatus}. ${recommendation}`
    );
  }
async function askFitCheckAILLM() {
  if (!coachQuestion.trim()) {
    setCoachAnswer("Ask a question first so FitCheck AI can analyze your data.");
    return;
  }

  setIsCoachLoading(true);
  setCoachAnswer("FitCheck AI is analyzing your data...");

  const context = {
    goal,
    latestWeight,
    effectiveWeight,
    maintenanceEstimate,
    movingAverage,
    fourteenDayAverage,
    goalWeight,
    goalDate,
    poundsToGoal,
    poundsRemaining,
    GoalProgressBar,
    currentPace,
    requiredWeeklyLoss,
    projectedGoalDateText,
    goalStatus,
    plateauStatus,
    plateauDifference,
    plateauRecommendation,
    avgCalories,
    avgProtein,
    avgSteps,
    strengthStatus,
    strengthInsight,
    latestWorkoutVolume,
    previousWorkoutVolume,
    volumeChange,
    weeklyAIReview,
    goalFeasibility,
    recommendation,
    logsCount: logs.length,
  };

  try {
    const response = await fetch("/api/fitcheck-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: coachQuestion,
        context,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to get AI response.");
    }

    const aiAnswer = data.answer || "No AI response was generated.";

setCoachAnswer(aiAnswer);
saveAIConversation("Ask AI", coachQuestion, aiAnswer);
  } catch (error) {
  console.error(error);

  const message =
    error instanceof Error ? error.message : "Unknown AI error.";

  setCoachAnswer(
    `AI request failed: ${message}. This means the LLM response did not run.`
  );
} finally {
  setIsCoachLoading(false);
}
}
async function generateAIWeeklyReport() {
  if (logs.length < 7) {
    setAiWeeklyReport(
      "You need at least 7 saved logs before FitCheck AI can generate a weekly AI report."
    );
    return;
  }

  setIsWeeklyReportLoading(true);
  setAiWeeklyReport(
    "FitCheck AI is generating your weekly report..."
  );

  const weeklyContext = {
    goal,
    latestWeight,
    effectiveWeight,
    movingAverage,
    fourteenDayAverage,
    maintenanceEstimate,
    goalWeight,
    goalDate,
    poundsRemaining,
    currentPace,
    requiredWeeklyLoss,
    goalStatus,
    plateauStatus,
    avgCalories,
    avgProtein,
    avgSteps,
    strengthStatus,
    strengthInsight,
    recommendation,
    logsCount: logs.length,
  };

  try {
    const response = await fetch("/api/fitcheck-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question:
          "Generate a complete weekly fitness coaching report including wins, problems, biggest risk, next week's priority, and goal outlook.",
        context: weeklyContext,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Failed to generate weekly AI report."
      );
    }

    const reportAnswer = data.answer || "No weekly AI report was generated.";

setAiWeeklyReport(reportAnswer);
saveAIConversation(
  "Weekly Report",
  "Generate weekly AI coaching report",
  reportAnswer
);
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown error.";

    setAiWeeklyReport(
      `AI weekly report failed: ${message}`
    );
  } finally {
    setIsWeeklyReportLoading(false);
  }
}
async function generateGoalStrategy() {
  if (logs.length < 7) {
    setGoalStrategy(
      "You need at least 7 saved logs before FitCheck AI can generate a reliable goal strategy."
    );
    return;
  }
  setIsGoalStrategyLoading(true);
  setGoalStrategy("FitCheck AI is generating your goal strategy...");

  const strategyContext = {
    goal,
    latestWeight,
    effectiveWeight,
    movingAverage,
    fourteenDayAverage,
    goalWeight,
    goalDate,
    poundsToGoal,
    poundsRemaining,
    currentPace,
    requiredWeeklyLoss,
    projectedGoalDateText,
    goalStatus,
    plateauStatus,
    avgCalories,
    avgProtein,
    avgSteps,
    strengthStatus,
    strengthInsight,
    maintenanceEstimate,
    goalFeasibility,
    weeklyAIReview,
    recommendation,
    logsCount: logs.length,
  };

  try {
    const response = await fetch("/api/fitcheck-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question:
          "Create a personalized goal strategy. Include target calories, protein target, step target, training focus, recovery focus, realistic weekly loss, and whether the goal timeline should stay the same or be adjusted.",
        context: strategyContext,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate goal strategy.");
    }

    const strategyAnswer = data.answer || "No goal strategy was generated.";

    setGoalStrategy(strategyAnswer);
    saveAIConversation(
      "Ask AI",
      "Generate personalized goal strategy",
      strategyAnswer
    );
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error ? error.message : "Unknown goal strategy error.";

    setGoalStrategy(`AI goal strategy failed: ${message}`);
  } finally {
    setIsGoalStrategyLoading(false);
  }
}
async function runFitCheckAgent() {
  if (logs.length < 7) {
    setAgentReport(
      "You need at least 7 saved logs before FitCheck Agent can analyze your data."
    );
    return;
  }

  setIsAgentLoading(true);
  setAgentReport("FitCheck Agent is reviewing your progress...");

  const agentContext = {
    goal,
    latestWeight,
    movingAverage,
    fourteenDayAverage,
    goalWeight,
    goalDate,
    poundsRemaining,
    currentPace,
    requiredWeeklyLoss,
    goalStatus,
    plateauStatus,
    avgCalories,
    avgProtein,
    avgSteps,
    strengthStatus,
    strengthInsight,
    maintenanceEstimate,
    goalFeasibility,
    agentDecision,
    dataFreshness,
    planAdherence,
    logsCount: logs.length,
  };

  try {
    const response = await fetch("/api/fitcheck-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question:
  "Act as FitCheck Agent, an autonomous fitness coaching agent. Analyze the user's logs, moving average weight trend, calories, protein, steps, strength performance, goal timeline, plateau risk, maintenance estimate, dataFreshness, planAdherence, and the rule-based agentDecision context. Treat agentDecision as the baseline decision engine output. If dataFreshness is aging or stale, explicitly reduce confidence and recommend fresh logging before aggressive changes. Use planAdherence to identify the user's biggest execution blocker before changing calories. If you disagree with the decision engine, explain why using the user's metrics. Return a structured plan with: Overall Status, Biggest Risk, Evidence, Decision Engine Action, Calorie Target, Protein Target, Step Target, Training Focus, Next 7-Day Action Plan, and Confidence Level. Be specific and practical.",
        context: agentContext,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to run FitCheck Agent.");
    }

    const answer = data.answer || "No agent report was generated.";

    setAgentReport(answer);
    saveAgentCheck(answer);
    saveAIConversation("Ask AI", "Run FitCheck Agent", answer);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown agent error.";

    setAgentReport(`FitCheck Agent failed: ${message}`);
  } finally {
    setIsAgentLoading(false);
  }
}
const groupedLogs = useMemo(() => {
  const groups: Record<string, LogEntry[]> = {};

  [...sortedLogs].reverse().forEach((log) => {
    const date = new Date(`${log.date}T00:00:00`);
    const monthYear = date.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });

    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }

    groups[monthYear].push(log);
  });

  return Object.entries(groups).map(([monthYear, monthLogs]) => ({
    monthYear,
    logs: monthLogs,
  }));
}, [sortedLogs]);

function toggleLogMonth(monthYear: string) {
  setExpandedLogMonths((current) =>
    current.includes(monthYear)
      ? current.filter((item) => item !== monthYear)
      : [...current, monthYear]
  );
}
  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Fitness Analytics Agent
          </p>

          <h1 className="mt-1 text-4xl font-bold">FitCheck AI</h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            Track weight, calories, protein, steps, workouts, exercises, moving
            averages, goal pace, charts, strength analytics, plateau detection,
            and AI-style coaching recommendations.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
<section className="space-y-6">
<DailyLogCard
  goal={goal}
  setGoal={setGoal}
  entry={entry}
  setEntry={setEntry}
  exercise={exercise}
  setExercise={setExercise}
  goalWeight={goalWeight}
  setGoalWeight={setGoalWeight}
  goalDate={goalDate}
  setGoalDate={setGoalDate}
  editingId={editingId}
  addExercise={addExercise}
  deleteExercise={deleteExercise}
  saveLog={saveLog}
  resetEntry={resetEntry}
  clearAllLogs={clearAllLogs}
/>

<DemoModeCard loadDemoData={loadDemoData} />
</section>


          <section className="space-y-6 lg:col-span-2">
<AgentDashboardCard
  agentDecision={agentDecision}
  latestAgentCheck={latestAgentCheck}
  previousAgentCheck={previousAgentCheck}
/>

<DataFreshnessCard dataFreshness={dataFreshness} />

<GoalAdaptationCard
  goalAdaptation={goalAdaptation}
  applyGoalDate={applyGoalDateSuggestion}
  applyCalories={applyCalorieSuggestion}
/>

<div className="grid gap-6 xl:grid-cols-2">
  <WeeklyPlanCard weeklyPlan={weeklyPlan} />
  <NutritionTargetsCard nutritionTargets={nutritionTargets} />
</div>

<PlanAdherenceCard planAdherence={planAdherence} />

<RecoveryRiskCard recoveryRisk={recoveryRisk} />

<FitCheckAgentCard
  agentReport={agentReport}
  isAgentLoading={isAgentLoading}
  runFitCheckAgent={runFitCheckAgent}
  agentDecision={agentDecision}
/>

<AgentHistoryCard
  agentHistory={agentHistory}
  expandedAgentCheckId={expandedAgentCheckId}
  setExpandedAgentCheckId={setExpandedAgentCheckId}
  clearAgentHistory={clearAgentHistory}
/>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Dashboard</h2>

              <p className="mt-2 text-sm text-slate-500">
                Cleaned-up dashboard with the most useful progress,
                goal, plateau, and strength signals.
              </p>

              <div className="mt-5">
                <GoalProgressBar
                  progress={goalProgressPercent}
                  startWeight={startWeight}
                  currentWeight={effectiveWeight}
                  goalWeight={goalWeight}
                />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <Stat
                  label="Latest Weight"
                  value={`${latestWeight.toFixed(1)} lbs`}
                />
                <Stat
                  label="Goal Weight"
                  value={`${goalWeight.toFixed(1)} lbs`}
                />
                <Stat
                  label="Pounds to Goal"
                  value={`${poundsRemaining.toFixed(1)} lbs`}
                />
                <Stat
  label="7-Day Moving Average"
  value={
    logs.length >= 7
      ? `${movingAverage.toFixed(1)} lbs`
      : "Need 7 logs"
  }
/>
                <Stat
                  label="Required Weekly Loss"
                  value={`${requiredWeeklyLoss.toFixed(1)} lbs/week`}
                />
                <Stat label="Goal Status" value={goalStatus} />
                <Stat label="Plateau Status" value={plateauStatus} />
                <Stat
                  label="Feasibility Score"
                  value={`${goalFeasibility.score}/100`}
                />
                <Stat label="Weekly Trend" value={weeklyAIReview.trend} />
                <Stat label="Strength Status" value={strengthStatus} />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <StatusBadge label="Goal" value={goalStatus} />
                <StatusBadge label="Plateau" value={plateauStatus} />
                <StatusBadge label="Feasibility" value={goalFeasibility.verdict} />
                <StatusBadge label="Strength" value={strengthStatus} />
              </div></section>

<div className="grid gap-6 xl:grid-cols-2">
  <section className="rounded-3xl bg-white p-6 shadow-sm">
    <h2 className="text-2xl font-semibold">Weight Trend</h2>

    <p className="mt-2 text-sm text-slate-500">
      Daily scale weight with a smoothed 7-day moving average.
    </p>

    {chartData.length === 0 ? (
      <p className="mt-4 text-slate-500">No logs yet. Add your first log.</p>
    ) : (
      <div className="mt-5 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" interval="preserveStartEnd" />
            <YAxis domain={["dataMin - 2", "dataMax + 2"]} />
            <Tooltip />
            <Line
  type="monotone"
  dataKey="weight"
  name="Daily Weight"
  strokeWidth={1}
  dot={false}
  activeDot={{ r: 4 }}
/>

<Line
  type="monotone"
  dataKey="movingAverage"
  name="7-Day Moving Average"
  strokeWidth={4}
  dot={false}
/>

            
          </LineChart>
        </ResponsiveContainer>
      </div>
    )}
  </section>

  <section className="rounded-3xl bg-white p-6 shadow-sm">
    <h2 className="text-2xl font-semibold">Steps Trend</h2>

    <p className="mt-2 text-sm text-slate-500">
      Daily step count across your saved logs.
    </p>

    {chartData.length === 0 ? (
      <p className="mt-4 text-slate-500">No logs yet. Add your first log.</p>
    ) : (
      <div className="mt-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis
              domain={[0, "auto"]}
              tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
            />
            <Tooltip
              formatter={(value) => [
                `${Number(value).toLocaleString()} steps`,
                "Daily Steps",
              ]}
            />

            <Line
              type="monotone"
              dataKey="steps"
              name="Daily Steps"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )}
  </section>
</div>
<section className="rounded-3xl bg-white p-6 shadow-sm">
  <h2 className="text-2xl font-semibold">
    Maintenance Calorie Estimator
  </h2>

  <p className="mt-2 text-sm text-slate-500">
  Estimates maintenance using your recent calorie intake and the change between
  your previous and current 7-day moving average weight.
</p>

  <div className="mt-5 grid gap-4 md:grid-cols-2">
    <Stat
      label="Estimated Maintenance"
      value={
        maintenanceEstimate.estimatedMaintenance > 0
          ? `${maintenanceEstimate.estimatedMaintenance.toFixed(0)} cal/day`
          : "Need more data"
      }
    />

    <Stat
      label="Calories for ~1 lb/week loss"
      value={
        maintenanceEstimate.fatLossCaloriesOnePound > 0
          ? `${maintenanceEstimate.fatLossCaloriesOnePound.toFixed(0)} cal/day`
          : "Need more data"
      }
    />

    <Stat
      label="Calories for ~1.5 lb/week loss"
      value={
        maintenanceEstimate.fatLossCaloriesOnePointFivePounds > 0
          ? `${maintenanceEstimate.fatLossCaloriesOnePointFivePounds.toFixed(
              0
            )} cal/day`
          : "Need more data"
      }
    />

    <Stat
      label="Calories for ~2 lb/week loss"
      value={
        maintenanceEstimate.fatLossCaloriesTwoPounds > 0
          ? `${maintenanceEstimate.fatLossCaloriesTwoPounds.toFixed(0)} cal/day`
          : "Need more data"
      }
    />
  </div>

  <div className="mt-5 rounded-2xl bg-slate-100 p-4">
    <p className="font-semibold">
      Confidence: {maintenanceEstimate.confidence}
    </p>

    <p className="mt-2">
      {maintenanceEstimate.explanation}
    </p>
  </div>
</section>
<GoalStrategyCard
  goalStrategy={goalStrategy}
  isGoalStrategyLoading={isGoalStrategyLoading}
  generateGoalStrategy={generateGoalStrategy}
/>

<AskAICard
  coachQuestion={coachQuestion}
  setCoachQuestion={setCoachQuestion}
  coachAnswer={coachAnswer}
  isCoachLoading={isCoachLoading}
  askFitCheckAILLM={askFitCheckAILLM}
/>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Strength Analytics</h2>

              <div className="mt-4 space-y-3 text-slate-700">
                <p>
                  Latest workout volume:{" "}
                  <strong>{latestWorkoutVolume.toFixed(0)}</strong>
                </p>

                <p>
                  Previous workout volume:{" "}
                  <strong>{previousWorkoutVolume.toFixed(0)}</strong>
                </p>

                <p>
                  Volume change: <strong>{volumeChange.toFixed(1)}%</strong>
                </p>

                <p>
                  Strength status: <strong>{strengthStatus}</strong>
                </p>

                <p>{strengthInsight}</p>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Plateau Detection Agent</h2>

              <div className="mt-4 space-y-3 text-slate-700">
                <p>
                  7-day average:{" "}
                  <strong>{movingAverage.toFixed(1)} lbs</strong>
                </p>

                <p>
                  14-day average:{" "}
                  <strong>{fourteenDayAverage.toFixed(1)} lbs</strong>
                </p>

                <p>
                  Difference:{" "}
                  <strong>{plateauDifference.toFixed(1)} lbs</strong>
                </p>

                <p>
                  Status: <strong>{plateauStatus}</strong>
                </p>

                <p>{plateauRecommendation}</p>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Goal Feasibility Agent</h2>

              <p className="mt-2 text-sm text-slate-500">
                Evaluates whether your goal is realistic using your
                7-day average weight, average-based pace, required pace, and
                deadline.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Stat
                  label="Feasibility Score"
                  value={`${goalFeasibility.score}/100`}
                />
                <Stat label="Verdict" value={goalFeasibility.verdict} />
                <Stat
                  label="Current Average Weight"
                  value={`${goalFeasibility.currentWeight.toFixed(1)} lbs`}
                />
                <Stat
                  label="Goal Weight"
                  value={`${goalFeasibility.goalWeight.toFixed(1)} lbs`}
                />
                <Stat
                  label="Pounds Remaining"
                  value={`${goalFeasibility.poundsRemaining.toFixed(1)} lbs`}
                />
                <Stat
                  label="Days Remaining"
                  value={`${goalFeasibility.daysRemaining} days`}
                />
                <Stat
                  label="Current Loss Rate"
                  value={`${goalFeasibility.currentLossRate.toFixed(
                    1
                  )} lbs/week`}
                />
                <Stat
                  label="Required Loss Rate"
                  value={`${goalFeasibility.requiredLossRate.toFixed(
                    1
                  )} lbs/week`}
                />
              </div>

              <div className="mt-5 rounded-2xl bg-slate-100 p-4 text-slate-700">
                <p className="font-semibold">Recommendation</p>
                <p className="mt-2">{goalFeasibility.recommendation}</p>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Weekly AI Review</h2>

              <p className="mt-2 text-sm text-slate-500">
                Summarizes your week and gives one focused action for
                next week. Improves the wording and uses average-based
                pace.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Stat label="Weekly Trend" value={weeklyAIReview.trend} />
                <Stat label="Goal Status" value={goalStatus} />
                <Stat
                  label="Weekly Weight Change"
                  value={`${weeklyWeightChange.toFixed(1)} lbs`}
                />
                <Stat
                  label="Average-Based Pace"
                  value={`${currentPace.toFixed(1)} lbs/week`}
                />
                <Stat label="Average Calories" value={avgCalories.toFixed(0)} />
                <Stat
                  label="Average Protein"
                  value={`${avgProtein.toFixed(0)}g`}
                />
                <Stat label="Average Steps" value={avgSteps.toFixed(0)} />
              </div>

              <div className="mt-5 rounded-2xl bg-slate-100 p-4 text-slate-700">
                <p className="font-semibold">Weekly Summary</p>
                <p className="mt-2">{weeklyAIReview.summary}</p>
              </div>

              <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-slate-700">
                <p className="font-semibold">Main Action for Next Week</p>
                <p className="mt-2">{weeklyAIReview.mainAction}</p>
              </div>
            </section>


            <AIWeeklyReportCard
  aiWeeklyReport={aiWeeklyReport}
  isWeeklyReportLoading={isWeeklyReportLoading}
  generateAIWeeklyReport={generateAIWeeklyReport}
/>

            <section className="rounded-3xl bg-emerald-50 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Coach Recommendation</h2>
              <p className="mt-3 text-slate-700">{recommendation}</p>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <section className="rounded-3xl bg-white p-6 shadow-sm">
  <h2 className="text-2xl font-semibold">Recent Logs</h2>

  <div className="mt-5 space-y-4">
    {groupedLogs.length === 0 ? (
      <p className="text-slate-500">No logs yet.</p>
    ) : (
      groupedLogs.map((group) => {
        const isExpanded = expandedLogMonths.includes(group.monthYear);

        return (
          <div key={group.monthYear} className="rounded-2xl bg-slate-100 p-4">
            <button
              onClick={() => toggleLogMonth(group.monthYear)}
              className="flex w-full items-center justify-between text-left"
            >
              <div>
                <p className="text-lg font-semibold">{group.monthYear}</p>
                <p className="text-sm text-slate-500">
                  {group.logs.length} log{group.logs.length === 1 ? "" : "s"}
                </p>
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold">
                {isExpanded ? "Hide" : "View"}
              </span>
            </button>

            {isExpanded && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="p-2">Date</th>
                      <th className="p-2">Weight</th>
                      <th className="p-2">Calories</th>
                      <th className="p-2">Protein</th>
                      <th className="p-2">Steps</th>
                      <th className="p-2">Workout</th>
                      <th className="p-2">Exercises</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {group.logs.map((log) => (
                      <tr key={log.id} className="border-b align-top">
                        <td className="p-2">{log.date}</td>
                        <td className="p-2">{log.weight}</td>
                        <td className="p-2">{log.calories}</td>
                        <td className="p-2">{log.protein}g</td>
                        <td className="p-2">{log.steps}</td>
                        <td className="p-2">{log.workout || "—"}</td>
                        <td className="p-2">
                          {log.exercises.length === 0 ? (
                            "—"
                          ) : (
                            <ul className="space-y-1">
                              {log.exercises.map((item) => (
                                <li key={item.id}>
                                  {item.name}: {item.sets}x{item.reps} @{" "}
                                  {item.weight} lbs
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td className="flex gap-2 p-2">
                          <button
                            onClick={() => editLog(log)}
                            className="rounded-lg bg-slate-200 px-3 py-1"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => deleteLog(log.id)}
                            className="rounded-lg bg-red-100 px-3 py-1 text-red-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })
    )}
  </div>
</section>
            </section>
          </section>
        </section>
      </div>
    </main>
  );
}

function getRecommendation({
  goal,
  logsCount,
  avgProtein,
  avgSteps,
  avgCalories,
  weeklyWeightChange,
  requiredWeeklyLoss,
  poundsToGoal,
  totalExercises,
  strengthStatus,
  plateauStatus,
}: {
  goal: Goal;
  logsCount: number;
  avgProtein: number;
  avgSteps: number;
  avgCalories: number;
  weeklyWeightChange: number;
  requiredWeeklyLoss: number;
  poundsToGoal: number;
  totalExercises: number;
  strengthStatus: string;
  plateauStatus: string;
}) {
  if (logsCount === 0) {
    return "Add your first daily log to start generating personalized recommendations.";
  }

  if (goal === "Cutting") {
    if (poundsToGoal <= 0) {
      return "Goal reached. Consider moving into maintenance before deciding whether to lean bulk.";
    }

    if (avgProtein < 130) {
      return "Protein is below target. Increase protein to better preserve muscle while cutting.";
    }

    if (avgSteps < 10000) {
      return "Steps are below target. Increasing daily movement may help fat loss without lowering calories further.";
    }

    if (totalExercises === 0) {
      return "Start logging exercises so the coach can evaluate whether you are maintaining strength during your cut.";
    }

    if (strengthStatus === "Strength/performance dropping") {
      return "Strength is dropping while cutting. Consider improving recovery, slightly increasing calories, or reducing training fatigue.";
    }

    if (plateauStatus === "Potential plateau detected") {
      return "Potential plateau detected. Before reducing calories further, verify consistency with calories, steps, protein, sleep, and weigh-ins.";
    }

    if (requiredWeeklyLoss > 2.25) {
      return "Your goal pace is very aggressive. Avoid crash dieting or rebound cycles.";
    }

    if (weeklyWeightChange < -2) {
      return "Weight is dropping quickly. Monitor strength, fatigue, and recovery.";
    }

    if (weeklyWeightChange >= -2 && weeklyWeightChange <= -0.5) {
      return "Strong cutting trend. Your weight, protein, activity, and workout logs support steady fat loss.";
    }

    if (avgCalories > 2200) {
      return "Calories are relatively high for cutting. If weight stalls, tighten calorie consistency first.";
    }

    return "Progress looks slow or flat. Focus on the 7-day average, consistency, and workout performance.";
  }

  if (goal === "Bulking") {
    if (weeklyWeightChange > 1) {
      return "You are gaining quickly. Reduce calories slightly to keep the bulk leaner.";
    }

    if (strengthStatus === "Strength/performance improving") {
      return "Good lean bulk signal: strength is improving while bodyweight is moving up.";
    }

    if (weeklyWeightChange >= 0.25 && weeklyWeightChange <= 0.75) {
      return "Controlled lean bulk pace. Keep training hard and gaining slowly.";
    }

    return "Bulk pace may be too slow. If strength and weight are not increasing, consider a small calorie increase.";
  }

  if (Math.abs(weeklyWeightChange) <= 0.5) {
    return "Maintenance looks stable. Keep calories consistent and focus on performance.";
  }

  return "Maintenance is drifting. Adjust calories slightly if weight is moving more than expected.";
}
