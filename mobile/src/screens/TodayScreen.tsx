import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { RecentLogsList } from "../components/RecentLogsList";
import { Screen } from "../components/Screen";
import { SegmentedControl } from "../components/SegmentedControl";
import { TextField } from "../components/TextField";
import { getDailyLogByDate, loadRecentDailyLogs, upsertDailyLog } from "../storage/mobileStorage";
import { colors } from "../theme/colors";
import { DailyLog, GoalType, TodayLogDraft, WorkoutType } from "../types/fitness";
import { formatReadableDate, getTodayKey } from "../utils/date";
import { blankTodayDraft, createDailyLogFromDraft, dailyLogToDraft } from "../utils/logDraft";

const goalOptions: { label: string; value: GoalType }[] = [
  { label: "Cut", value: "cut" },
  { label: "Maintain", value: "maintain" },
  { label: "Bulk", value: "bulk" },
];

const workoutTypes: WorkoutType[] = [
  "Push",
  "Pull",
  "Legs",
  "Upper",
  "Lower",
  "Full Body",
  "Cardio",
  "Rest",
  "Other",
];

export function TodayScreen() {
  const [draft, setDraft] = useState<TodayLogDraft>(blankTodayDraft);
  const [existingLog, setExistingLog] = useState<DailyLog | undefined>();
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const todayKey = useMemo(() => getTodayKey(), []);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedLog() {
      try {
        const [savedTodayLog, savedRecentLogs] = await Promise.all([
          getDailyLogByDate(todayKey),
          loadRecentDailyLogs(5),
        ]);

        if (!isMounted) {
          return;
        }

        setExistingLog(savedTodayLog);
        setDraft(dailyLogToDraft(savedTodayLog));
        setRecentLogs(savedRecentLogs);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSavedLog();

    return () => {
      isMounted = false;
    };
  }, [todayKey]);

  function updateDraft<Value extends keyof TodayLogDraft>(
    key: Value,
    value: TodayLogDraft[Value],
  ) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));
  }

  async function saveLog() {
    const dailyLog = createDailyLogFromDraft({
      date: todayKey,
      draft,
      existingLog,
    });

    const updatedLogs = await upsertDailyLog(dailyLog);
    setExistingLog(dailyLog);
    setRecentLogs(updatedLogs.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5));
    setLastSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    Alert.alert("Log saved", "Your daily log was saved on this device.");
  }

  return (
    <Screen
      title="Today"
      subtitle="Log what you know. Blank fields stay blank and will not count against your trends."
    >
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{formatReadableDate(todayKey)}</Text>
          <Text style={styles.cardMeta}>
            {isLoading
              ? "Loading saved log"
              : existingLog
                ? "Editing saved daily log"
                : "New daily check-in"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Current goal</Text>
          <SegmentedControl
            options={goalOptions}
            value={draft.goal}
            onChange={(goal) => updateDraft("goal", goal)}
          />
        </View>

        <View style={styles.grid}>
          <TextField
            keyboardType="decimal-pad"
            label="Weight"
            onChangeText={(value) => updateDraft("weightLbs", value)}
            placeholder="lbs"
            value={draft.weightLbs}
          />
          <TextField
            keyboardType="number-pad"
            label="Calories"
            onChangeText={(value) => updateDraft("calories", value)}
            placeholder="blank"
            value={draft.calories}
          />
          <TextField
            keyboardType="number-pad"
            label="Protein"
            onChangeText={(value) => updateDraft("proteinGrams", value)}
            placeholder="grams"
            value={draft.proteinGrams}
          />
          <TextField
            keyboardType="number-pad"
            label="Steps"
            onChangeText={(value) => updateDraft("steps", value)}
            placeholder="blank"
            value={draft.steps}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Workout type</Text>
          <View style={styles.workoutGrid}>
            {workoutTypes.map((type) => {
              const isSelected = draft.workoutType === type;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={type}
                  onPress={() => updateDraft("workoutType", type)}
                  style={[styles.workoutChip, isSelected && styles.selectedWorkoutChip]}
                >
                  <Text style={[styles.workoutText, isSelected && styles.selectedWorkoutText]}>
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <TextField
          label="Notes"
          multiline
          onChangeText={(value) => updateDraft("notes", value)}
          placeholder="Energy, soreness, form focus, appetite"
          style={styles.notesInput}
          value={draft.notes}
        />

        <Pressable accessibilityRole="button" onPress={saveLog} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>{existingLog ? "Update Today" : "Save Today"}</Text>
        </Pressable>

        {lastSavedAt ? <Text style={styles.savedMeta}>Last saved at {lastSavedAt}</Text> : null}
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent Logs</Text>
          <Text style={styles.cardMeta}>Saved on this device</Text>
        </View>
        <RecentLogsList logs={recentLogs} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    gap: 4,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  cardMeta: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  grid: {
    gap: 12,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  notesInput: {
    minHeight: 92,
    paddingTop: 14,
    textAlignVertical: "top",
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 15,
    minHeight: 54,
    justifyContent: "center",
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "800",
  },
  savedMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  section: {
    gap: 10,
  },
  selectedWorkoutChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectedWorkoutText: {
    color: colors.surface,
  },
  workoutChip: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  workoutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  workoutText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
});
