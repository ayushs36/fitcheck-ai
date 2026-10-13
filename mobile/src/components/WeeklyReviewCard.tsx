import { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { DailyLog, UserSettings, WeeklyReviewDecision } from "../types/fitness";
import { useMobileStorage } from "../storage/StorageProvider";
import { buildWeeklyReview, recordWeeklyDecision, reviewFollowUp } from "../utils/weeklyReview";
import { formatReadableDate, getTodayKey } from "../utils/date";
import { formatWeightFromLbs, getWeightUnitLabel } from "../utils/units";
import { colors } from "../theme/colors";
import { Card } from "./Card";
import { Disclosure } from "./Disclosure";

export function WeeklyReviewCard({ logs, settings, onSaved }: {
  logs: DailyLog[]; settings: UserSettings | null; onSaved: (settings: UserSettings) => void;
}) {
  const storage = useMobileStorage();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const today = getTodayKey();
  const review = buildWeeklyReview(logs, settings, today);
  const decision = settings?.weeklyReviews?.find(item => item.id === review.id);
  const past = [...(settings?.weeklyReviews ?? [])].reverse();
  const pending = past.find(item => item.status === "accepted" && !item.outcome && reviewFollowUp(item, logs, today).ready);
  const follow = pending ? reviewFollowUp(pending, logs, today) : undefined;
  const unitSystem = settings?.unitSystem ?? "imperial";
  const unit = getWeightUnitLabel(unitSystem);
  function changeText(value: number) {
    return `${formatWeightFromLbs(Math.abs(value), unitSystem)} ${unit} ${Math.abs(value) < 0.05 ? "change" : value > 0 ? "higher" : "lower"}`;
  }
  async function save(status?: WeeklyReviewDecision["status"], outcome?: WeeklyReviewDecision["outcome"]) {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try {
      const current = await storage.loadUserSettings();
      if (!current) throw new Error("Save your goal setup first.");
      const now = new Date().toISOString();
      if (status && buildWeeklyReview(logs, current, today).id !== review.id) throw new Error("Your phase changed. Reopen Progress for an updated review.");
      const next = status ? recordWeeklyDecision(current, review, status, now) : {
        ...current, updatedAt: now, weeklyReviews: current.weeklyReviews?.map(item => item.id === pending?.id ? { ...item, outcome } : item),
      };
      await storage.saveUserSettings(next, current);
      onSaved(next);
    } catch (error) { Alert.alert("Review not saved", error instanceof Error ? error.message : "Please try again."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Card>
    <Text style={styles.title}>Last completed week</Text>
    <Text style={styles.meta}>{formatReadableDate(review.start)} - {formatReadableDate(review.end)}</Text>
    <Text style={styles.status}>{review.confidence}</Text>
    <Text style={styles.body}>{review.change !== undefined
      ? `Your completed-week average was ${changeText(review.change)} than the completed week before it.`
      : "There are not enough weigh-ins in both weeks to compare your weight trend yet."}</Text>
    <Text style={styles.meta}>{review.recent.count}/7 weigh-ins in this completed week · {review.prior.count}/7 in the prior week. Missing values are skipped.</Text>
    <View style={styles.action}>
      <Text style={styles.label}>One focus for this week</Text>
      <Text style={styles.body}>{decision?.action ?? review.action}</Text>
      {decision && <Text style={styles.status}>{decision.status === "accepted" ? "Accepted · follow-up after seven full days" : "Dismissed for this week"}</Text>}
      <View style={styles.buttons}>
        <Pressable accessibilityRole="button" disabled={busy || !settings || decision?.status === "accepted"}
          onPress={() => void save("accepted")} style={[styles.button, decision?.status === "accepted" && styles.disabled]}>
          <Text style={styles.link}>{decision?.status === "accepted" ? "Accepted" : "Accept focus"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={busy || !settings || decision?.status === "dismissed"}
          onPress={() => void save("dismissed")} style={[styles.button, decision?.status === "dismissed" && styles.disabled]}>
          <Text style={styles.link}>Dismiss</Text>
        </Pressable>
      </View>
      {!settings && <Text style={styles.meta}>Save a goal setup to keep review decisions.</Text>}
    </View>
    {pending && follow && <View style={styles.follow}>
      <Text style={styles.label}>Follow-up</Text>
      <Text style={styles.body}>{pending.action}</Text>
      <Text style={styles.meta}>{formatReadableDate(follow.start)} - {formatReadableDate(follow.end)}</Text>
      <Text style={styles.body}>{follow.change !== undefined
        ? `Average weight was ${changeText(follow.change)} than your saved baseline. This comparison does not establish what caused the change.`
        : "Not enough weigh-ins to compare averages. You can still record how this focus worked for you."}</Text>
      {pending.phaseId !== review.phaseId && <Text style={styles.meta}>This focus belongs to a previous goal phase.</Text>}
      <View style={styles.buttons}>
        {([{ value: "helped", label: "Helpful" }, { value: "notYet", label: "Not yet" }, { value: "skipped", label: "Didn't try" }] as const).map(item =>
          <Pressable key={item.value} accessibilityRole="button" style={styles.button} disabled={busy} onPress={() => void save(undefined, item.value)}>
            <Text style={styles.link}>{item.label}</Text>
          </Pressable>)}
      </View>
    </View>}
    <Disclosure title="Review history">
      {past.length === 0 && <Text style={styles.meta}>Your saved decisions will appear here.</Text>}
      {past.map(item => <View key={item.id} style={styles.follow}>
        <Text style={styles.label}>{formatReadableDate(item.baselineEnd)} · {item.goal}</Text>
        <Text style={styles.body}>{item.action}</Text>
        <Text style={styles.meta}>{item.status === "accepted" ? "Accepted" : "Dismissed"}{item.outcome ? ` · ${item.outcome === "helped" ? "Helpful" : item.outcome === "notYet" ? "Not yet" : "Didn't try"}` : ""}</Text>
      </View>)}
    </Disclosure>
  </Card>;
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 20, fontWeight: "700" },
  label: { color: colors.text, fontSize: 15, fontWeight: "600" },
  body: { color: colors.text, fontSize: 15, lineHeight: 22 },
  meta: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  status: { color: colors.success, fontSize: 13, fontWeight: "600" },
  action: { borderLeftWidth: 3, borderLeftColor: colors.success, paddingLeft: 12, gap: 10 },
  follow: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingTop: 12, gap: 8 },
  buttons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: { minHeight: 44, justifyContent: "center", paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.primarySoft },
  link: { color: colors.primary, fontSize: 14, fontWeight: "600" },
  disabled: { opacity: 0.5 },
});
