import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { GoalType, TodayLogDraft, WorkoutType } from "../types/fitness";
import { Card } from "./Card";
import { SegmentedControl } from "./SegmentedControl";
import { TextField } from "./TextField";

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

type LogEditorCardProps = {
  dateLabel: string;
  draft: TodayLogDraft;
  workoutPerformancePreview?: WorkoutPerformancePreview | null;
  statusLabel: string;
  submitLabel: string;
  weightUnit: string;
  footer?: ReactNode;
  onDraftChange: (draft: TodayLogDraft) => void;
  onSubmit: () => void;
};

export type WorkoutPerformancePreview = {
  dateLabel: string;
  workoutType: WorkoutType;
  sessions: number;
  totalOutput: number;
  exercises: string[];
};

export function LogEditorCard({
  dateLabel,
  draft,
  workoutPerformancePreview,
  statusLabel,
  submitLabel,
  weightUnit,
  footer,
  onDraftChange,
  onSubmit,
}: LogEditorCardProps) {
  function updateDraft<Value extends keyof TodayLogDraft>(
    key: Value,
    value: TodayLogDraft[Value],
  ) {
    onDraftChange({
      ...draft,
      [key]: value,
    });
  }

  return (
    <Card>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderCopy}>
          <Text style={styles.eyebrow}>Daily Log</Text>
          <Text style={styles.cardTitle}>{dateLabel}</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
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
        <View style={styles.inputPair}>
          <View style={styles.inputCell}>
            <TextField
              keyboardType="decimal-pad"
              label="Weight"
              onChangeText={(value) => updateDraft("weightLbs", value)}
              placeholder={weightUnit}
              value={draft.weightLbs}
            />
          </View>
          <View style={styles.inputCell}>
            <TextField
              keyboardType="number-pad"
              label="Calories"
              onChangeText={(value) => updateDraft("calories", value)}
              placeholder="blank"
              value={draft.calories}
            />
          </View>
        </View>
        <View style={styles.inputPair}>
          <View style={styles.inputCell}>
            <TextField
              keyboardType="number-pad"
              label="Protein"
              onChangeText={(value) => updateDraft("proteinGrams", value)}
              placeholder="grams"
              value={draft.proteinGrams}
            />
          </View>
          <View style={styles.inputCell}>
            <TextField
              keyboardType="number-pad"
              label="Steps"
              onChangeText={(value) => updateDraft("steps", value)}
              placeholder="blank"
              value={draft.steps}
            />
          </View>
        </View>
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

      {workoutPerformancePreview ? (
        <View style={styles.performanceBox}>
          <View style={styles.performanceHeader}>
            <View style={styles.performanceCopy}>
              <Text style={styles.performanceEyebrow}>
                Last {workoutPerformancePreview.workoutType} Performance
              </Text>
              <Text style={styles.performanceTitle}>
                {workoutPerformancePreview.dateLabel}
              </Text>
              <Text style={styles.performanceMeta}>
                {workoutPerformancePreview.sessions} saved{" "}
                {workoutPerformancePreview.sessions === 1 ? "session" : "sessions"}
              </Text>
            </View>
            <View style={styles.outputPill}>
              <Text style={styles.outputValue}>
                {workoutPerformancePreview.totalOutput.toLocaleString()}
              </Text>
              <Text style={styles.outputLabel}>output</Text>
            </View>
          </View>

          <View style={styles.exerciseList}>
            {workoutPerformancePreview.exercises.map((exercise) => (
              <Text key={exercise} style={styles.exerciseItem}>
                {exercise}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      <TextField
        label="Notes"
        multiline
        onChangeText={(value) => updateDraft("notes", value)}
        placeholder="Energy, soreness, form focus, appetite"
        style={styles.notesInput}
        value={draft.notes}
      />

      <Pressable accessibilityRole="button" onPress={onSubmit} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>{submitLabel}</Text>
      </Pressable>

      {footer}
    </Card>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  cardHeaderCopy: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  exerciseItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    padding: 10,
  },
  exerciseList: {
    gap: 8,
  },
  grid: {
    gap: 12,
  },
  inputCell: {
    flex: 1,
  },
  inputPair: {
    flexDirection: "row",
    gap: 10,
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
  outputLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  outputPill: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 10,
    width: 78,
  },
  outputValue: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "900",
  },
  performanceBox: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 13,
  },
  performanceCopy: {
    flex: 1,
    gap: 3,
  },
  performanceEyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  performanceHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  performanceMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  performanceTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
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
  statusPill: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
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
    backgroundColor: colors.surface,
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
