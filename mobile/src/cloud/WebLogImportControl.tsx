import {useRef, useState} from "react";
import {Alert, Pressable, StyleSheet, Text, View} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import {File, Paths} from "expo-file-system";
import {colors} from "../theme/colors";
import type {AccountSession} from "./session";
import {MAX_WEB_EXPORT_BYTES} from "./webLogImport";

type Preview = Awaited<ReturnType<AccountSession["previewWebImport"]>> & {raw: string};
export function WebLogImportControl({session, onSync}: {session: AccountSession; onSync: () => void}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const locked = useRef(false);
  async function run(action: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setMessage("");
    try { await action(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Import could not be completed."); }
    finally { locked.current = false; setBusy(false); }
  }
  async function choose() {
    setPreview(null);
    await session.synchronize();
    const result = await DocumentPicker.getDocumentAsync({type: "application/json", copyToCacheDirectory: true, multiple: false});
    if (result.canceled) return;
    const file = new File(result.assets[0].uri);
    try {
      if (file.size > MAX_WEB_EXPORT_BYTES) throw new Error("Export exceeds the 5 MB limit.");
      const raw = await file.text();
      setPreview({...await session.previewWebImport(raw), raw});
    } finally {
      // Only remove the picker-created cache copy, never the user's original file.
      if (file.uri.startsWith(Paths.cache.uri)) {
        try { file.delete(); } catch { /* The OS may already have removed its cache copy. */ }
      }
    }
  }
  function confirm() {
    if (!preview || busy) return;
    const captured = preview;
    Alert.alert("Import into this account?", `${captured.dates.length} days and ${captured.workouts} workouts will be added to ${session.email ?? `Apple account ending ${session.userId.slice(-8)}`} and synced to its private cloud storage. Existing dates will be skipped. Your web logs will not change.`, [
      {text: "Cancel", style: "cancel"},
      {text: "Import", onPress: () => void run(async () => {
        const result = await session.importWebLogs(captured.raw, captured.dates);
        setPreview(null);
        setMessage(`${result.dates.length} days saved on this device. ${result.skippedDates.length} existing dates skipped. Check sync status for cloud backup.`);
        onSync();
      })},
    ]);
  }
  return <View style={styles.container}>
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => void run(choose)} style={styles.button}>
      <Text style={styles.link}>{busy ? "Working..." : "Import web logs"}</Text>
    </Pressable>
    {preview && <View style={styles.container}>
      <Text style={styles.text}>{preview.dates.length} new days, {preview.workouts} workouts</Text>
      {preview.dates.length > 0 && <Text style={styles.text}>{preview.dates[0]} to {preview.dates.at(-1)}</Text>}
      <Text style={styles.text}>{preview.skippedDates.length} existing dates will be skipped, including dates with workouts or deleted records. Mobile goal settings stay unchanged.</Text>
      {preview.assumedGoalDays > 0 && <Text style={styles.text}>{preview.assumedGoalDays} days had no saved goal phase; those days use the goal selected when exported.</Text>}
      <Pressable accessibilityRole="button" disabled={busy || !preview.dates.length} onPress={confirm} style={styles.button}>
        <Text style={[styles.link, !preview.dates.length && styles.disabled]}>Confirm import</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => setPreview(null)} style={styles.button}><Text style={styles.link}>Cancel</Text></Pressable>
    </View>}
    {!!message && <Text accessibilityRole="alert" style={styles.text}>{message}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  container: {gap: 8},
  button: {minHeight: 48, justifyContent: "center", paddingVertical: 12},
  link: {fontSize: 15, fontWeight: "700", color: colors.primary},
  text: {fontSize: 14, lineHeight: 21, color: colors.textMuted},
  disabled: {opacity: 0.5},
});
