import { StyleSheet, Text, View } from "react-native";
import type { DailyLog, PhaseTargets, UserSettings } from "../types/fitness";
import { activePhase, averageWeight, offsetDate } from "../utils/goalPhases";
import { formatReadableDate, getTodayKey } from "../utils/date";
import { formatWeightFromLbs, getWeightUnitLabel } from "../utils/units";
import { colors } from "../theme/colors";
import { Card } from "./Card";
import { Disclosure } from "./Disclosure";

export function GoalPhaseHistory({ settings, logs }: { settings: UserSettings | null; logs: DailyLog[] }) {
  const phases = [...(settings?.goalPhases ?? [])].reverse();
  const unitSystem = settings?.unitSystem ?? "imperial";
  const unit = getWeightUnitLabel(unitSystem);
  function weight(value?: number) { return value === undefined ? "Not recorded" : `${formatWeightFromLbs(value, unitSystem)} ${unit}`; }
  function targets(value: PhaseTargets) {
    return [value.targetWeightLbs !== undefined ? `Weight ${weight(value.targetWeightLbs)}` : undefined,
      value.weeklyGoalPaceLbs !== undefined ? `Pace ${weight(value.weeklyGoalPaceLbs)}/week` : undefined,
      value.calorieTarget !== undefined ? `${value.calorieTarget} cal/day` : undefined,
      value.proteinTarget !== undefined ? `${value.proteinTarget} g protein/day` : undefined,
      value.stepTarget !== undefined ? `${value.stepTarget.toLocaleString()} steps/day` : undefined,
    ].filter(Boolean).join(" · ") || "No numeric targets selected";
  }
  return <Card>
    <Text style={styles.title}>Goal phases</Text>
    {phases.length === 0 ? <Text style={styles.body}>Phase tracking begins when you save your goal setup. Existing logs remain in History.</Text> : <>
      <Text style={styles.body}>Completed phases keep their target and result snapshots. A new phase starts on its selected day; earlier logs stay unchanged.</Text>
      {phases.map(phase => {
        const current = phase.id === activePhase(settings)?.id;
        const today = getTodayKey();
        const avg = current ? averageWeight(logs, phase.startDate > offsetDate(today, -6) ? phase.startDate : offsetDate(today, -6), today).value : phase.endAverageLbs;
        const difference = avg !== undefined && phase.startAverageLbs !== undefined ? avg - phase.startAverageLbs : undefined;
        return <Disclosure key={phase.id} title={`${phase.targets.defaultGoal === "cut" ? "Cut" : phase.targets.defaultGoal === "bulk" ? "Bulk" : "Maintain"} · ${current ? "Current" : formatReadableDate(phase.startDate)}`} initiallyOpen={current}>
          <Text style={styles.meta}>{formatReadableDate(phase.startDate)}{phase.endDate ? ` - ${formatReadableDate(offsetDate(phase.endDate, -1) < phase.startDate ? phase.startDate : offsetDate(phase.endDate, -1))}` : " - Present"}</Text>
          {phase.endDate === phase.startDate && <Text style={styles.meta}>Replaced on the same day; no daily logs assigned.</Text>}
          <View style={styles.metrics}>
            <View style={styles.metric}><Text style={styles.meta}>Starting baseline</Text><Text style={styles.value}>{weight(phase.startAverageLbs)}</Text></View>
            <View style={styles.metric}><Text style={styles.meta}>{current ? "Recent average" : "Closing average"}</Text><Text style={styles.value}>{weight(avg)}</Text></View>
          </View>
          {difference !== undefined && <Text style={styles.value}>{weight(Math.abs(difference))} {difference > 0 ? "gained" : difference < 0 ? "lost" : "change"}</Text>}
          <Text style={styles.meta}>Averages use recorded weights in the relevant seven-day windows; blanks are excluded.</Text>
          <Text style={styles.label}>Initial targets</Text><Text style={styles.body}>{targets(phase.initialTargets)}</Text>
          <Text style={styles.label}>{current ? "Current targets" : "Final targets"}</Text><Text style={styles.body}>{targets(phase.targets)}</Text>
          {!current && <Text style={styles.meta}>{phase.loggedDays ?? 0} days logged during this phase</Text>}
        </Disclosure>;
      })}
    </>}
  </Card>;
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 18, fontWeight: "700" },
  body: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  meta: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  label: { color: colors.text, fontSize: 13, fontWeight: "600" },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metric: { flex: 1, minWidth: 110, gap: 4 },
  value: { color: colors.text, fontSize: 16, fontWeight: "600" },
});
