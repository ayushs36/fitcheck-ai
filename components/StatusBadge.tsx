function getStatusTone(value: string) {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("ahead") ||
    normalized.includes("on track") ||
    normalized.includes("realistic") ||
    normalized.includes("improving") ||
    normalized.includes("stable") ||
    normalized.includes("progress trending down")
  ) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (
    normalized.includes("aggressive") ||
    normalized.includes("plateau") ||
    normalized.includes("need") ||
    normalized.includes("flat") ||
    normalized.includes("slow")
  ) {
    return "bg-amber-100 text-amber-700";
  }

  if (
    normalized.includes("behind") ||
    normalized.includes("unlikely") ||
    normalized.includes("dropping") ||
    normalized.includes("up")
  ) {
    return "bg-red-100 text-red-700";
  }

  return "bg-slate-200 text-slate-700";
}

export function StatusBadge({ label, value }: { label: string; value: string }) {
  const tone = getStatusTone(value);

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tone}`}>
      {label}: {value}
    </span>
  );
}