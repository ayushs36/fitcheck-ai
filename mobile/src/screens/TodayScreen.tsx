import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { SegmentedControl } from "../components/SegmentedControl";
import { TextField } from "../components/TextField";
import { upsertDailyLog } from "../storage/mobileStorage";
import { colors } from "../theme/colors";
import { DailyLog, GoalType, TodayLogDraft, WorkoutType } from "../types/fitness";
import { formatReadableDate, getTodayKey } from "../utils/date";

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

const blankDraft: TodayLogDraft = {
  goal: "maintain",
  weightLbs: "",
  calories: "",
  proteinGrams: "",
  steps: "",
  workoutType: "Rest",
  notes: "",
};

function parseOptionalNumber(value: string): number | undefined {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return undefined;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

export function TodayScreen() {
  const [draft, setDraft] = useState<TodayLogDraft>(blankDraft);
  const todayKey = useMemo(() => getTodayKey(), []);

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
    const now = new Date().toISOString();
    const dailyLog: DailyLog = {
      id: todayKey,
      date: todayKey,
      goal: draft.goal,
      weightLbs: parseOptionalNumber(draft.weightLbs),
      calories: parseOptionalNumber(draft.calories),
      proteinGrams: parseOptionalNumber(draft.proteinGrams),
      steps: parseOptionalNumber(draft.steps),
      workoutType: draft.workoutType,
      notes: draft.notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    await upsertDailyLog(dailyLog);
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
          <Text style={styles.cardMeta}>Daily check-in</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Current goal</Text>
          <SegmentedControl options={goalOptions} value={draft.goal} onChange={(goal) => updateDraft("goal", goal)} />
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
          <Text style={styles.saveButtonText}>Save Today</Text>
        </Pressable>
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
