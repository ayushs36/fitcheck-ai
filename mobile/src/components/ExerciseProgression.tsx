import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useMobileStorage } from "../storage/StorageProvider";
import type { ExerciseTarget, WorkoutSession } from "../types/fitness";
import { buildExerciseProgression, exerciseKey, saveExerciseTarget } from "../utils/exerciseProgression";
import { formatReadableDate } from "../utils/date";
import { formatWeightFromLbs, getWeightUnitLabel, parseWeightToLbs, type UnitSystem } from "../utils/units";
import { colors } from "../theme/colors";
import { Disclosure } from "./Disclosure";
import { SegmentedControl } from "./SegmentedControl";
import { TextField } from "./TextField";

export function ExerciseProgression({ name, sessions, unitSystem, beforeDate }: {
  name: string; sessions: WorkoutSession[]; unitSystem: UnitSystem; beforeDate?: string;
}) {
  const storage = useMobileStorage();
  const [mode, setMode] = useState<ExerciseTarget["mode"]>("weighted");
  const [reps, setReps] = useState("");
  const [load, setLoad] = useState("");
  const [saved, setSaved] = useState<ExerciseTarget>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const key = exerciseKey(name, mode);
  const result = useMemo(() => buildExerciseProgression(sessions, name, mode, beforeDate), [sessions, name, mode, beforeDate]);
  const unit = getWeightUnitLabel(unitSystem);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(undefined); setSaved(undefined); setReps(""); setLoad("");
    storage.loadUserSettings().then(settings => {
      if (!active) return;
      const target = settings?.exerciseTargets?.find(item => item.key === key);
      setSaved(target); setReps(target ? String(target.reps) : "");
      setLoad(formatWeightFromLbs(target?.weightLbs, unitSystem));
    }).catch(() => { if (active) setError("Targets could not be loaded. Reopen this exercise to retry."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [key, unitSystem, storage]);
  async function save(remove = false) {
    if (busy || loading || error) return;
    setBusy(true);
    try {
      const previous = await storage.loadUserSettings();
      if (!previous) throw new Error("Save your goal setup first.");
      const target: ExerciseTarget = { key, name: name.trim(), mode, reps: Number(reps),
        ...(mode === "weighted" ? { weightLbs: parseWeightToLbs(load, unitSystem) } : {}) };
      const next = { ...previous, updatedAt: new Date().toISOString(), exerciseTargets: remove
        ? (previous.exerciseTargets ?? []).filter(item => item.key !== key)
        : saveExerciseTarget(previous.exerciseTargets ?? [], target) };
      await storage.saveUserSettings(next, previous);
      setSaved(remove ? undefined : target);
      if (remove) { setReps(""); setLoad(""); }
    } catch (failure) { Alert.alert("Target not saved", failure instanceof Error ? failure.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <Disclosure title="History & next-session target">
    <SegmentedControl value={mode} onChange={setMode} options={[{ label: "Weighted", value: "weighted" }, { label: "Bodyweight", value: "bodyweight" }]} />
    {saved && <Text style={styles.value}>Your target: {saved.reps} reps{mode === "weighted" ? ` at ${formatWeightFromLbs(saved.weightLbs, unitSystem)} ${unit}` : " at bodyweight"}</Text>}
    <Text style={styles.body}>Targets are optional and never mark a set as completed.</Text>
    {error && <Text accessibilityRole="alert" style={styles.body}>{error}</Text>}
    <View style={styles.row}>
      <TextField containerStyle={styles.field} label="Rep target" keyboardType="number-pad" value={reps} onChangeText={setReps} placeholder="Reps" />
      {mode === "weighted" && <TextField containerStyle={styles.field} label={`Load (${unit})`} keyboardType="decimal-pad" value={load} onChangeText={setLoad} placeholder={unit} />}
    </View>
    {result.suggestion && <>
      <Text style={styles.body}>Optional next step: {result.suggestion.reps} reps{mode === "weighted" ? ` at ${formatWeightFromLbs(result.suggestion.weightLbs, unitSystem)} ${unit}` : " at bodyweight"}. One more rep than your best comparable set last session, only if comfortable with your form.</Text>
      <Pressable accessibilityRole="button" style={styles.button} disabled={busy || loading} onPress={() => {
        setReps(String(result.suggestion!.reps)); setLoad(formatWeightFromLbs(result.suggestion!.weightLbs, unitSystem));
      }}><Text style={styles.link}>Use suggested target</Text></Pressable>
    </>}
    <View style={styles.row}>
      <Pressable accessibilityRole="button" style={styles.button} disabled={busy || loading || !!error} onPress={() => void save()}><Text style={styles.link}>{busy ? "Saving..." : "Save target"}</Text></Pressable>
      {saved && <Pressable accessibilityRole="button" style={styles.button} disabled={busy || loading || !!error} onPress={() => void save(true)}><Text style={styles.link}>Clear target</Text></Pressable>}
    </View>
    <Text style={styles.value}>Comparable records</Text>
    <Text style={styles.body}>Best reps at the same load. Warm-ups and form-focus sets are excluded. Bodyweight comparisons do not account for changes in body weight.</Text>
    {result.records.length ? result.records.slice(0, 5).map(record => <Text key={record.load} style={styles.value}>
      {record.reps} reps {mode === "weighted" ? `at ${formatWeightFromLbs(record.load, unitSystem)} ${unit}` : "at bodyweight"} · {formatReadableDate(record.date)}
    </Text>) : <Text style={styles.body}>No comparable working sets yet.</Text>}
    <Disclosure title={`Session history (${result.history.length})`}>
      {result.history.length === 0 && <Text style={styles.body}>Saved sessions for this exercise will appear here.</Text>}
      {result.history.map(session => <View key={session.sessionId} style={styles.history}>
        <Text style={styles.value}>{formatReadableDate(session.date)} · {session.type}</Text>
        {session.sets.map((set, index) => <Text key={`${set.id}-${index}`} style={styles.body}>
          {set.reps} reps{mode === "weighted" ? ` at ${formatWeightFromLbs(set.weightLbs, unitSystem) || "?"} ${unit}` : " at bodyweight"}
          {set.isWarmup ? " · Warm-up" : set.formFocus ? " · Form focus" : " · Working"}
        </Text>)}
      </View>)}
    </Disclosure>
  </Disclosure>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  field: { flex: 1, minWidth: 100 },
  body: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  value: { color: colors.text, fontSize: 14, fontWeight: "600", lineHeight: 20 },
  button: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12, backgroundColor: colors.primarySoft, borderRadius: 8 },
  link: { color: colors.primary, fontSize: 14, fontWeight: "600" },
  history: { paddingVertical: 10, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
});
