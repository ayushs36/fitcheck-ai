import type { AgentDecision } from "@/types/fitness";
import { removeVisibleAsterisks } from "@/lib/textSanitizers";

export function FitCheckAgentCard({
  agentReport,
  isAgentLoading,
  runFitCheckAgent,
  agentDecision,
  isDemoMode,
}: {
  agentReport: string;
  isAgentLoading: boolean;
  runFitCheckAgent: () => void;
  agentDecision: AgentDecision;
  isDemoMode: boolean;
}) {
  const cleanAgentReport = removeVisibleAsterisks(agentReport);
  const status = getAgentReportValue(cleanAgentReport, "Overall Status");
  const risk = getAgentReportValue(cleanAgentReport, "Biggest Risk");
  const nextAction = getAgentReportValue(cleanAgentReport, "Next 7-Day Action Plan");
  const confidence =
    getAgentReportValue(cleanAgentReport, "Confidence Level") ??
    agentDecision.confidence;
  const protectedMode = cleanAgentReport.toLowerCase().includes("protected mode:");

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
            Runs the full AI coaching pass using your logs, moving average
            trend, nutrition, activity, strength data, goal phase, and timeline.
          </p>
        </div>

        <div className="flex flex-col gap-2 lg:items-end">
          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
              isDemoMode
                ? "bg-emerald-50 text-emerald-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {isDemoMode ? "Demo-safe AI response" : "Live OpenAI enabled"}
          </span>

          <button
            onClick={runFitCheckAgent}
            disabled={isAgentLoading}
            className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 lg:w-auto"
          >
            {isAgentLoading ? "Running Agent..." : "Run Agent Check"}
          </button>

          {protectedMode && (
            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              No API credits used
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
          {cleanAgentReport}
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
