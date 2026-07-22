import type { AgentCheck, AgentDecision, AgentMemory } from "@/types/fitness";

export function AgentDashboardCard({
  agentDecision,
  agentMemory,
  latestAgentCheck,
  previousAgentCheck,
}: {
  agentDecision: AgentDecision;
  agentMemory: AgentMemory;
  latestAgentCheck?: AgentCheck;
  previousAgentCheck?: AgentCheck;
}) {
  const latestDecision = latestAgentCheck?.decision ?? agentDecision.action;
  const previousDecision = previousAgentCheck?.decision;
  const recommendationChanged =
    Boolean(previousDecision) && previousDecision !== latestDecision;
  const recommendationStable =
    Boolean(previousDecision) && previousDecision === latestDecision;

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Agent Dashboard
          </p>
          <h2 className="mt-1 text-3xl font-bold">AI Coach Control Center</h2>
        </div>

        <span className="w-fit rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          {latestAgentCheck?.confidence ?? agentDecision.confidence} confidence
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <AgentDashboardStat
          label="Overall Status"
          value={latestAgentCheck?.status ?? "Ready for agent check"}
        />
        <AgentDashboardStat label="Current Priority" value={agentDecision.priority} />
        <AgentDashboardStat label="Latest Decision" value={latestDecision} />
        <AgentDashboardStat
          label="Last Agent Check"
          value={latestAgentCheck?.date ?? "No saved check yet"}
        />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-sm font-semibold text-slate-500">Current Plan</p>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>{agentDecision.calorieGuidance}</p>
            <p>{agentDecision.proteinGuidance}</p>
            <p>{agentDecision.stepGuidance}</p>
            <p>{agentDecision.recoveryGuidance}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-slate-600">
            Next Recommended Action
          </p>
          <p className="mt-3 text-slate-800">
            {latestAgentCheck?.nextAction ??
              latestAgentCheck?.recommendation ??
              agentDecision.rationale}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-500">Agent Memory</p>
        <p className="mt-2 font-semibold text-slate-900">
          {agentMemory.noticedPattern}
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <AgentDashboardStat
            label="Recurring Risk"
            value={
              agentMemory.recurringRiskCount > 0
                ? `${agentMemory.recurringRisk} (${agentMemory.recurringRiskCount}x)`
                : agentMemory.recurringRisk
            }
          />
          <AgentDashboardStat
            label="Repeated Decision"
            value={
              agentMemory.repeatedDecisionCount > 0
                ? `${agentMemory.repeatedDecision} (${agentMemory.repeatedDecisionCount}x)`
                : agentMemory.repeatedDecision
            }
          />
        </div>

        <div className="mt-4 rounded-2xl bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action Tracker
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {agentMemory.trackedAction}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {agentMemory.actionWindow}
              </p>
            </div>

            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {agentMemory.actionResult}
            </span>
          </div>

          <p className="mt-3 text-sm font-medium text-slate-800">
            {agentMemory.actionEvidence}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {agentMemory.actionNextStep}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-100 p-4">
        <p className="text-sm font-semibold text-slate-500">
          Recommendation Change
        </p>

        {previousDecision ? (
          <div className="mt-2 text-sm text-slate-700">
            <p>
              Previous: <span className="font-semibold">{previousDecision}</span>
            </p>
            <p>
              Current: <span className="font-semibold">{latestDecision}</span>
            </p>
            <p className="mt-2">
              {recommendationChanged
                ? latestAgentCheck?.changeSummary ??
                  `Changed because ${agentDecision.rationale.toLowerCase()}`
                : recommendationStable
                ? "No change. The latest agent check supports the same core action."
                : "Run another agent check to compare recommendations."}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-700">
            Run FitCheck Agent at least twice to compare recommendation changes.
          </p>
        )}
      </div>
    </section>
  );
}

function AgentDashboardStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
