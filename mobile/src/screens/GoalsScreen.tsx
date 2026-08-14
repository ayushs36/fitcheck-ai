import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { SegmentedControl } from "../components/SegmentedControl";
import { TextField } from "../components/TextField";
import { loadUserSettings, saveUserSettings } from "../storage/mobileStorage";
import { colors } from "../theme/colors";
import { GoalType, UserSettings } from "../types/fitness";
import { parseOptionalNumber } from "../utils/logDraft";
import { formatWeightFromLbs, getWeightUnitLabel, parseWeightToLbs, UnitSystem } from "../utils/units";

type GoalDraft = {
  unitSystem: UnitSystem;
  defaultGoal: GoalType;
  startingWeight: string;
  targetWeight: string;
  weeklyGoalPaceLbs: string;
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

const defaultDraft: GoalDraft = {
  unitSystem: "imperial",
  defaultGoal: "maintain",
  startingWeight: "",
  targetWeight: "",
  weeklyGoalPaceLbs: "",
  calorieTarget: "",
  proteinTarget: "",
  stepTarget: "",
};

function formatOptionalValue(value?: number): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

function settingsToDraft(settings: UserSettings | null): GoalDraft {
  if (!settings) {
    return defaultDraft;
  }

  return {
    unitSystem: settings.unitSystem,
    defaultGoal: settings.defaultGoal,
    startingWeight: formatWeightFromLbs(settings.startingWeightLbs, settings.unitSystem),
    targetWeight: formatWeightFromLbs(settings.targetWeightLbs, settings.unitSystem),
    weeklyGoalPaceLbs: formatWeightFromLbs(settings.weeklyGoalPaceLbs, settings.unitSystem),
    calorieTarget: formatOptionalValue(settings.calorieTarget),
    proteinTarget: formatOptionalValue(settings.proteinTarget),
    stepTarget: formatOptionalValue(settings.stepTarget),
  };
}

function getGoalCopy(goal: GoalType): string {
  if (goal === "cut") {
    return "Use this when the main goal is fat loss. Pace should usually be entered as weight lost per week.";
  }

  if (goal === "bulk") {
    return "Use this when the main goal is muscle gain. Pace should usually be slower than a cut.";
  }

  return "Use this when the main goal is keeping weight stable while training, eating well, and staying active.";
}

export function GoalsScreen() {
  const [draft, setDraft] = useState<GoalDraft>(defaultDraft);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const weightUnit = getWeightUnitLabel(draft.unitSystem);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const savedSettings = await loadUserSettings();
        if (isMounted) {
          setDraft(settingsToDraft(savedSettings));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateDraft<Value extends keyof GoalDraft>(key: Value, value: GoalDraft[Value]) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));
  }

  async function saveGoalSettings() {
    const settings: UserSettings = {
      unitSystem: draft.unitSystem,
      defaultGoal: draft.defaultGoal,
      startingWeightLbs: parseWeightToLbs(draft.startingWeight, draft.unitSystem),
      targetWeightLbs: parseWeightToLbs(draft.targetWeight, draft.unitSystem),
      weeklyGoalPaceLbs: parseWeightToLbs(draft.weeklyGoalPaceLbs, draft.unitSystem),
      calorieTarget: parseOptionalNumber(draft.calorieTarget),
      proteinTarget: parseOptionalNumber(draft.proteinTarget),
      stepTarget: parseOptionalNumber(draft.stepTarget),
      hasCompletedOnboarding: true,
      updatedAt: new Date().toISOString(),
    };

    await saveUserSettings(settings);
    setLastSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    Alert.alert("Goal saved", "Your goal setup was saved on this device.");
  }

  return (
    <Screen
      title="Goals"
      subtitle="Set how FitCheck AI Mobile should interpret your logs for cutting, maintaining, or bulking."
    >
      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>Goal Setup</Text>
          <Text style={styles.body}>{isLoading ? "Loading saved goal" : getGoalCopy(draft.defaultGoal)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Main goal</Text>
          <SegmentedControl
            options={goalOptions}
            value={draft.defaultGoal}
            onChange={(goal) => updateDraft("defaultGoal", goal)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Units</Text>
          <SegmentedControl
            options={unitOptions}
            value={draft.unitSystem}
            onChange={(unitSystem) => updateDraft("unitSystem", unitSystem)}
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
            onChangeText={(value) => updateDraft("weeklyGoalPaceLbs", value)}
            placeholder={draft.defaultGoal === "maintain" ? "0" : `${weightUnit}/week`}
            value={draft.weeklyGoalPaceLbs}
          />
        </View>

        <View style={styles.grid}>
          <TextField
            keyboardType="number-pad"
            label="Calorie target"
            onChangeText={(value) => updateDraft("calorieTarget", value)}
            placeholder="cal/day"
            value={draft.calorieTarget}
          />
          <TextField
            keyboardType="number-pad"
            label="Protein target"
            onChangeText={(value) => updateDraft("proteinTarget", value)}
            placeholder="g/day"
            value={draft.proteinTarget}
          />
          <TextField
            keyboardType="number-pad"
            label="Step target"
            onChangeText={(value) => updateDraft("stepTarget", value)}
            placeholder="steps/day"
            value={draft.stepTarget}
          />
        </View>

        <Pressable accessibilityRole="button" onPress={saveGoalSettings} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Goal Setup</Text>
        </Pressable>

        {lastSavedAt ? <Text style={styles.savedMeta}>Last saved at {lastSavedAt}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.title}>How this is used</Text>
        <Text style={styles.body}>
          New daily logs can use this saved goal as their default. Future progress screens will use
          these targets to compare your actual logs against your selected goal.
        </Text>
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
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
});
