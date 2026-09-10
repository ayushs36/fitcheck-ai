import { useEffect, useState } from "react";
import { Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import {
  clearMobileAccount,
  clearMobileData,
  loadMobileDataBackup,
  MobileDataBackup,
  restoreMobileDataBackup,
  saveMobileAccount,
} from "../storage/mobileStorage";
import { colors } from "../theme/colors";
import { GoalType, MobileAccount, UserSettings } from "../types/fitness";
import { getWeightUnitLabel } from "../utils/units";

type DataSnapshot = {
  dailyLogCount: number;
  workoutCount: number;
  settings: UserSettings | null;
  account: MobileAccount | null;
  latestLogDate?: string;
  latestWorkoutDate?: string;
};

type SettingsScreenProps = {
  onAccountSignedOut?: () => void;
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
    account: backup.account,
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
      account: parsedBackup.account ?? null,
    };
  } catch {
    return null;
  }
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function SettingsScreen({
  onAccountSignedOut,
  onDataReset,
}: SettingsScreenProps) {
  const [snapshot, setSnapshot] = useState<DataSnapshot>({
    dailyLogCount: 0,
    workoutCount: 0,
    settings: null,
    account: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [restoreText, setRestoreText] = useState("");
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [accountNameDraft, setAccountNameDraft] = useState("");
  const [accountEmailDraft, setAccountEmailDraft] = useState("");
  const [accountStatus, setAccountStatus] = useState<string | null>(null);

  async function refreshSnapshot() {
    const backup = await loadMobileDataBackup();
    const nextSnapshot = createSnapshot(backup);
    setSnapshot(nextSnapshot);
    setAccountNameDraft(nextSnapshot.account?.displayName ?? "");
    setAccountEmailDraft(nextSnapshot.account?.email ?? "");
    setIsLoading(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadSnapshot() {
      const backup = await loadMobileDataBackup();
      if (isMounted) {
        const nextSnapshot = createSnapshot(backup);
        setSnapshot(nextSnapshot);
        setAccountNameDraft(nextSnapshot.account?.displayName ?? "");
        setAccountEmailDraft(nextSnapshot.account?.email ?? "");
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
      title: "FitCheck Coach Backup",
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
      setRestoreStatus("Paste a valid FitCheck Coach backup JSON first.");
      Alert.alert("Invalid backup", "This does not look like a FitCheck Coach backup.");
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

  async function saveAccountProfile() {
    const cleanName = accountNameDraft.trim();
    const cleanEmail = accountEmailDraft.trim().toLowerCase();

    if (!snapshot.account) {
      setAccountStatus("Create an account again to edit profile details.");
      return;
    }

    if (!cleanName) {
      Alert.alert("Name required", "Add a name before saving your account.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      Alert.alert("Email required", "Add a valid email before saving your account.");
      return;
    }

    await saveMobileAccount({
      ...snapshot.account,
      displayName: cleanName,
      email: cleanEmail,
      updatedAt: new Date().toISOString(),
    });
    await refreshSnapshot();
    setAccountStatus("Account updated on this device.");
  }

  function confirmSignOut() {
    Alert.alert(
      "Sign out?",
      "This removes the local account from this device but keeps your logs and workouts saved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          onPress: async () => {
            await clearMobileAccount();
            onAccountSignedOut?.();
          },
        },
      ],
    );
  }

  const settings = snapshot.settings;
  const account = snapshot.account;
  const unitLabel = settings ? getWeightUnitLabel(settings.unitSystem) : "Not set";

  return (
    <Screen
      title="Settings"
      subtitle="Manage local data, privacy, and app preferences for FitCheck Coach."
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
          <Text style={styles.title}>Account</Text>
          <Text style={styles.body}>
            {account
              ? `${account.displayName} is signed in on this device.`
              : "No account is saved on this device."}
          </Text>
        </View>

        <TextField
          autoCapitalize="words"
          label="Name"
          onChangeText={setAccountNameDraft}
          placeholder="Your name"
          value={accountNameDraft}
        />

        <TextField
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          label="Email"
          onChangeText={setAccountEmailDraft}
          placeholder="you@example.com"
          value={accountEmailDraft}
        />

        <View style={styles.accountButtonRow}>
          <Pressable
            accessibilityRole="button"
            onPress={saveAccountProfile}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Save Account</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={confirmSignOut}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Sign Out</Text>
          </Pressable>
        </View>

        {accountStatus ? <Text style={styles.restoreStatus}>{accountStatus}</Text> : null}

        <Text style={styles.helperText}>
          Mobile has no OpenAI key. Future AI access must use a protected backend.
        </Text>
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
            Paste a FitCheck Coach backup JSON to restore logs, workouts, and settings on
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
  accountButtonRow: {
    gap: 10,
  },
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
  summaryValueSmall: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
});
