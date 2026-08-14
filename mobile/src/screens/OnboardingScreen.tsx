import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { SegmentedControl } from "../components/SegmentedControl";
import { TextField } from "../components/TextField";
import { saveUserSettings } from "../storage/mobileStorage";
import { colors } from "../theme/colors";
import { GoalType, UserSettings } from "../types/fitness";
import { parseOptionalNumber } from "../utils/logDraft";
import { getWeightUnitLabel, parseWeightToLbs, UnitSystem } from "../utils/units";

type OnboardingScreenProps = {
  onComplete: (settings: UserSettings) => void;
};

type OnboardingDraft = {
  unitSystem: UnitSystem;
  defaultGoal: GoalType;
  startingWeight: string;
  targetWeight: string;
  weeklyGoalPace: string;
  calorieTarget: string;
  proteinTarget: string;
  stepTarget: string;
};

const goalOptions: { label: string; value: GoalType }[] = [
  { label: "Cut", value: "cut" },
  { label: "Maintain", value: "maintain" },
  { label: "Bulk", value: "bulk" },
];

const unitOptions: { label: string; value: UnitSystem }[] = [
  { label: "Imperial", value: "imperial" },
  { label: "Metric", value: "metric" },
];

const initialDraft: OnboardingDraft = {
  unitSystem: "imperial",
  defaultGoal: "maintain",
  startingWeight: "",
  targetWeight: "",
  weeklyGoalPace: "",
  calorieTarget: "",
  proteinTarget: "",
  stepTarget: "",
};

function getGoalIntro(goal: GoalType): string {
  if (goal === "cut") {
    return "FitCheck will judge progress against fat-loss pace, calories, protein, steps, and training consistency.";
  }

  if (goal === "bulk") {
    return "FitCheck will favor controlled weight gain, enough food, and progressive training without rushing the scale.";
  }

  return "FitCheck will prioritize stable weight, consistent habits, and training quality while you maintain.";
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [draft, setDraft] = useState(initialDraft);
  const weightUnit = getWeightUnitLabel(draft.unitSystem);

  function updateDraft<Value extends keyof OnboardingDraft>(
    key: Value,
    value: OnboardingDraft[Value],
  ) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));
  }

  async function completeOnboarding() {
    const settings: UserSettings = {
      unitSystem: draft.unitSystem,
      defaultGoal: draft.defaultGoal,
      startingWeightLbs: parseWeightToLbs(draft.startingWeight, draft.unitSystem),
      targetWeightLbs: parseWeightToLbs(draft.targetWeight, draft.unitSystem),
      weeklyGoalPaceLbs: parseWeightToLbs(draft.weeklyGoalPace, draft.unitSystem),
      calorieTarget: parseOptionalNumber(draft.calorieTarget),
      proteinTarget: parseOptionalNumber(draft.proteinTarget),
      stepTarget: parseOptionalNumber(draft.stepTarget),
      hasCompletedOnboarding: true,
      updatedAt: new Date().toISOString(),
    };

    await saveUserSettings(settings);
    onComplete(settings);
  }

  return (
    <Screen
      title="Set Up FitCheck"
      subtitle="Start with the basics so the app can interpret your logs around your current goal."
    >
      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>Your coaching setup</Text>
          <Text style={styles.body}>{getGoalIntro(draft.defaultGoal)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Units</Text>
          <SegmentedControl
            options={unitOptions}
            value={draft.unitSystem}
            onChange={(unitSystem) => updateDraft("unitSystem", unitSystem)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Main goal</Text>
          <SegmentedControl
            options={goalOptions}
            value={draft.defaultGoal}
            onChange={(goal) => updateDraft("defaultGoal", goal)}
          />
        </View>

        <View style={styles.grid}>
          <TextField
            keyboardType="decimal-pad"
            label="Starting weight"
            onChangeText={(value) => updateDraft("startingWeight", value)}
            placeholder={weightUnit}
            value={draft.startingWeight}
          />
          <TextField
            keyboardType="decimal-pad"
            label="Target weight"
            onChangeText={(value) => updateDraft("targetWeight", value)}
            placeholder={draft.defaultGoal === "maintain" ? "optional" : weightUnit}
            value={draft.targetWeight}
          />
          <TextField
            keyboardType="decimal-pad"
            label="Weekly pace"
            onChangeText={(value) => updateDraft("weeklyGoalPace", value)}
            placeholder={draft.defaultGoal === "maintain" ? "optional" : `${weightUnit}/week`}
            value={draft.weeklyGoalPace}
          />
        </View>

        <View style={styles.grid}>
          <TextField
            keyboardType="number-pad"
            label="Calorie target"
            onChangeText={(value) => updateDraft("calorieTarget", value)}
            placeholder="optional"
            value={draft.calorieTarget}
          />
          <TextField
            keyboardType="number-pad"
            label="Protein target"
            onChangeText={(value) => updateDraft("proteinTarget", value)}
            placeholder="optional"
            value={draft.proteinTarget}
          />
          <TextField
            keyboardType="number-pad"
            label="Step target"
            onChangeText={(value) => updateDraft("stepTarget", value)}
            placeholder="optional"
            value={draft.stepTarget}
          />
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>Blank fields are okay</Text>
          <Text style={styles.noteBody}>
            FitCheck skips missing values instead of counting them as zero, so partial logs will not
            hurt your averages or trends.
          </Text>
        </View>

        <Pressable accessibilityRole="button" onPress={completeOnboarding} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Start Logging</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  grid: {
    gap: 12,
  },
  header: {
    gap: 6,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  note: {
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    gap: 6,
    padding: 14,
  },
  noteBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  noteTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 15,
    minHeight: 54,
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "800",
  },
  section: {
    gap: 10,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
});
