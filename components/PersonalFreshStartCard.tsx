export function PersonalFreshStartCard() {
  return (
    <section className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            Personal Workspace
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
            Start fresh from today
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
            Your personal app is using a new private storage area. Save
            today&apos;s log to begin rebuilding your trends, learned workouts,
            exercise suggestions, and agent recommendations.
          </p>
        </div>

        <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700">
          Private data
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <FreshStartStep
          label="1"
          title="Log today"
          description="Weight, calories, protein, steps, or workout. Partial logs are okay."
        />
        <FreshStartStep
          label="2"
          title="Build signal"
          description="Charts and moving averages become useful as daily logs accumulate."
        />
        <FreshStartStep
          label="3"
          title="Run agent"
          description="After enough logs, FitCheck can make more specific coaching decisions."
        />
      </div>
    </section>
  );
}

function FreshStartStep({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-white p-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white">
        {label}
      </span>
      <p className="mt-3 font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>
    </div>
  );
}
