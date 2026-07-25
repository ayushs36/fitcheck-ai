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
  const status = getAgentReportValue(agentReport, "Overall Status");
  const risk = getAgentReportValue(agentReport, "Biggest Risk");
  const nextAction = getAgentReportValue(agentReport, "Next 7-Day Action Plan");
  const confidence =
    getAgentReportValue(agentReport, "Confidence Level") ??
    agentDecision.confidence;
  const protectedMode = agentReport.toLowerCase().includes("protected mode:");

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
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

        <div className="flex flex-col gap-2 lg:items-end">
          <button
            onClick={runFitCheckAgent}
            disabled={isAgentLoading}
            className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 lg:w-auto"
          >
            {isAgentLoading ? "Running Agent..." : "Run Agent Check"}
          </button>

          {protectedMode && (
            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Protected demo response
            </span>
          )}
        </div>
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

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AgentResultStat
          label="Status"
          value={status ?? "Run the agent to update status."}
        />
        <AgentResultStat label="Risk" value={risk ?? "No risk saved yet."} />
        <AgentResultStat
          label="Next Action"
          value={nextAction ?? agentDecision.rationale}
        />
        <AgentResultStat label="Confidence" value={confidence} />
      </div>

      <details className="mt-5 rounded-2xl border border-slate-200 bg-white">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">
          View full agent reasoning
        </summary>

        <div className="max-h-[520px] overflow-auto whitespace-pre-wrap border-t border-slate-200 bg-slate-950 p-4 text-sm leading-6 text-slate-100">
          {agentReport}
        </div>
      </details>
    </section>
  );
}

function AgentResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-5 text-slate-900">
        {value}
      </p>
    </div>
  );
}

function getAgentReportValue(response: string, label: string) {
  const match = response.match(new RegExp(`${label}:\\s*([^\\n]+)`, "i"));

  return match?.[1]?.trim();
}
