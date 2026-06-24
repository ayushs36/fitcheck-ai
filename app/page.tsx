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
} from "@/types/fitness";
import {
  calculateExerciseVolume,
  addDays,
  formatDate,
} from "@/lib/calculations";

import { Stat } from "@/components/Stat";

import { StatusBadge } from "@/components/StatusBadge";

import { GoalProgressBar } from "@/components/GoalProgressBar";

import { Input, NumberInput, Select } from "@/components/FormInputs";

import { AskAICard } from "@/components/AskAICard";

import { AIWeeklyReportCard } from "@/components/AIWeeklyReportCard";

import { GoalStrategyCard } from "@/components/GoalStrategyCard";

const STORAGE_KEY = "fitcheck-logs-v1";
const SETTINGS_KEY = "fitcheck-settings-v1";
const AI_HISTORY_KEY = "fitcheck-ai-history-v1";

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
  const [expandedConversationId, setExpandedConversationId] =
  useState<string | null>(null);

const [historySearch, setHistorySearch] = useState(""); 
  const [goalStrategy, setGoalStrategy] = useState(
  "Generate an AI goal strategy to get a personalized plan for reaching your target."
);
const [isGoalStrategyLoading, setIsGoalStrategyLoading] = useState(false); 
const [naturalLogText, setNaturalLogText] = useState("");

const [naturalLogFeedback, setNaturalLogFeedback] = useState(
  "Type your day in plain English and FitCheck AI will fill the log form."
);

const [isNaturalLogLoading, setIsNaturalLogLoading] = useState(false);
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

  const sevenDayAverage =
    last7Logs.length > 0 ? average(last7Logs.map((log) => log.weight)) : 0;

  const fourteenDayAverage =
    last14Logs.length > 0 ? average(last14Logs.map((log) => log.weight)) : 0;

  const avgCalories = average(last7Logs.map((log) => log.calories));
  const avgProtein = average(last7Logs.map((log) => log.protein));
  const avgSteps = average(last7Logs.map((log) => log.steps));

  const plateauDifference = Math.abs(sevenDayAverage - fourteenDayAverage);

  let plateauStatus = "Need more data";

  if (logs.length >= 14) {
    if (plateauDifference <= 0.3) {
      plateauStatus = "Potential plateau detected";
    } else if (sevenDayAverage < fourteenDayAverage) {
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
    sevenDayAverage > 0 ? sevenDayAverage : latestWeight;

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

  const currentPace = useMemo(() => {
  const validWeightLogs = sortedLogs.filter((log) => log.weight > 0);

  if (validWeightLogs.length < 7) {
    return 0;
  }

  const recentLogs = validWeightLogs.slice(-7);

  const firstWeight = recentLogs[0].weight;
  const lastWeight = recentLogs[recentLogs.length - 1].weight;

  const weeklyChange = lastWeight - firstWeight;

  return weeklyChange < 0 ? Math.abs(weeklyChange) : 0;
}, [sortedLogs]);
      const maintenanceEstimate: MaintenanceEstimate = useMemo(() => {
  if (logs.length < 7 || avgCalories <= 0 || currentPace <= 0) {
    return {
      estimatedMaintenance: 0,
      fatLossCaloriesOnePound: 0,
      fatLossCaloriesOnePointFivePounds: 0,
      fatLossCaloriesTwoPounds: 0,
      confidence: "Low",
      explanation:
        "Log at least 7 days with calories and a recent weekly weight change to estimate maintenance calories.",
    };
  }

  const dailyDeficit = currentPace * 500;
  const estimatedMaintenance = avgCalories + dailyDeficit;

  let confidence: MaintenanceEstimate["confidence"] = "Medium";

  if (logs.length >= 21) {
    confidence = "High";
  } else if (logs.length < 14) {
    confidence = "Low";
  }

  return {
    estimatedMaintenance,
    fatLossCaloriesOnePound: estimatedMaintenance - 500,
    fatLossCaloriesOnePointFivePounds: estimatedMaintenance - 750,
    fatLossCaloriesTwoPounds: estimatedMaintenance - 1000,
    confidence,
    explanation: `Based on your ${avgCalories.toFixed(
      0
    )} calorie average and ${currentPace.toFixed(
      1
    )} lb/week recent pace, your estimated maintenance is about ${estimatedMaintenance.toFixed(
      0
    )} calories/day.`,
  };
}, [logs.length, avgCalories, currentPace]);

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

  const chartData = sortedLogs.map((log) => ({
    date: log.date.slice(5),
    weight: log.weight,
    calories: log.calories,
    protein: log.protein,
    steps: log.steps,
  }));

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
7-Day Average Weight: ${sevenDayAverage.toFixed(1)} lbs
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

function clearAIHistory() {
  setAiHistory([]);
}
const filteredAIHistory = aiHistory.filter((item) => {
  const search = historySearch.toLowerCase();

  return (
    item.question.toLowerCase().includes(search) ||
    item.answer.toLowerCase().includes(search) ||
    item.type.toLowerCase().includes(search)
  );
});
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
        `Your plateau status is: ${plateauStatus}. Your 7-day average is ${sevenDayAverage.toFixed(
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
    sevenDayAverage,
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
    sevenDayAverage,
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
    sevenDayAverage,
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
async function parseNaturalLogWithAI() {
  if (!naturalLogText.trim()) {
    setNaturalLogFeedback("Type a log first.");
    return;
  }

  setIsNaturalLogLoading(true);
  setNaturalLogFeedback("FitCheck AI is reading your log...");

  try {
    const response = await fetch("/api/parse-log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: naturalLogText,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to parse natural language log.");
    }

    setEntry((current) => ({
      ...current,
      weight:
        typeof data.weight === "number" && Number.isFinite(data.weight)
          ? data.weight
          : current.weight,
      calories:
        typeof data.calories === "number" && Number.isFinite(data.calories)
          ? data.calories
          : current.calories,
      protein:
        typeof data.protein === "number" && Number.isFinite(data.protein)
          ? data.protein
          : current.protein,
      steps:
        typeof data.steps === "number" && Number.isFinite(data.steps)
          ? data.steps
          : current.steps,
      workout:
        typeof data.workout === "string" && data.workout.trim()
          ? data.workout
          : current.workout,
    }));

    setNaturalLogFeedback(
      "Log form updated. Review the fields, then click Save Log."
    );
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error ? error.message : "Unknown natural log error.";

    setNaturalLogFeedback(`AI log parsing failed: ${message}`);
  } finally {
    setIsNaturalLogLoading(false);
  }
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
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Daily Log</h2>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
  <h3 className="text-lg font-semibold">AI Natural Language Logging</h3>

  <p className="mt-2 text-sm text-slate-500">
    Day 22: Type your daily log in plain English and FitCheck AI will fill the
    form using OpenAI.
  </p>

  <textarea
    className="mt-4 min-h-24 w-full rounded-2xl border border-slate-200 p-3"
    value={naturalLogText}
    onChange={(event) => setNaturalLogText(event.target.value)}
    placeholder="Example: Today I weighed 139.2 lbs, ate 2100 calories, got 145g protein, walked 13k steps, and did Push Day."
  />

  <button
    onClick={parseNaturalLogWithAI}
    disabled={isNaturalLogLoading}
    className="mt-3 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50"
  >
    {isNaturalLogLoading ? "Reading..." : "Fill Log With AI"}
  </button>

  <p className="mt-3 text-sm text-slate-600">{naturalLogFeedback}</p>
</div>

            <div className="mt-5 space-y-4">
              <Select
                label="Goal"
                value={goal}
                onChange={(value) => setGoal(value as Goal)}
                options={["Cutting", "Bulking", "Maintaining"]}
              />

              <Input
                label="Date"
                type="date"
                value={entry.date}
                onChange={(value) => setEntry({ ...entry, date: value })}
              />

              <NumberInput
                label="Daily Scale Weight"
                value={entry.weight}
                onChange={(value) => setEntry({ ...entry, weight: value })}
                suffix="lbs"
              />

              <NumberInput
                label="Goal Weight"
                value={goalWeight}
                onChange={setGoalWeight}
                suffix="lbs"
              />

              <Input
                label="Goal Date"
                type="date"
                value={goalDate}
                onChange={setGoalDate}
              />

              <NumberInput
                label="Calories"
                value={entry.calories}
                onChange={(value) => setEntry({ ...entry, calories: value })}
                suffix="cal"
              />

              <NumberInput
                label="Protein"
                value={entry.protein}
                onChange={(value) => setEntry({ ...entry, protein: value })}
                suffix="g"
              />

              <NumberInput
                label="Steps"
                value={entry.steps}
                onChange={(value) => setEntry({ ...entry, steps: value })}
                suffix="steps"
              />

              <Input
                label="Workout"
                type="text"
                value={entry.workout}
                onChange={(value) => setEntry({ ...entry, workout: value })}
                placeholder="Push, Pull, Legs, Rest..."
              />

              <div className="rounded-2xl bg-slate-50 p-4">
                <h3 className="font-semibold">Add Exercise</h3>

                <div className="mt-3 space-y-3">
                  <Input
                    label="Exercise Name"
                    type="text"
                    value={exercise.name}
                    onChange={(value) =>
                      setExercise({ ...exercise, name: value })
                    }
                    placeholder="Bench Press"
                  />

                  <NumberInput
                    label="Sets"
                    value={exercise.sets}
                    onChange={(value) =>
                      setExercise({ ...exercise, sets: value })
                    }
                  />

                  <NumberInput
                    label="Reps"
                    value={exercise.reps}
                    onChange={(value) =>
                      setExercise({ ...exercise, reps: value })
                    }
                  />

                  <NumberInput
                    label="Weight Used"
                    value={exercise.weight}
                    onChange={(value) =>
                      setExercise({ ...exercise, weight: value })
                    }
                    suffix="lbs"
                  />

                  <button
                    onClick={addExercise}
                    className="w-full rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white"
                  >
                    Add Exercise
                  </button>
                </div>

                <div className="mt-4">
                  <p className="font-semibold">Exercises in This Log</p>

                  {entry.exercises.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">
                      No exercises added yet.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2 text-sm">
                      {entry.exercises.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between rounded-xl bg-white p-3"
                        >
                          <span>
                            {item.name} — {item.sets} x {item.reps} @{" "}
                            {item.weight} lbs
                          </span>

                          <button
                            onClick={() => deleteExercise(item.id)}
                            className="text-red-600"
                          >
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <button
                onClick={saveLog}
                className="w-full rounded-2xl bg-black px-4 py-3 font-semibold text-white"
              >
                {editingId ? "Update Log" : "Add Daily Log"}
              </button>

              {editingId && (
                <button
                  onClick={resetEntry}
                  className="w-full rounded-2xl bg-slate-200 px-4 py-3 font-semibold"
                >
                  Cancel Edit
                </button>
              )}

              <button
                onClick={clearAllLogs}
                className="w-full rounded-2xl bg-red-100 px-4 py-3 font-semibold text-red-700"
              >
                Clear All Logs
              </button>
            </div>
          </section>

            


          <section className="space-y-6 lg:col-span-2">
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Dashboard</h2>

              <p className="mt-2 text-sm text-slate-500">
                Day 15: Cleaned-up dashboard with the most useful progress,
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
                  label="7-Day Average"
                  value={
                    logs.length ? `${sevenDayAverage.toFixed(1)} lbs` : "No logs"
                  }
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
                  label="Current Pace"
                  value={`${currentPace.toFixed(1)} lbs/week`}
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

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Weight Trend Chart</h2>

              {chartData.length === 0 ? (
                <p className="mt-4 text-slate-500">
                  No logs yet. Add your first log.
                </p>
              ) : (
                <div className="mt-5 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={["dataMin - 2", "dataMax + 2"]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        strokeWidth={3}
                        dot
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
            <section className="rounded-3xl bg-white p-6 shadow-sm">
  <h2 className="text-2xl font-semibold">
    AI Weekly Report Generator
  </h2>

  <p className="mt-2 text-sm text-slate-500">
    Generates a full AI-powered weekly coaching report
    using your fitness data.
  </p>

  <button
    onClick={generateAIWeeklyReport}
    disabled={isWeeklyReportLoading}
    className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50"
  >
    {isWeeklyReportLoading
      ? "Generating..."
      : "Generate AI Weekly Report"}
  </button>

  <div className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-100 p-4 text-slate-700">
    {aiWeeklyReport}
  </div>
</section>
<section className="rounded-3xl bg-white p-6 shadow-sm">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 className="text-2xl font-semibold">AI Coaching History</h2>
      <p className="mt-2 text-sm text-slate-500">
        Day 23: Click a saved conversation to view the full question and answer.
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {aiHistory.length} saved conversation{aiHistory.length === 1 ? "" : "s"}
      </p>
    </div>

    {aiHistory.length > 0 && (
      <button
        onClick={clearAIHistory}
        className="rounded-2xl bg-red-100 px-4 py-2 font-semibold text-red-700"
      >
        Clear History
      </button>
    )}
  </div>

  <input
    className="mt-5 w-full rounded-2xl border border-slate-200 p-3"
    value={historySearch}
    onChange={(event) => setHistorySearch(event.target.value)}
    placeholder="Search history by plateau, protein, goal, calories..."
  />

  <div className="mt-5 space-y-3">
    {filteredAIHistory.length === 0 ? (
      <p className="rounded-2xl bg-slate-100 p-4 text-slate-600">
        No matching AI conversations yet.
      </p>
    ) : (
      filteredAIHistory.map((item) => {
        const isExpanded = expandedConversationId === item.id;

        return (
          <div key={item.id} className="rounded-2xl bg-slate-100 p-4">
            <button
              onClick={() =>
                setExpandedConversationId(isExpanded ? null : item.id)
              }
              className="w-full text-left"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    {isExpanded ? "▼" : "▶"} {item.question}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.type} • {item.createdAt}
                  </p>
                </div>

                <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-600">
                  {isExpanded ? "Hide" : "View"}
                </span>
              </div>
            </button>

            {isExpanded && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="text-sm font-semibold text-slate-700">
                  Question
                </p>
                <p className="mt-1 text-slate-700">{item.question}</p>

                <p className="mt-4 text-sm font-semibold text-slate-700">
                  Answer
                </p>
                <p className="mt-1 whitespace-pre-wrap text-slate-700">
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        );
      })
    )}
  </div>
</section>
<section className="rounded-3xl bg-white p-6 shadow-sm">
  <h2 className="text-2xl font-semibold">
    Maintenance Calorie Estimator
  </h2>

  <p className="mt-2 text-sm text-slate-500">
    Estimates maintenance calories using your calorie intake and actual rate of weight loss.
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

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Steps Trend Chart</h2>

              {chartData.length === 0 ? (
                <p className="mt-4 text-slate-500">
                  No logs yet. Add your first log.
                </p>
              ) : (
                <div className="mt-5 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="steps"
                        strokeWidth={3}
                        dot
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">AI Coach Report</h2>

              <div className="mt-4 space-y-3 text-slate-700">
                <p>
                  You are currently <strong>{goal.toLowerCase()}</strong>. Your
                  latest weight is <strong>{latestWeight.toFixed(1)} lbs</strong>
                  {logs.length > 0 && (
                    <>
                      , and your 7-day average is{" "}
                      <strong>{sevenDayAverage.toFixed(1)} lbs</strong>
                    </>
                  )}
                  .
                </p>

                <p>
                  Your goal is <strong>{goalWeight.toFixed(1)} lbs</strong> by{" "}
                  <strong>{goalDate}</strong>. Based on your 7-day average, you
                  are currently{" "}
                  <strong>{poundsRemaining.toFixed(1)} lbs</strong> away from
                  your goal.
                </p>

                <p>
                  Your current pace is about{" "}
                  <strong>{currentPace.toFixed(1)} lbs/week</strong>. Projected
                  goal date: <strong>{projectedGoalDateText}</strong>.
                </p>

                <p>
                  Latest workout included{" "}
                  <strong>{latestWorkoutExercises.length}</strong> logged
                  exercises.
                </p>

                <p>
                  Goal status: <strong>{goalStatus}</strong>
                </p>

                <p>
                  Plateau status: <strong>{plateauStatus}</strong>
                </p>

                <p>
                  AI confidence score: <strong>{confidenceScore}%</strong>
                </p>
              </div>
            </section>

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
                  <strong>{sevenDayAverage.toFixed(1)} lbs</strong>
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
                Day 13: Evaluates whether your goal is realistic using your
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
                Day 14: Summarizes your week and gives one focused action for
                next week. Day 15 improves the wording and uses average-based
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


            <AskAICard
  coachQuestion={coachQuestion}
  setCoachQuestion={setCoachQuestion}
  coachAnswer={coachAnswer}
  isCoachLoading={isCoachLoading}
  askFitCheckAI={askFitCheckAI}
  askFitCheckAILLM={askFitCheckAILLM}
/>


            <AIWeeklyReportCard
  aiWeeklyReport={aiWeeklyReport}
  isWeeklyReportLoading={isWeeklyReportLoading}
  generateAIWeeklyReport={generateAIWeeklyReport}
/>

            <section className="rounded-3xl bg-emerald-50 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Coach Recommendation</h2>
              <p className="mt-3 text-slate-700">{recommendation}</p>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <section className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Agent Checks</h2>

                <ul className="mt-4 space-y-2 text-slate-700">
                  <li>
                    Data quality:{" "}
                    {enoughData ? "✅ Enough logs" : "⚠️ Add more logs"}
                  </li>
                  <li>
                    Protein target:{" "}
                    {proteinTargetMet ? "✅ Met" : "⚠️ Not met"}
                  </li>
                  <li>
                    Step target: {stepTargetMet ? "✅ Met" : "⚠️ Not met"}
                  </li>
                  <li>
                    Weight trend:{" "}
                    {weeklyWeightChange < 0
                      ? "✅ Moving down"
                      : "⚠️ Flat/increasing"}
                  </li>
                  <li>
                    Goal pace:{" "}
                    {requiredWeeklyLoss <= 2 ? "✅ Manageable" : "⚠️ Aggressive"}
                  </li>
                  <li>
                    Workout detail:{" "}
                    {totalExercises > 0
                      ? "✅ Exercises logged"
                      : "⚠️ Add exercises"}
                  </li>
                  <li>
  Strength analysis:{" "}
  {matchingExerciseComparisons.length > 0
    ? "✅ Available"
    : "⚠️ Need matching exercise history"}
</li>
                </ul>
              </section>

              <section className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Current Summary</h2>

                <p className="mt-4 text-slate-700">
                  You are currently <strong>{goal.toLowerCase()}</strong>. Your
                  latest weight is <strong>{latestWeight.toFixed(1)} lbs</strong>.
                  Your goal is <strong>{goalWeight.toFixed(1)} lbs</strong> by{" "}
                  <strong>{goalDate}</strong>. Day 15 now uses your 7-day
                  average for forecasting, average-based current pace, a cleaner
                  dashboard, status badges, and newest logs first.
                </p>
              </section>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Recent Logs</h2>

              <div className="mt-5 overflow-x-auto">
                {sortedLogs.length === 0 ? (
                  <p className="text-slate-500">No logs yet.</p>
                ) : (
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
                      {[...sortedLogs].reverse().map((log) => (
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
                )}
              </div>
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