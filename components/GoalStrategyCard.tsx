export function GoalStrategyCard({
  goalStrategy,
  isGoalStrategyLoading,
  generateGoalStrategy,
}: {
  goalStrategy: string;
  isGoalStrategyLoading: boolean;
  generateGoalStrategy: () => void;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">AI Goal Strategy Agent</h2>

      <p className="mt-2 text-sm text-slate-500">
        Generates a personalized strategy for reaching your goal using your
        maintenance estimate, current pace, goal timeline, nutrition, steps, and
        strength data.
      </p>

      <button
        onClick={generateGoalStrategy}
        disabled={isGoalStrategyLoading}
        className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {isGoalStrategyLoading ? "Generating..." : "Generate Goal Strategy"}
      </button>

      <div className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-100 p-4 text-slate-700">
        {goalStrategy}
      </div>
    </section>
  );
}