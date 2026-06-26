export function FitCheckAgentCard({
  agentReport,
  isAgentLoading,
  runFitCheckAgent,
}: {
  agentReport: string;
  isAgentLoading: boolean;
  runFitCheckAgent: () => void;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">FitCheck Agent</h2>

      <p className="mt-2 text-sm text-slate-500">
        Runs a full AI review of your current progress and creates your next action plan.
      </p>

      <button
        onClick={runFitCheckAgent}
        disabled={isAgentLoading}
        className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {isAgentLoading ? "Running Agent..." : "Run FitCheck Agent"}
      </button>

      <div className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-100 p-4 text-slate-700">
        {agentReport}
      </div>
    </section>
  );
}