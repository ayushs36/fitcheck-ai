import type { AgentCheck, LogEntry } from "@/types/fitness";

const demoWorkouts = [
  {
    workout: "Push Day",
    exercises: [
      { name: "Bench Press", sets: 3, reps: 8, weight: 115 },
      { name: "Shoulder Press", sets: 3, reps: 10, weight: 45 },
    ],
  },
  {
    workout: "Pull Day",
    exercises: [
      { name: "Lat Pulldown", sets: 3, reps: 10, weight: 95 },
      { name: "Seated Row", sets: 3, reps: 10, weight: 85 },
    ],
  },
  {
    workout: "Leg Day",
    exercises: [
      { name: "Squat", sets: 3, reps: 8, weight: 135 },
      { name: "Romanian Deadlift", sets: 3, reps: 10, weight: 115 },
    ],
  },
  { workout: "Rest", exercises: [] },
];

export function createDemoLogs(): LogEntry[] {
  const today = new Date();

  return Array.from({ length: 35 }, (_, index) => {
    const daysAgo = 34 - index;
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);

    const workoutTemplate = demoWorkouts[index % demoWorkouts.length];
    const trendWeight = 142.2 - index * 0.13;
    const waterNoise = [0.3, -0.1, 0.1, -0.2, 0.2, -0.3, 0][index % 7];

    return {
      id: `demo-log-${index}`,
      date: date.toISOString().slice(0, 10),
      weight: Number((trendWeight + waterNoise).toFixed(1)),
      calories: 1875 + [80, -40, 20, -90, 55, 0, -20][index % 7],
      protein: 138 + [8, -5, 12, 0, -8, 6, 3][index % 7],
      steps: 10200 + [900, -1200, 700, 1500, -500, 300, -900][index % 7],
      workout: workoutTemplate.workout,
      exercises: workoutTemplate.exercises.map((exercise, exerciseIndex) => ({
        id: `demo-exercise-${index}-${exerciseIndex}`,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps + Math.floor(index / 14),
        weight: exercise.weight + Math.floor(index / 10) * 5,
      })),
    };
  });
}

export function createDemoAgentHistory(): AgentCheck[] {
  return [
    {
      id: "demo-agent-check-2",
      date: new Date().toLocaleString(),
      status: "On track with manageable risk",
      decision: "Hold calories",
      biggestRisk: "Letting step consistency drift on rest days.",
      evidence:
        "Weight trend is moving toward the target, protein is consistently above target, and strength is stable.",
      nextAction:
        "Hold calories this week and keep steps above 10,000 on at least 5 days.",
      recommendation:
        "Hold calories, maintain protein, and protect step consistency.",
      confidence: "High",
      changeSummary:
        "Previous: Increase steps. Current: Hold calories. Change reason: Progress returned to target pace.",
      fullResponse:
        "Overall Status: On track with manageable risk\nBiggest Risk: Letting step consistency drift on rest days.\nEvidence: Weight trend is moving toward the target, protein is consistently above target, and strength is stable.\nDecision Engine Action: Hold calories\nNext 7-Day Action Plan: Hold calories this week and keep steps above 10,000 on at least 5 days.\nConfidence Level: High",
    },
    {
      id: "demo-agent-check-1",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleString(),
      status: "Progress slow but fixable",
      decision: "Increase steps",
      biggestRisk: "Activity was too inconsistent to judge calories fairly.",
      evidence:
        "Scale trend was flat while average steps were below the target baseline.",
      nextAction:
        "Increase steps before cutting calories and reassess after 7 days.",
      recommendation: "Increase steps before reducing calories.",
      confidence: "Medium",
      changeSummary: "First saved agent recommendation.",
      fullResponse:
        "Overall Status: Progress slow but fixable\nBiggest Risk: Activity was too inconsistent to judge calories fairly.\nEvidence: Scale trend was flat while average steps were below the target baseline.\nDecision Engine Action: Increase steps\nNext 7-Day Action Plan: Increase steps before cutting calories and reassess after 7 days.\nConfidence Level: Medium",
    },
  ];
}
