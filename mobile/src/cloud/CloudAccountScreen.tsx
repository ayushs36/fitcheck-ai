import { useState } from "react";
import { Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";
import type { AccountSession } from "./session";
import type { MobileStorage } from "../storage/StorageProvider";
import type { SyncConflict } from "./reconcile";
import { describeRecord } from "./recordDescription";

type Props = {
  session: AccountSession; storage: MobileStorage; conflicts: SyncConflict[];
  error: string | null; status: string; onSync: () => void;
  onResolve: (conflict: SyncConflict, choice: "local" | "remote") => Promise<void>;
};

export function CloudAccountScreen({session, storage, conflicts, error, status, onSync, onResolve}: Props) {
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function perform(action: () => Promise<void>) {
    if (working) return;
    setWorking(true); setMessage(null);
    try { await action(); }
    catch (failure) { setMessage(failure instanceof Error ? failure.message : "Could not complete this action."); }
    finally { setWorking(false); }
  }
  const conflict = conflicts[0];
  function choose(choice: "local" | "remote") {
    if (!conflict) return;
    Alert.alert("Keep this version?", "The other version will be replaced for this record. Other logs are not affected.", [
      {text: "Cancel", style: "cancel"},
      {text: choice === "local" ? "Keep device version" : "Keep cloud version", onPress: () => void perform(() => onResolve(conflict, choice))},
    ]);
  }
  return <Screen title="Account">
    <View style={styles.section}>
      <Text style={styles.title}>Signed in with Apple</Text>
      <Text selectable style={styles.body}>{session.email ?? "Apple-linked account"}</Text>
      <Text style={styles.body}>{status}</Text>
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Pressable accessibilityRole="button" disabled={working} style={styles.button} onPress={onSync}><Text style={styles.link}>Sync now</Text></Pressable>
    </View>
    {conflict && <View style={styles.section}>
      <Text style={styles.title}>Review changes ({conflicts.length})</Text>
      <Text style={styles.body}>{conflict.remote.kind === "daily_log" ? `Daily log: ${conflict.remote.record_id}` : conflict.remote.kind === "workout" ? "Workout" : "Goal settings"}</Text>
      <Text style={styles.label}>Device version</Text>
      <Text selectable style={styles.details}>{describeRecord(conflict.local.payload, conflict.local.deleted)}</Text>
      <Text style={styles.label}>Cloud version</Text>
      <Text selectable style={styles.details}>{describeRecord(conflict.remote.payload, conflict.remote.deleted)}</Text>
      <Pressable accessibilityRole="button" disabled={working} style={styles.button} onPress={() => choose("local")}><Text style={styles.link}>Keep device version</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={working} style={styles.button} onPress={() => choose("remote")}><Text style={styles.link}>Keep cloud version</Text></Pressable>
    </View>}
    <View style={styles.section}>
      <Text style={styles.title}>Backup</Text>
      <Pressable accessibilityRole="button" disabled={working} style={styles.button} onPress={() => void perform(async () => {
        const backup = await storage.loadMobileDataBackup();
        await Share.share({title: "FitCheck Coach Backup", message: JSON.stringify(backup, null, 2)});
      })}><Text style={styles.link}>Export account records</Text></Pressable>
    </View>
    <Pressable accessibilityRole="button" disabled={working} style={styles.button} onPress={() => {
      Alert.alert("Sign out?", "Account records on this device will be retained. Unsynced edits are not yet backed up to the cloud.", [
        {text: "Cancel", style: "cancel"}, {text: "Sign out", onPress: () => void perform(() => session.signOut())},
      ]);
    }}><Text style={styles.link}>Sign out</Text></Pressable>
    {message && <Text accessibilityRole="alert" style={styles.error}>{message}</Text>}
  </Screen>;
}
const styles = StyleSheet.create({
  section: {gap: 12, paddingVertical: 16, borderBottomWidth: 1, borderColor: colors.border},
  title: {fontSize: 18, fontWeight: "700", color: colors.text},
  body: {fontSize: 15, lineHeight: 22, color: colors.textMuted},
  label: {fontSize: 14, fontWeight: "700", color: colors.text},
  details: {fontSize: 13, lineHeight: 20, color: colors.text},
  button: {minHeight: 48, justifyContent: "center", paddingVertical: 12},
  link: {fontSize: 15, fontWeight: "700", color: colors.primary},
  error: {fontSize: 14, lineHeight: 21, color: colors.danger},
});
