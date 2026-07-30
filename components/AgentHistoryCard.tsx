import type { AgentCheck } from "@/types/fitness";

export function AgentHistoryCard({
  agentHistory,
  expandedAgentCheckId,
  setExpandedAgentCheckId,
  clearAgentHistory,
}: {
  agentHistory: AgentCheck[];
  expandedAgentCheckId: string | null;
  setExpandedAgentCheckId: (id: string | null) => void;
  clearAgentHistory: () => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Agent History</h2>
          <p className="mt-2 text-sm text-slate-500">
            Saved coaching decisions, risks, evidence, and next actions.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {agentHistory.length} saved check
            {agentHistory.length === 1 ? "" : "s"}
          </p>
        </div>

        {agentHistory.length > 0 && (
          <button
            onClick={clearAgentHistory}
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            Clear History
          </button>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {agentHistory.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-950">
              No agent decisions saved yet
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Save daily logs first, then run FitCheck Agent from the Coach tab.
              Each check becomes memory the agent can compare against later.
            </p>
          </div>
        ) : (
          agentHistory.map((check) => {
            const isExpanded = expandedAgentCheckId === check.id;
            const decision = check.decision ?? "Not specified";
            const nextAction = check.nextAction ?? check.recommendation;
            const evidence = check.evidence ?? "Open full details to review evidence.";

            return (
              <div
                key={check.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <button
                  onClick={() =>
                    setExpandedAgentCheckId(isExpanded ? null : check.id)
                  }
                  className="w-full text-left"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {isExpanded ? "Hide" : "View"} {decision}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {check.date}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-600">
                        {check.status}
                      </span>
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">
                        {check.confidence} confidence
                      </span>
                    </div>
                  </div>
                </button>

                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <AgentHistoryStat label="Decision" value={decision} />
                  <AgentHistoryStat
                    label="Biggest Risk"
                    value={check.biggestRisk}
                  />
                  <AgentHistoryStat
                    label="Next Action"
                    value={nextAction}
                  />
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <AgentHistoryStat label="Evidence" value={evidence} />
                      <AgentHistoryStat
                        label="Recommendation Change"
                        value={check.changeSummary ?? "No previous comparison"}
                      />
                    </div>

                    <p className="text-sm font-semibold text-slate-700">
                      Full Agent Response
                    </p>
                    <p className="whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700">
                      {check.fullResponse}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function AgentHistoryStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
