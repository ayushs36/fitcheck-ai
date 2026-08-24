import { useEffect, useState } from "react";
import { Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import {
  clearMobileData,
  loadMobileDataBackup,
  MobileDataBackup,
  restoreMobileDataBackup,
} from "../storage/mobileStorage";
import { colors } from "../theme/colors";
import { GoalType, UserSettings } from "../types/fitness";
import { getWeightUnitLabel } from "../utils/units";

type DataSnapshot = {
  dailyLogCount: number;
  workoutCount: number;
  settings: UserSettings | null;
  latestLogDate?: string;
  latestWorkoutDate?: string;
};

type SettingsScreenProps = {
  onDataReset?: () => void;
};

function goalLabel(goal: GoalType | undefined): string {
  if (goal === "cut") {
    return "Cutting";
  }

  if (goal === "bulk") {
    return "Bulking";
  }

  if (goal === "maintain") {
    return "Maintaining";
  }

  return "Not set";
}

function createSnapshot(backup: MobileDataBackup): DataSnapshot {
  const latestLogDate = backup.logs
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.date;
  const latestWorkoutDate = backup.workouts
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.date;

  return {
    dailyLogCount: backup.logs.length,
    workoutCount: backup.workouts.length,
    settings: backup.settings,
    latestLogDate,
    latestWorkoutDate,
  };
}

function parseBackupText(value: string): MobileDataBackup | null {
  try {
    const parsedBackup = JSON.parse(value);

    if (
      !parsedBackup ||
      !Array.isArray(parsedBackup.logs) ||
      !Array.isArray(parsedBackup.workouts) ||
      !("settings" in parsedBackup)
    ) {
      return null;
    }

    return {
      exportedAt:
        typeof parsedBackup.exportedAt === "string"
          ? parsedBackup.exportedAt
          : new Date().toISOString(),
      logs: parsedBackup.logs,
      workouts: parsedBackup.workouts,
      settings: parsedBackup.settings ?? null,
    };
  } catch {
    return null;
  }
}

export function SettingsScreen({ onDataReset }: SettingsScreenProps) {
  const [snapshot, setSnapshot] = useState<DataSnapshot>({
    dailyLogCount: 0,
    workoutCount: 0,
    settings: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [restoreText, setRestoreText] = useState("");
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  async function refreshSnapshot() {
    const backup = await loadMobileDataBackup();
    setSnapshot(createSnapshot(backup));
    setIsLoading(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadSnapshot() {
      const backup = await loadMobileDataBackup();
      if (isMounted) {
        setSnapshot(createSnapshot(backup));
        setIsLoading(false);
      }
    }

    loadSnapshot();

    return () => {
      isMounted = false;
    };
  }, []);

  async function exportData() {
    const backup = await loadMobileDataBackup();
    const message = JSON.stringify(backup, null, 2);

    await Share.share({
      title: "FitCheck AI Mobile Backup",
      message,
    });
  }

  function confirmReset() {
    Alert.alert(
      "Reset mobile data?",
      "This clears logs, workouts, and settings stored on this device. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await clearMobileData();
            await refreshSnapshot();
            onDataReset?.();
          },
        },
      ],
    );
  }

  function confirmRestore() {
    const parsedBackup = parseBackupText(restoreText);

    if (!parsedBackup) {
      setRestoreStatus("Paste a valid FitCheck AI Mobile backup JSON first.");
      Alert.alert("Invalid backup", "This does not look like a FitCheck AI Mobile backup.");
      return;
    }

    Alert.alert(
      "Restore backup?",
      `This will replace local mobile data with ${parsedBackup.logs.length} daily logs and ${parsedBackup.workouts.length} workouts from the pasted backup.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            await restoreMobileDataBackup(parsedBackup);
            await refreshSnapshot();
            setRestoreText("");
            setRestoreStatus("Backup restored on this device.");

            if (!parsedBackup.settings?.hasCompletedOnboarding) {
              onDataReset?.();
            }
          },
        },
      ],
    );
  }

  const settings = snapshot.settings;
  const unitLabel = settings ? getWeightUnitLabel(settings.unitSystem) : "Not set";

  return (
    <Screen
      title="Settings"
      subtitle="Manage local data, privacy, and app preferences for FitCheck AI Mobile."
    >
      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>App Preferences</Text>
          <Text style={styles.body}>
            Your active goal and units shape how progress screens interpret logs.
          </Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Goal</Text>
            <Text style={styles.summaryValue}>{goalLabel(settings?.defaultGoal)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Weight Unit</Text>
            <Text style={styles.summaryValue}>{unitLabel}</Text>
          </View>
        </View>

        <Text style={styles.helperText}>Change goal details from the Goals tab.</Text>
      </Card>

      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>Local Data</Text>
          <Text style={styles.body}>
            {isLoading
              ? "Loading what is saved on this device."
              : "Your logs are stored locally on this device."}
          </Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Daily Logs</Text>
            <Text style={styles.summaryValue}>{snapshot.dailyLogCount}</Text>
            <Text style={styles.summaryMeta}>{snapshot.latestLogDate ?? "No logs yet"}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Workouts</Text>
            <Text style={styles.summaryValue}>{snapshot.workoutCount}</Text>
            <Text style={styles.summaryMeta}>{snapshot.latestWorkoutDate ?? "No workouts yet"}</Text>
          </View>
        </View>

        <Pressable accessibilityRole="button" onPress={exportData} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Export Local Backup</Text>
        </Pressable>
      </Card>

      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>Restore Backup</Text>
          <Text style={styles.body}>
            Paste a FitCheck AI Mobile backup JSON to restore logs, workouts, and settings on
            this device.
          </Text>
        </View>

        <TextField
          label="Backup JSON"
          multiline
          onChangeText={setRestoreText}
          placeholder="Paste exported backup here"
          style={styles.restoreInput}
          value={restoreText}
        />

        <Pressable
          accessibilityRole="button"
          onPress={confirmRestore}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Restore From Backup</Text>
        </Pressable>

        {restoreStatus ? <Text style={styles.restoreStatus}>{restoreStatus}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.title}>Private By Default</Text>
        <Text style={styles.body}>
          The mobile app stores fitness logs on-device and does not include an OpenAI API key in
          the public client.
        </Text>
      </Card>

      <Card>
        <Text style={styles.title}>Reset App</Text>
        <Text style={styles.body}>
          Clear local mobile data if you want to restart setup, test onboarding, or remove logs
          from this device.
        </Text>
        <Pressable accessibilityRole="button" onPress={confirmReset} style={styles.dangerButton}>
          <Text style={styles.dangerButtonText}>Reset Local Data</Text>
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
  dangerButton: {
    alignItems: "center",
    borderColor: colors.danger,
    borderRadius: 15,
    borderWidth: 1,
    minHeight: 52,
    justifyContent: "center",
  },
  dangerButtonText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "800",
  },
  header: {
    gap: 6,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 15,
    minHeight: 52,
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "800",
  },
  restoreInput: {
    minHeight: 120,
    paddingTop: 14,
    textAlignVertical: "top",
  },
  restoreStatus: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    minHeight: 52,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 10,
  },
  summaryItem: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 12,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  summaryMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  summaryValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
});
