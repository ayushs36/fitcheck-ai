import type { Exercise, Goal, LogEntry } from "@/types/fitness";
import { Input, NumberInput, Select } from "@/components/FormInputs";
import type { LogCoverage } from "@/lib/logQuality";

export function DailyLogCard({
  goal,
  setGoal,
  entry,
  setEntry,
  exercise,
  setExercise,
  goalWeight,
  setGoalWeight,
  goalDate,
  setGoalDate,
  workoutTypes,
  suggestedExercises,
  latestWorkoutTemplate,
  currentLogCoverage,
  editingId,
  addExercise,
  deleteExercise,
  saveLog,
  resetEntry,
  clearAllLogs,
}: {
  goal: Goal;
  setGoal: (value: Goal) => void;
  entry: LogEntry;
  setEntry: (value: LogEntry) => void;
  exercise: Exercise;
  setExercise: (value: Exercise) => void;
  goalWeight: number;
  setGoalWeight: (value: number) => void;
  goalDate: string;
  setGoalDate: (value: string) => void;
  workoutTypes: string[];
  suggestedExercises: string[];
  latestWorkoutTemplate: Pick<LogEntry, "workout" | "exercises"> | null;
  currentLogCoverage: LogCoverage;
  editingId: string | null;
  addExercise: () => void;
  deleteExercise: (id: string) => void;
  saveLog: () => void;
  resetEntry: () => void;
  clearAllLogs: () => void;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">Daily Log</h2>
      <p className="mt-2 text-sm text-slate-500">
        Log whatever you have for the day. Missing weight, calories, protein,
        steps, or workouts are treated as unknown, not as zero.
      </p>

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

        {workoutTypes.length > 0 && (
          <label className="block">
            <span className="text-sm text-slate-500">Workout Type</span>
            <select
              className="mt-1 w-full rounded-xl border p-2"
              value={workoutTypes.includes(entry.workout) ? entry.workout : ""}
              onChange={(event) => {
                if (event.target.value) {
                  setEntry({ ...entry, workout: event.target.value });
                }
              }}
            >
              <option value="">Choose from previous workouts</option>
              {workoutTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        )}

        <Input
          label={workoutTypes.length > 0 ? "Custom Workout Type" : "Workout Type"}
          type="text"
          value={entry.workout}
          onChange={(value) => setEntry({ ...entry, workout: value })}
          placeholder="Push, Pull, Legs, Rest..."
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              if (!latestWorkoutTemplate) {
                return;
              }

              setEntry({
                ...entry,
                workout: latestWorkoutTemplate.workout,
                exercises: latestWorkoutTemplate.exercises.map((item) => ({
                  ...item,
                  id: crypto.randomUUID(),
                })),
              });
            }}
            disabled={!latestWorkoutTemplate}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            Use Last Workout
          </button>

          <button
            type="button"
            onClick={() => setEntry({ ...entry, workout: "Rest Day", exercises: [] })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
          >
            Rest Day
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">
              Log Coverage
            </p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {currentLogCoverage.status} · {currentLogCoverage.score}%
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {currentLogCoverage.summary}. Missing fields stay unknown and will
            not count as zero.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <h3 className="font-semibold">Add Exercise</h3>

          <div className="mt-3 space-y-3">
            {suggestedExercises.length > 0 && (
              <label className="block">
                <span className="text-sm text-slate-500">
                  Exercise for {entry.workout}
                </span>
                <select
                  className="mt-1 w-full rounded-xl border p-2"
                  value={
                    suggestedExercises.includes(exercise.name)
                      ? exercise.name
                      : ""
                  }
                  onChange={(event) => {
                    if (event.target.value) {
                      setExercise({ ...exercise, name: event.target.value });
                    }
                  }}
                >
                  <option value="">Choose from previous exercises</option>
                  {suggestedExercises.map((exerciseName) => (
                    <option key={exerciseName} value={exerciseName}>
                      {exerciseName}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <Input
              label={
                suggestedExercises.length > 0
                  ? "Custom Exercise Name"
                  : "Exercise Name"
              }
              type="text"
              value={exercise.name}
              onChange={(value) => setExercise({ ...exercise, name: value })}
              placeholder="Bench Press"
            />

            <NumberInput
              label="Sets"
              value={exercise.sets}
              onChange={(value) => setExercise({ ...exercise, sets: value })}
            />

            <NumberInput
              label="Reps"
              value={exercise.reps}
              onChange={(value) => setExercise({ ...exercise, reps: value })}
            />

            <NumberInput
              label="Weight Used"
              value={exercise.weight}
              onChange={(value) => setExercise({ ...exercise, weight: value })}
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
                      {item.name} — {item.sets} x {item.reps} @ {item.weight}{" "}
                      lbs
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
  );
}
