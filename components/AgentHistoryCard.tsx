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
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Agent History</h2>
          <p className="mt-2 text-sm text-slate-500">
            Saved FitCheck Agent checks with the main decision signals.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {agentHistory.length} saved check
            {agentHistory.length === 1 ? "" : "s"}
          </p>
        </div>

        {agentHistory.length > 0 && (
          <button
            onClick={clearAgentHistory}
            className="rounded-2xl bg-red-100 px-4 py-2 font-semibold text-red-700"
          >
            Clear Agent History
          </button>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {agentHistory.length === 0 ? (
          <p className="rounded-2xl bg-slate-100 p-4 text-slate-600">
            No agent checks saved yet. Run FitCheck Agent to create the first
            memory.
          </p>
        ) : (
          agentHistory.map((check) => {
            const isExpanded = expandedAgentCheckId === check.id;
            const decision = check.decision ?? "Not specified";
            const nextAction = check.nextAction ?? check.recommendation;
            const evidence = check.evidence ?? "Open full details to review evidence.";

            return (
              <div key={check.id} className="rounded-2xl bg-slate-100 p-4">
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

                    <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-600">
                      Confidence: {check.confidence}
                    </span>
                  </div>
                </button>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <AgentHistoryStat label="Status" value={check.status} />
                  <AgentHistoryStat label="Decision" value={decision} />
                  <AgentHistoryStat
                    label="Biggest Risk"
                    value={check.biggestRisk}
                  />
                  <AgentHistoryStat
                    label="Next Action"
                    value={nextAction}
                  />
                  <AgentHistoryStat label="Evidence" value={evidence} />
                  <AgentHistoryStat
                    label="Change"
                    value={check.changeSummary ?? "No previous comparison"}
                  />
                </div>

                {isExpanded && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <p className="text-sm font-semibold text-slate-700">
                      Reasoning
                    </p>
                    <p className="mt-2 text-slate-700">{evidence}</p>

                    <p className="text-sm font-semibold text-slate-700">
                      Full Agent Response
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-slate-700">
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
    <div className="rounded-2xl bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
