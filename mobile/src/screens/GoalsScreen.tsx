import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { SegmentedControl } from "../components/SegmentedControl";
import { TextField } from "../components/TextField";
import { loadUserSettings, saveUserSettings } from "../storage/mobileStorage";
import { colors } from "../theme/colors";
import { GoalType, UserSettings } from "../types/fitness";
import { parseOptionalNumber } from "../utils/logDraft";
import { getProteinTarget } from "../utils/proteinTargets";
import {
  convertWeightFromLbs,
  formatWeightFromLbs,
  getWeightUnitLabel,
  parseWeightToLbs,
  UnitSystem,
} from "../utils/units";

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

function getStepSuggestion(goal: GoalType): number {
  if (goal === "cut") {
    return 10000;
  }

  if (goal === "bulk") {
    return 8000;
  }

  return 9000;
}

function formatPaceRange(lowLbs: number, highLbs: number, unitSystem: UnitSystem): string {
  const unit = getWeightUnitLabel(unitSystem);
  const low = Math.round(convertWeightFromLbs(lowLbs, unitSystem) * 10) / 10;
  const high = Math.round(convertWeightFromLbs(highLbs, unitSystem) * 10) / 10;
  return `${low}-${high} ${unit}/week`;
}

function getPaceSuggestion(
  goal: GoalType,
  bodyWeightLbs: number | undefined,
  unitSystem: UnitSystem,
): string {
  if (!bodyWeightLbs || bodyWeightLbs <= 0) {
    return goal === "maintain"
      ? `Aim to keep weekly change close to 0 ${getWeightUnitLabel(unitSystem)}/week.`
      : "Add bodyweight to estimate a realistic weekly pace.";
  }

  if (goal === "cut") {
    return `A reasonable cut is about ${formatPaceRange(
      bodyWeightLbs * 0.005,
      bodyWeightLbs * 0.01,
      unitSystem,
    )}.`;
  }

  if (goal === "bulk") {
    return `A controlled bulk is about ${formatPaceRange(
      bodyWeightLbs * 0.0025,
      bodyWeightLbs * 0.005,
      unitSystem,
    )}.`;
  }

  return `Maintenance should stay near 0 ${getWeightUnitLabel(
    unitSystem,
  )}/week, with small normal fluctuations.`;
}

function getCalorieSuggestion(goal: GoalType): string {
  if (goal === "cut") {
    return "Set calories after 1-2 weeks of logs so FitCheck can compare intake to weight trend.";
  }

  if (goal === "bulk") {
    return "Start calories from your real intake trend, then add only a small surplus if weight and training stall.";
  }

  return "Use recent intake and stable weight trend to estimate maintenance before changing calories.";
}

export function GoalsScreen() {
  const [draft, setDraft] = useState<GoalDraft>(defaultDraft);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const weightUnit = getWeightUnitLabel(draft.unitSystem);
  const targetCoach = useMemo(() => {
    const referenceWeightLbs =
      parseWeightToLbs(draft.startingWeight, draft.unitSystem) ??
      parseWeightToLbs(draft.targetWeight, draft.unitSystem);
    const proteinTarget = getProteinTarget(draft.defaultGoal, referenceWeightLbs ?? 0);
    const stepTarget = getStepSuggestion(draft.defaultGoal);

    return {
      proteinTarget,
      stepTarget,
      pace: getPaceSuggestion(draft.defaultGoal, referenceWeightLbs, draft.unitSystem),
      calories: getCalorieSuggestion(draft.defaultGoal),
    };
  }, [draft.defaultGoal, draft.startingWeight, draft.targetWeight, draft.unitSystem]);

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

  function useSuggestedTargets() {
    setDraft((currentDraft) => ({
      ...currentDraft,
      proteinTarget: String(targetCoach.proteinTarget.target),
      stepTarget: String(targetCoach.stepTarget),
    }));
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
        <View style={styles.header}>
          <Text style={styles.title}>Target Coach</Text>
          <Text style={styles.body}>
            FitCheck uses weekly logged averages, so one imperfect day is okay if the week
            stays on target.
          </Text>
        </View>

        <View style={styles.targetGrid}>
          <View style={styles.targetItem}>
            <Text style={styles.targetLabel}>Protein</Text>
            <Text style={styles.targetValue}>{targetCoach.proteinTarget.range}</Text>
            <Text style={styles.targetMeta}>
              Suggested target: {targetCoach.proteinTarget.target}g/day
            </Text>
          </View>
          <View style={styles.targetItem}>
            <Text style={styles.targetLabel}>Steps</Text>
            <Text style={styles.targetValue}>{targetCoach.stepTarget.toLocaleString()}</Text>
            <Text style={styles.targetMeta}>Weekly average target</Text>
          </View>
        </View>

        <View style={styles.coachNote}>
          <Text style={styles.coachNoteLabel}>Pace</Text>
          <Text style={styles.coachNoteText}>{targetCoach.pace}</Text>
        </View>

        <View style={styles.coachNote}>
          <Text style={styles.coachNoteLabel}>Calories</Text>
          <Text style={styles.coachNoteText}>{targetCoach.calories}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={useSuggestedTargets}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Use Suggested Protein + Steps</Text>
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
  coachNote: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  coachNoteLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  coachNoteText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
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
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    minHeight: 50,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  targetGrid: {
    flexDirection: "row",
    gap: 10,
  },
  targetItem: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 12,
  },
  targetLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  targetMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  targetValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
});
