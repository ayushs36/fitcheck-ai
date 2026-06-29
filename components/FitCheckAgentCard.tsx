import type { AgentDecision } from "@/types/fitness";

export function FitCheckAgentCard({
  agentReport,
  isAgentLoading,
  runFitCheckAgent,
  agentDecision,
}: {
  agentReport: string;
  isAgentLoading: boolean;
  runFitCheckAgent: () => void;
  agentDecision: AgentDecision;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">FitCheck Agent</h2>

      <p className="mt-2 text-sm text-slate-500">
  Runs an autonomous coaching check using your logs, moving average trend,
  nutrition, activity, strength data, and goal timeline.
</p>

      <div className="mt-5 rounded-2xl bg-slate-100 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              Decision Engine
            </p>
            <p className="text-xl font-semibold text-slate-900">
              {agentDecision.action}
            </p>
          </div>

          <span className="w-fit rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-600">
            {agentDecision.confidence} confidence
          </span>
        </div>

        <p className="mt-3 text-sm text-slate-700">
          <span className="font-semibold">{agentDecision.priority}:</span>{" "}
          {agentDecision.rationale}
        </p>
      </div>

      <button
        onClick={runFitCheckAgent}
        disabled={isAgentLoading}
        className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {isAgentLoading ? "Running Agent..." : "Run Agent Check"}
      </button>

      <div className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-100 p-4 text-slate-700">
        {agentReport}
      </div>
    </section>
  );
}
