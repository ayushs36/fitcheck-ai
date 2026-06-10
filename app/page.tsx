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

type Goal = "Cutting" | "Bulking" | "Maintaining";

type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
};

type LogEntry = {
  id: string;
  date: string;
  weight: number;
  calories: number;
  protein: number;
  steps: number;
  workout: string;
  exercises: Exercise[];
};

type GoalFeasibility = {
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

const STORAGE_KEY = "fitcheck-logs-v1";
const SETTINGS_KEY = "fitcheck-settings-v1";

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

  useEffect(() => {
    const savedLogs = localStorage.getItem(STORAGE_KEY);
    if (savedLogs) setLogs(JSON.parse(savedLogs));
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

  const poundsToGoal = latestWeight - goalWeight;

  const poundsRemaining = Math.max(0, poundsToGoal);

  const today = new Date();
  const targetDate = new Date(goalDate);

  const daysUntilGoal = Math.max(
    0,
    Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  const weeksUntilGoal = daysUntilGoal / 7;

  const requiredWeeklyLoss =
    weeksUntilGoal > 0 ? poundsToGoal / weeksUntilGoal : 0;

  const projectedWeeklyLoss =
    weeklyWeightChange < 0 ? Math.abs(weeklyWeightChange) : 0;

  const projectedGoalDate =
    projectedWeeklyLoss > 0 && poundsToGoal > 0
      ? addDays(today, (poundsToGoal / projectedWeeklyLoss) * 7)
      : null;

  const currentPace = weeklyWeightChange < 0 ? Math.abs(weeklyWeightChange) : 0;

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
        currentWeight: latestWeight,
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
      "Your goal is realistic if you maintain your current trend.";

    if (score >= 90) {
      verdict = "Very realistic";
      recommendation =
        "Your current pace is strong enough to reach your goal. Stay consistent.";
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
        "Your current pace is not fast enough for this deadline. Consider extending the timeline or improving consistency.";
    }

    return {
      score,
      verdict,
      currentWeight: latestWeight,
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
    latestWeight,
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

  const latestWorkoutExercises =
    workoutLogs[workoutLogs.length - 1]?.exercises ?? [];

  const workoutVolumes = workoutLogs.map((log) => ({
    date: log.date,
    volume: log.exercises.reduce(
      (total, exercise) => total + calculateExerciseVolume(exercise),
      0
    ),
  }));

  const latestWorkoutVolume =
    workoutVolumes[workoutVolumes.length - 1]?.volume ?? 0;

  const previousWorkoutVolume =
    workoutVolumes.length >= 2
      ? workoutVolumes[workoutVolumes.length - 2].volume
      : 0;

  const volumeChange =
    previousWorkoutVolume > 0
      ? ((latestWorkoutVolume - previousWorkoutVolume) /
          previousWorkoutVolume) *
        100
      : 0;

  let strengthStatus = "Need more workout data";

  if (workoutVolumes.length >= 2) {
    if (volumeChange > 5) {
      strengthStatus = "Strength/performance improving";
    } else if (volumeChange < -10) {
      strengthStatus = "Strength/performance dropping";
    } else {
      strengthStatus = "Strength/performance stable";
    }
  }

  let strengthInsight =
    "Add at least 2 workout logs with exercises to track strength trends. Rest days are ignored for strength scoring.";

  if (strengthStatus === "Strength/performance improving") {
    strengthInsight =
      "Your latest workout volume is higher than your previous workout. This suggests your strength or performance is improving.";
  } else if (strengthStatus === "Strength/performance dropping") {
    strengthInsight =
      "Your latest workout volume dropped compared to your previous workout. This may be normal if you trained a different muscle group, but watch recovery, sleep, calories, and fatigue.";
  } else if (strengthStatus === "Strength/performance stable") {
    strengthInsight =
      "Your workout volume is relatively stable. Rest days are not counted against your strength score.";
  }

  const proteinTargetMet = avgProtein >= 130;
  const stepTargetMet = avgSteps >= 10000;
  const enoughData = logs.length >= 3;

  const trend =
    weeklyWeightChange < -0.5
      ? "Losing"
      : weeklyWeightChange > 0.5
      ? "Gaining"
      : "Maintaining / Flat";

  const weeklyAIReview = useMemo(() => {
    if (logs.length < 7) {
      return {
        title: "Need more data",
        summary: "Log at least 7 days to unlock your Weekly AI Review.",
        trend: "Not enough data",
        mainAction:
          "Keep logging saved daily entries for weight, calories, protein, steps, and workouts.",
      };
    }

    let weeklyTrend = "Stable";
    let mainAction = "Stay consistent with your current plan.";

    if (weeklyWeightChange < -1.5) {
      weeklyTrend = "Fast weight loss";
      mainAction =
        "Keep protein high and monitor energy, hunger, and workout performance.";
    } else if (weeklyWeightChange < -0.5) {
      weeklyTrend = "Steady fat loss";
      mainAction =
        "Continue your current calorie, protein, step, and training routine.";
    } else if (weeklyWeightChange <= 0.3) {
      weeklyTrend = "Slow movement / possible stall";
      mainAction =
        "Check calorie consistency, sodium, sleep, and steps before making changes.";
    } else {
      weeklyTrend = "Weight trending up";
      mainAction =
        "Review recent calories, sodium, carbs, and untracked meals before making a major adjustment.";
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
      title: "Weekly AI Review",
      summary: `This week, your weight changed by ${weeklyWeightChange.toFixed(
        1
      )} lbs. You averaged ${avgCalories.toFixed(
        0
      )} calories, ${avgProtein.toFixed(0)}g protein, and ${avgSteps.toFixed(
        0
      )} steps. Your current goal status is ${goalStatus}.`,
      trend: weeklyTrend,
      mainAction,
    };
  }, [
    logs.length,
    weeklyWeightChange,
    avgCalories,
    avgProtein,
    avgSteps,
    goalStatus,
    goalFeasibility.verdict,
    plateauStatus,
  ]);

  const weeklyReport = useMemo(() => {
    if (logs.length < 7) {
      return "Log at least 7 days to unlock a weekly report.";
    }

    return `
Weekly Report

Goal: ${goal}
Current Weight: ${latestWeight.toFixed(1)} lbs
7-Day Average: ${sevenDayAverage.toFixed(1)} lbs
14-Day Average: ${fourteenDayAverage.toFixed(1)} lbs
Goal Weight: ${goalWeight.toFixed(1)} lbs
Pounds to Goal: ${poundsToGoal.toFixed(1)} lbs
Days Until Goal: ${daysUntilGoal}
Average Calories: ${avgCalories.toFixed(0)}
Average Protein: ${avgProtein.toFixed(0)}g
Average Steps: ${avgSteps.toFixed(0)}
Weekly Weight Change: ${weeklyWeightChange.toFixed(1)} lbs
Current Pace: ${currentPace.toFixed(1)} lbs/week
Required Weekly Loss: ${requiredWeeklyLoss.toFixed(1)} lbs/week
Projected Goal Date: ${projectedGoalDateText}
Goal Status: ${goalStatus}
Plateau Status: ${plateauStatus}
Confidence Score: ${confidenceScore}/100
Plateau Recommendation: ${plateauRecommendation}
Strength Status: ${strengthStatus}
Workout Volume Change: ${volumeChange.toFixed(1)}%
    `.trim();
  }, [
    logs.length,
    goal,
    latestWeight,
    sevenDayAverage,
    fourteenDayAverage,
    goalWeight,
    poundsToGoal,
    daysUntilGoal,
    avgCalories,
    avgProtein,
    avgSteps,
    weeklyWeightChange,
    currentPace,
    requiredWeeklyLoss,
    projectedGoalDateText,
    goalStatus,
    plateauStatus,
    confidenceScore,
    plateauRecommendation,
    strengthStatus,
    volumeChange,
  ]);

  const recommendation = getCoachRecommendation({
    goal,
    avgCalories,
    avgProtein,
    avgSteps,
    weeklyWeightChange,
    currentPace,
    requiredWeeklyLoss,
    poundsToGoal,
    goalStatus,
    plateauStatus,
    confidenceScore,
    strengthStatus,
  });

  function addExerciseToEntry() {
    if (!exercise.name.trim()) return;

    setEntry((current) => ({
      ...current,
      exercises: [
        ...current.exercises,
        { ...exercise, id: crypto.randomUUID() },
      ],
    }));

    setExercise({
      id: crypto.randomUUID(),
      name: "",
      sets: 3,
      reps: 10,
      weight: 0,
    });
  }

  function removeExerciseFromEntry(id: string) {
    setEntry((current) => ({
      ...current,
      exercises: current.exercises.filter((item) => item.id !== id),
    }));
  }

  function saveLog() {
    if (editingId) {
      setLogs((currentLogs) =>
        currentLogs.map((log) =>
          log.id === editingId ? { ...entry, id: editingId } : log
        )
      );

      setEditingId(null);
    } else {
      setLogs((currentLogs) => [
        ...currentLogs,
        { ...entry, id: crypto.randomUUID() },
      ]);
    }

    setEntry({
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      weight: entry.weight,
      calories: entry.calories,
      protein: entry.protein,
      steps: entry.steps,
      workout: "",
      exercises: [],
    });
  }

  function editLog(log: LogEntry) {
    setEntry(log);
    setEditingId(log.id);
  }

  function deleteLog(id: string) {
    setLogs((currentLogs) => currentLogs.filter((log) => log.id !== id));
  }

  function clearAllLogs() {
    setLogs([]);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
            Fitness Progress
          </p>
          <h1 className="mt-1 text-4xl font-bold">FitCheck AI</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            A fitness analytics dashboard that tracks weight, nutrition, steps,
            workouts, trend progress, goal forecasting, plateau detection,
            strength analytics, and coaching recommendations.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Daily Log</h2>

            <div className="mt-4 grid gap-4">
              <SelectField
                label="Goal"
                value={goal}
                onChange={(value) => setGoal(value as Goal)}
                options={["Cutting", "Bulking", "Maintaining"]}
              />

              <NumberField
                label="Weight"
                value={entry.weight}
                onChange={(value) =>
                  setEntry((current) => ({ ...current, weight: value }))
                }
              />

              <NumberField
                label="Calories"
                value={entry.calories}
                onChange={(value) =>
                  setEntry((current) => ({ ...current, calories: value }))
                }
              />

              <NumberField
                label="Protein"
                value={entry.protein}
                onChange={(value) =>
                  setEntry((current) => ({ ...current, protein: value }))
                }
              />

              <NumberField
                label="Steps"
                value={entry.steps}
                onChange={(value) =>
                  setEntry((current) => ({ ...current, steps: value }))
                }
              />

              <NumberField
                label="Goal Weight"
                value={goalWeight}
                onChange={setGoalWeight}
              />

              <label className="block text-sm font-medium text-slate-700">
                Goal Date
                <input
                  className="mt-1 w-full rounded-xl border p-2"
                  type="date"
                  value={goalDate}
                  onChange={(event) => setGoalDate(event.target.value)}
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Date
                <input
                  className="mt-1 w-full rounded-xl border p-2"
                  type="date"
                  value={entry.date}
                  onChange={(event) =>
                    setEntry((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Workout
                <input
                  className="mt-1 w-full rounded-xl border p-2"
                  value={entry.workout}
                  onChange={(event) =>
                    setEntry((current) => ({
                      ...current,
                      workout: event.target.value,
                    }))
                  }
                  placeholder="Push Day, Pull Day, Legs, Rest..."
                />
              </label>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-100 p-4">
              <h3 className="font-semibold">Add Exercise</h3>

              <div className="mt-3 grid gap-3">
                <input
                  className="rounded-xl border p-2"
                  placeholder="Exercise name"
                  value={exercise.name}
                  onChange={(event) =>
                    setExercise((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />

                <div className="grid grid-cols-3 gap-3">
                  <NumberField
                    label="Sets"
                    value={exercise.sets}
                    onChange={(value) =>
                      setExercise((current) => ({
                        ...current,
                        sets: value,
                      }))
                    }
                  />

                  <NumberField
                    label="Reps"
                    value={exercise.reps}
                    onChange={(value) =>
                      setExercise((current) => ({
                        ...current,
                        reps: value,
                      }))
                    }
                  />

                  <NumberField
                    label="Weight"
                    value={exercise.weight}
                    onChange={(value) =>
                      setExercise((current) => ({
                        ...current,
                        weight: value,
                      }))
                    }
                  />
                </div>

                <button
                  onClick={addExerciseToEntry}
                  className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white"
                >
                  Add Exercise
                </button>
              </div>

              {entry.exercises.length > 0 && (
                <div className="mt-4 space-y-2">
                  {entry.exercises.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl bg-white p-3 text-sm"
                    >
                      <span>
                        {item.name}: {item.sets} x {item.reps} @ {item.weight}{" "}
                        lbs
                      </span>

                      <button
                        onClick={() => removeExerciseFromEntry(item.id)}
                        className="font-semibold text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={saveLog}
              className="mt-6 w-full rounded-2xl bg-emerald-600 px-4 py-3 font-bold text-white"
            >
              {editingId ? "Update Log" : "Save Log"}
            </button>

            {editingId && (
              <button
                onClick={() => setEditingId(null)}
                className="mt-3 w-full rounded-2xl bg-slate-200 px-4 py-3 font-bold text-slate-800"
              >
                Cancel Edit
              </button>
            )}
          </section>

          <section className="space-y-6">
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Dashboard</h2>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Stat
                  label="Latest Weight"
                  value={`${latestWeight.toFixed(1)} lbs`}
                />
                <Stat
                  label="7-Day Average"
                  value={`${sevenDayAverage.toFixed(1)} lbs`}
                />
                <Stat
                  label="14-Day Average"
                  value={`${fourteenDayAverage.toFixed(1)} lbs`}
                />
                <Stat label="Avg Calories" value={avgCalories.toFixed(0)} />
                <Stat label="Avg Protein" value={`${avgProtein.toFixed(0)}g`} />
                <Stat label="Avg Steps" value={avgSteps.toFixed(0)} />
                <Stat label="Trend" value={trend} />
                <Stat label="Plateau Status" value={plateauStatus} />
                <Stat
                  label="Confidence Score"
                  value={`${confidenceScore}/100`}
                />
                <Stat label="Total Exercises" value={`${totalExercises}`} />
                <Stat
                  label="Goal Weight"
                  value={`${goalWeight.toFixed(1)} lbs`}
                />
                <Stat
                  label="Pounds to Goal"
                  value={`${poundsToGoal.toFixed(1)} lbs`}
                />
                <Stat label="Goal Date" value={goalDate} />
                <Stat label="Days Until Goal" value={`${daysUntilGoal} days`} />
                <Stat
                  label="Required Weekly Loss"
                  value={`${requiredWeeklyLoss.toFixed(1)} lbs/week`}
                />
                <Stat
                  label="Projected Goal Date"
                  value={projectedGoalDateText}
                />
                <Stat label="Goal Status" value={goalStatus} />
                <Stat
                  label="Current Pace"
                  value={`${currentPace.toFixed(1)} lbs/week`}
                />
                <Stat
                  label="Weekly Change"
                  value={`${weeklyWeightChange.toFixed(1)} lbs`}
                />
                <Stat
                  label="Latest Workout Volume"
                  value={`${latestWorkoutVolume.toFixed(0)} lbs`}
                />
                <Stat
                  label="Workout Volume Change"
                  value={`${volumeChange.toFixed(1)}%`}
                />
                <Stat label="Strength Status" value={strengthStatus} />
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Weight Trend Chart</h2>

              <div className="mt-4 h-72">
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
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Steps Trend Chart</h2>

              <div className="mt-4 h-72">
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
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">AI Coach Report</h2>

              <div className="mt-4 space-y-3 text-slate-700">
                <p>
                  You are currently in a <strong>{goal}</strong> phase.
                </p>

                <p>
                  Your latest saved weight is{" "}
                  <strong>{latestWeight.toFixed(1)} lbs</strong>. Your 7-day
                  average is <strong>{sevenDayAverage.toFixed(1)} lbs</strong>{" "}
                  and your 14-day average is{" "}
                  <strong>{fourteenDayAverage.toFixed(1)} lbs</strong>.
                </p>

                <p>
                  You are approximately{" "}
                  <strong>{poundsToGoal.toFixed(1)} lbs</strong> away from your
                  goal weight of <strong>{goalWeight.toFixed(1)} lbs</strong>.
                </p>

                <p>
                  At your current pace of{" "}
                  <strong>{currentPace.toFixed(1)} lbs/week</strong>, your
                  projected goal date is{" "}
                  <strong>{projectedGoalDateText}</strong>.
                </p>

                <p>
                  To reach your goal by <strong>{goalDate}</strong>, you need
                  to lose about{" "}
                  <strong>{requiredWeeklyLoss.toFixed(1)} lbs/week</strong>.
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
              <h2 className="text-2xl font-semibold">
                Plateau Detection Agent
              </h2>

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
              <h2 className="text-2xl font-semibold">
                Goal Feasibility Agent
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Day 13: Evaluates whether your goal is realistic based on your
                current pace, required pace, and deadline.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Stat
                  label="Feasibility Score"
                  value={`${goalFeasibility.score}/100`}
                />
                <Stat label="Verdict" value={goalFeasibility.verdict} />
                <Stat
                  label="Current Weight"
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
                next week.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Stat label="Weekly Trend" value={weeklyAIReview.trend} />
                <Stat label="Goal Status" value={goalStatus} />
                <Stat
                  label="Weekly Weight Change"
                  value={`${weeklyWeightChange.toFixed(1)} lbs`}
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

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Weekly Report</h2>
              <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                {weeklyReport}
              </pre>
            </section>

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
                    Goal pace:{" "}
                    {requiredWeeklyLoss <= 2
                      ? "✅ Manageable"
                      : "⚠️ Aggressive"}
                  </li>
                  <li>
                    Plateau:{" "}
                    {plateauStatus === "Potential plateau detected"
                      ? "⚠️ Watch trend closely"
                      : "✅ No major concern"}
                  </li>
                  <li>
                    Strength:{" "}
                    {strengthStatus.includes("dropping")
                      ? "⚠️ Monitor recovery"
                      : "✅ Acceptable"}
                  </li>
                  <li>
                    Workout data:{" "}
                    {workoutLogs.length > 0
                      ? "✅ Workout logs available"
                      : "⚠️ Add workouts when you train"}
                  </li>
                  <li>
                    Strength analysis:{" "}
                    {workoutVolumes.length >= 2
                      ? "✅ Available"
                      : "⚠️ Need 2 workout days"}
                  </li>
                </ul>
              </section>

              <section className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Current Summary</h2>

                <p className="mt-4 text-slate-700">
                  You are currently <strong>{goal.toLowerCase()}</strong>. Your
                  latest weight is{" "}
                  <strong>{latestWeight.toFixed(1)} lbs</strong>. Your goal is{" "}
                  <strong>{goalWeight.toFixed(1)} lbs</strong> by{" "}
                  <strong>{goalDate}</strong>. FitCheck AI now includes goal
                  feasibility and a Day 14 Weekly AI Review.
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
                      {sortedLogs.map((log) => (
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
                          <td className="p-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => editLog(log)}
                                className="rounded-lg bg-blue-100 px-3 py-1 font-semibold text-blue-700"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => deleteLog(log.id)}
                                className="rounded-lg bg-red-100 px-3 py-1 font-semibold text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {logs.length > 0 && (
                <button
                  onClick={clearAllLogs}
                  className="mt-5 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white"
                >
                  Clear All Logs
                </button>
              )}
            </section>
          </section>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        className="mt-1 w-full rounded-xl border p-2"
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select
        className="mt-1 w-full rounded-xl border p-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + Math.ceil(days));
  return result;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function calculateExerciseVolume(exercise: Exercise) {
  return exercise.sets * exercise.reps * exercise.weight;
}

function getCoachRecommendation({
  goal,
  avgCalories,
  avgProtein,
  avgSteps,
  weeklyWeightChange,
  currentPace,
  requiredWeeklyLoss,
  poundsToGoal,
  goalStatus,
  plateauStatus,
  confidenceScore,
  strengthStatus,
}: {
  goal: Goal;
  avgCalories: number;
  avgProtein: number;
  avgSteps: number;
  weeklyWeightChange: number;
  currentPace: number;
  requiredWeeklyLoss: number;
  poundsToGoal: number;
  goalStatus: string;
  plateauStatus: string;
  confidenceScore: number;
  strengthStatus: string;
}) {
  if (poundsToGoal <= 0) {
    return "Goal reached. Consider moving into maintenance before deciding whether to cut further or lean bulk.";
  }

  if (confidenceScore < 50) {
    return "Keep logging more data before making aggressive decisions. The app needs more saved entries to make stronger recommendations.";
  }

  if (goal === "Cutting") {
    if (plateauStatus === "Potential plateau detected") {
      return "A possible plateau is showing. Do not panic after only a few days. Check calorie accuracy, sodium, sleep, stress, carbs, and steps first. If the trend stays flat, make a small adjustment.";
    }

    if (avgProtein < 120) {
      return "Protein is lower than ideal for a cut. Increase protein to help preserve muscle while losing weight.";
    }

    if (avgSteps < 10000) {
      return "Steps are below your target range. Increasing steps can help fat loss without cutting calories too aggressively.";
    }

    if (requiredWeeklyLoss > 2) {
      return "Your required weekly loss is aggressive. Consider extending the timeline or tightening consistency instead of making extreme changes.";
    }

    if (strengthStatus === "Strength/performance dropping") {
      return "Strength appears to be dropping. Prioritize sleep, recovery, protein, and avoid making the deficit too aggressive.";
    }

    if (goalStatus === "Ahead of schedule") {
      return "You are ahead of schedule. Keep the plan steady and avoid unnecessary aggressive cuts.";
    }

    if (goalStatus === "On track") {
      return "You are on track. Continue your current calorie, step, protein, and training routine.";
    }

    if (weeklyWeightChange > 0.5) {
      return "Weight is trending up this week. Review calories, sodium, carbs, and untracked snacks before changing the plan.";
    }

    return "Your cut looks solid. Focus on consistency, protein, steps, and weekly averages rather than single-day scale changes.";
  }

  if (goal === "Bulking") {
    if (weeklyWeightChange > 1) {
      return "Weight is increasing quickly for a bulk. Consider slowing the surplus to limit unnecessary fat gain.";
    }

    if (strengthStatus === "Strength/performance improving") {
      return "Good lean bulk signal: strength is improving. Keep training hard and maintain a controlled surplus.";
    }

    return "For bulking, aim for slow weight gain, progressive overload, enough protein, and consistent training.";
  }

  return "For maintenance, aim to keep weight stable while improving habits, training performance, and consistency.";
}