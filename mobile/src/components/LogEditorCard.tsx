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
  statusLabel: string;
  submitLabel: string;
  footer?: ReactNode;
  onDraftChange: (draft: TodayLogDraft) => void;
  onSubmit: () => void;
};

export function LogEditorCard({
  dateLabel,
  draft,
  statusLabel,
  submitLabel,
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
        <Text style={styles.cardTitle}>{dateLabel}</Text>
        <Text style={styles.cardMeta}>{statusLabel}</Text>
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

      <Pressable accessibilityRole="button" onPress={onSubmit} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>{submitLabel}</Text>
      </Pressable>

      {footer}
    </Card>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    gap: 4,
  },
  cardMeta: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  cardTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
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
