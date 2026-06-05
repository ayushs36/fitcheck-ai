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

const STORAGE_KEY = "fitcheck-logs-v1";

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

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
  const latestWeight = latestLog?.weight ?? entry.weight;

  const sevenDayAverage =
    last7Logs.length > 0 ? average(last7Logs.map((log) => log.weight)) : 0;

  const fourteenDayAverage =
    last14Logs.length > 0 ? average(last14Logs.map((log) => log.weight)) : 0;

  const avgCalories = average(last7Logs.map((log) => log.calories));
  const avgProtein = average(last7Logs.map((log) => log.protein));
  const avgSteps = average(last7Logs.map((log) => log.steps));

  const first7Weight = last7Logs[0]?.weight ?? latestWeight;
  const weeklyWeightChange =
    last7Logs.length >= 2 ? latestWeight - first7Weight : 0;

  const poundsToGoal =
    sevenDayAverage > 0
      ? sevenDayAverage - goalWeight
      : latestWeight - goalWeight;

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

  const latestWorkoutExercises = latestLog?.exercises ?? [];

  const proteinTargetMet = avgProtein >= 130;
  const stepTargetMet = avgSteps >= 10000;
  const enoughData = logs.length >= 3;

  const trend =
    weeklyWeightChange < -0.5
      ? "Losing"
      : weeklyWeightChange > 0.5
      ? "Gaining"
      : "Maintaining / Flat";

  const paceStatus =
    goal === "Cutting"
      ? requiredWeeklyLoss <= 1.5
        ? "Realistic"
        : requiredWeeklyLoss <= 2.25
        ? "Aggressive"
        : "Very Aggressive"
      : goal === "Bulking"
      ? weeklyWeightChange <= 0.75
        ? "Controlled"
        : "Gaining Too Fast"
      : "Stable";

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
Total Exercises Logged: ${totalExercises}
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
      alert("A log already exists for this date. Edit that log or choose another date.");
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

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Fitness Analytics Agent
          </p>

          <h1 className="mt-1 text-4xl font-bold">FitCheck AI</h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            Track weight, calories, protein, steps, workouts, exercises, moving
            averages, goal pace, charts, and AI-style coaching recommendations.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Daily Log</h2>

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

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <Stat label="Latest Weight" value={`${latestWeight.toFixed(1)} lbs`} />
                <Stat label="7-Day Average" value={logs.length ? `${sevenDayAverage.toFixed(1)} lbs` : "No logs"} />
                <Stat label="14-Day Average" value={logs.length ? `${fourteenDayAverage.toFixed(1)} lbs` : "No logs"} />
                <Stat label="Goal Weight" value={`${goalWeight.toFixed(1)} lbs`} />
                <Stat label="Pounds to Goal" value={`${poundsToGoal.toFixed(1)} lbs`} />
                <Stat label="Goal Date" value={goalDate} />
                <Stat label="Days Until Goal" value={`${daysUntilGoal} days`} />
                <Stat label="Required Weekly Loss" value={`${requiredWeeklyLoss.toFixed(1)} lbs/week`} />
                <Stat label="Projected Goal Date" value={projectedGoalDateText} />
                <Stat label="Avg Calories" value={`${avgCalories.toFixed(0)} cal`} />
                <Stat label="Avg Protein" value={`${avgProtein.toFixed(0)}g`} />
                <Stat label="Avg Steps" value={`${avgSteps.toFixed(0)}`} />
                <Stat label="Weekly Change" value={`${weeklyWeightChange.toFixed(1)} lbs`} />
                <Stat label="Trend" value={trend} />
                <Stat label="Exercises Logged" value={`${totalExercises}`} />
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Weight Trend Chart</h2>

              {chartData.length === 0 ? (
                <p className="mt-4 text-slate-500">No logs yet. Add your first log.</p>
              ) : (
                <div className="mt-5 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={["dataMin - 2", "dataMax + 2"]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="weight" strokeWidth={3} dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Steps Trend Chart</h2>

              {chartData.length === 0 ? (
                <p className="mt-4 text-slate-500">No logs yet. Add your first log.</p>
              ) : (
                <div className="mt-5 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="steps" strokeWidth={3} dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">AI Coach Report</h2>

              <div className="mt-4 space-y-3 text-slate-700">
                <p>
                  You are currently <strong>{goal.toLowerCase()}</strong>. Your latest
                  weight is <strong>{latestWeight.toFixed(1)} lbs</strong>
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
                  <strong>{goalDate}</strong>. You are currently{" "}
                  <strong>{poundsToGoal.toFixed(1)} lbs</strong> away from your goal.
                </p>

                <p>
                  Your current pace is about{" "}
                  <strong>{currentPace.toFixed(1)} lbs/week</strong>. Projected
                  goal date: <strong>{projectedGoalDateText}</strong>.
                </p>

                <p>
                  Latest workout included{" "}
                  <strong>{latestWorkoutExercises.length}</strong> logged exercises.
                </p>

                <p>
                  Goal status: <strong>{goalStatus}</strong>
                </p>

                <p>
                  AI confidence score: <strong>{confidenceScore}%</strong>
                </p>
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
                  <li>Data quality: {enoughData ? "✅ Enough logs" : "⚠️ Add more logs"}</li>
                  <li>Protein target: {proteinTargetMet ? "✅ Met" : "⚠️ Not met"}</li>
                  <li>Step target: {stepTargetMet ? "✅ Met" : "⚠️ Not met"}</li>
                  <li>Weight trend: {weeklyWeightChange < 0 ? "✅ Moving down" : "⚠️ Flat/increasing"}</li>
                  <li>Goal pace: {requiredWeeklyLoss <= 2 ? "✅ Manageable" : "⚠️ Aggressive"}</li>
                  <li>Workout detail: {totalExercises > 0 ? "✅ Exercises logged" : "⚠️ Add exercises"}</li>
                </ul>
              </section>

              <section className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Current Summary</h2>

                <p className="mt-4 text-slate-700">
                  You are currently <strong>{goal.toLowerCase()}</strong>. Your
                  latest weight is <strong>{latestWeight.toFixed(1)} lbs</strong>.
                  Your goal is <strong>{goalWeight.toFixed(1)} lbs</strong> by{" "}
                  <strong>{goalDate}</strong>.
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input
          className="w-full rounded-xl border p-2"
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
      </div>
    </label>
  );
}

function Input({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-slate-500">{label}</span>
      <input
        className="mt-1 w-full rounded-xl border p-2"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Select({
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
    <label className="block">
      <span className="text-sm text-slate-500">{label}</span>
      <select
        className="mt-1 w-full rounded-xl border p-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + Math.ceil(days));
  return copy;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}