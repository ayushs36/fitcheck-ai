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
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Primary Coach
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
            FitCheck Agent
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Runs an autonomous coaching check using your logs, moving average
            trend, nutrition, activity, strength data, and goal timeline.
          </p>
        </div>

        <button
          onClick={runFitCheckAgent}
          disabled={isAgentLoading}
          className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 lg:w-auto"
        >
          {isAgentLoading ? "Running Agent..." : "Run Agent Check"}
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Decision Engine
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
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

      <div className="mt-5 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
        {agentReport}
      </div>
    </section>
  );
}
