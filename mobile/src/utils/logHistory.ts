import type {DailyLog} from "../types/fitness.ts";

export function groupLogHistory(logs: DailyLog[]) {
  const groups = new Map<string, {key: string; monthYear: string; logs: DailyLog[]}>();
  for (const log of [...logs].sort((a, b) => b.date.localeCompare(a.date))) {
    const key = log.date.slice(0, 7);
    let group = groups.get(key);
    if (!group) {
      group = {key, monthYear: new Date(`${key}-01T12:00:00`).toLocaleString("en-US", {
        month: "long", year: "numeric",
      }), logs: []};
      groups.set(key, group);
    }
    group.logs.push(log);
  }
  return [...groups.values()];
}
