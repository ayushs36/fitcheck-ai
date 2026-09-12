import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, AppState, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { BottomTabs, type MobileTab } from "../components/BottomTabs";
import { TodayScreen } from "../screens/TodayScreen";
import { ProgressScreen } from "../screens/ProgressScreen";
import { TrainingScreen } from "../screens/TrainingScreen";
import { GoalsScreen } from "../screens/GoalsScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { StorageProvider } from "../storage/StorageProvider";
import { colors } from "../theme/colors";
import { createAccountScreenStorage } from "./screenStorage";
import type { AccountSession } from "./session";
import type { SyncConflict } from "./reconcile";
import { CloudAccountScreen } from "./CloudAccountScreen";

export function CloudWorkspace({session}: {session: AccountSession}) {
  const [tab, setTab] = useState<MobileTab>("today");
  const [loaded, setLoaded] = useState(false);
  const [hasSettings, setHasSettings] = useState(false);
  const [status, setStatus] = useState("Restoring account");
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const mounted = useRef(false);
  const bootstrapped = useRef(false);
  const running = useRef(false);
  const requested = useRef(false);

  const requestSync = useCallback(() => {
    requested.current = true;
    if (running.current || !mounted.current) return;
    running.current = true;
    async function run() {
      try {
        do {
          requested.current = false;
          if (mounted.current) { setStatus("Syncing"); setError(null); }
          const result = await session.synchronize();
          const review = await session.conflicts();
          if (!mounted.current) return;
          setConflicts(review);
          setStatus(result.conflicts ? `${result.conflicts} to review` : result.pending ? `${result.pending} pending` : "Up to date");
          if (!bootstrapped.current) {
            const settings = await session.data.loadUserSettings();
            if (!mounted.current) return;
            setHasSettings(Boolean(settings));
            bootstrapped.current = true;
            setLoaded(true);
          }
        } while (requested.current && mounted.current);
      } catch (failure) {
        if (mounted.current) {
          setStatus("Sync needs attention");
          setError(failure instanceof Error ? failure.message : "Could not sync. Device records were retained.");
        }
      } finally { running.current = false; }
    }
    void run();
  }, [session]);
  const storage = useMemo(() => createAccountScreenStorage(session, requestSync), [session, requestSync]);

  useEffect(() => {
    mounted.current = true;
    requestSync();
    const listener = AppState.addEventListener("change", state => { if (state === "active") requestSync(); });
    return () => { mounted.current = false; listener.remove(); };
  }, [requestSync]);

  async function resolve(conflict: SyncConflict, choice: "local" | "remote") {
    await session.resolveConflict(conflict.remote.kind, conflict.remote.record_id, conflict.remote.revision, choice);
    setConflicts(await session.conflicts());
    requestSync();
  }

  let content;
  if (!loaded) {
    content = <View style={styles.loading}>
      <Text style={styles.title}>FitCheck Coach</Text>
      {!error && <ActivityIndicator color={colors.primary} />}
      <Text style={styles.body}>{error ? "Account restore paused. Your saved records have not been cleared." : "Restoring your account records"}</Text>
      {error && <><Text style={styles.error}>{error}</Text><Pressable accessibilityRole="button" onPress={requestSync} style={styles.button}><Text style={styles.link}>Retry restore</Text></Pressable></>}
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => { void session.signOut().catch(failure => setError(String(failure))); }}><Text style={styles.link}>Sign out</Text></Pressable>
    </View>;
  } else if (!hasSettings) content = <OnboardingScreen onComplete={() => { setHasSettings(true); requestSync(); }} />;
  else if (tab === "settings") content = <CloudAccountScreen session={session} storage={storage} conflicts={conflicts} error={error} status={status} onSync={requestSync} onResolve={resolve} />;
  else if (tab === "training") content = <TrainingScreen />;
  else if (tab === "progress") content = <ProgressScreen />;
  else if (tab === "goals") content = <GoalsScreen />;
  else content = <TodayScreen />;

  return <SafeAreaView style={styles.safe}><StorageProvider storage={storage}><View style={styles.app}>
    {loaded && <Pressable accessibilityRole="button" accessibilityLabel={`Account sync: ${status}. Open account settings.`} style={styles.status} onPress={() => setTab("settings")}>
      <Text style={[styles.statusText, error ? {color: colors.danger} : undefined]}>{status}</Text>
    </Pressable>}
    {content}
    {loaded && hasSettings && <BottomTabs activeTab={tab} onChange={setTab} />}
  </View></StorageProvider></SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background}, app: {flex: 1},
  status: {paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border},
  statusText: {color: colors.textMuted, fontSize: 13, fontWeight: "600"},
  loading: {flex: 1, padding: 24, gap: 18, justifyContent: "center"},
  title: {color: colors.text, fontSize: 26, fontWeight: "800"},
  body: {color: colors.textMuted, fontSize: 16, lineHeight: 24},
  error: {color: colors.danger, fontSize: 14, lineHeight: 21},
  button: {minHeight: 48, justifyContent: "center"}, link: {color: colors.primary, fontSize: 16, fontWeight: "700"},
});
