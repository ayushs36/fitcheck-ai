export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatReadableDate(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
