import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMobileCloudClient, watchCloudSessionLifecycle } from "./client";
import { signInWithApple } from "./appleAuth";
import { openAccountSession, type AccountSession } from "./session";
import { needsWorkspaceSetup, prepareAccountWorkspace } from "./prepareWorkspace";
import { MOBILE_STORAGE_KEYS } from "../storage/mobileStorage";
import { colors } from "../theme/colors";
import { CloudWorkspace } from "./CloudWorkspace";

export default function CloudRoot() {
  const [phase, setPhase] = useState<"loading" | "signin" | "setup" | "ready">("loading");
  const [session, setSession] = useState<AccountSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const current = useRef<AccountSession | null>(null);
  const mounted = useRef(false);
  const working = useRef(false);
  const generation = useRef(0);

  async function connect(token: number) {
    const candidate = await openAccountSession(getMobileCloudClient(), AsyncStorage);
    if (!mounted.current || token !== generation.current) { candidate.close(); return; }
    current.current?.close();
    current.current = candidate;
    candidate.onClosed(() => {
      if (current.current !== candidate) return;
      current.current = null;
      if (mounted.current) { setSession(null); setPhase("signin"); }
    });
    const needsSetup = await needsWorkspaceSetup(AsyncStorage, candidate.userId);
    await candidate.data.loadUserSettings();
    if (!mounted.current || token !== generation.current || current.current !== candidate) return;
    setSession(candidate);
    setPhase(needsSetup ? "setup" : "ready");
  }

  useEffect(() => {
    mounted.current = true;
    const token = ++generation.current;
    let stop = () => {};
    async function resume() {
      try {
        stop = watchCloudSessionLifecycle();
        const {data, error: sessionError} = await getMobileCloudClient().auth.getSession();
        if (sessionError) throw sessionError;
        if (!mounted.current || token !== generation.current) return;
        if (data.session) await connect(token);
        else setPhase("signin");
      } catch (failure) {
        if (mounted.current && token === generation.current) {
          setError(failure instanceof Error ? failure.message : "Could not open your account.");
          setPhase("signin");
        }
      }
    }
    void resume();
    return () => { mounted.current = false; generation.current++; current.current?.close(); stop(); };
  }, []);

  async function perform(action: () => Promise<void>) {
    if (working.current) return;
    working.current = true;
    setBusy(true); setError(null);
    try { await action(); }
    catch (failure) { if (mounted.current) setError(failure instanceof Error ? failure.message : "Please try again. Your saved data was retained."); }
    finally { working.current = false; if (mounted.current) setBusy(false); }
  }

  function signIn() {
    void perform(async () => {
      const token = ++generation.current;
      const user = await signInWithApple();
      if (user) await connect(token);
    });
  }

  function prepare(choice: "separate" | "import") {
    void perform(async () => {
      const candidate = current.current;
      if (!candidate) throw new Error("Sign in again before continuing.");
      const snapshot = {
        logs: await AsyncStorage.getItem(MOBILE_STORAGE_KEYS.logs),
        workouts: await AsyncStorage.getItem(MOBILE_STORAGE_KEYS.workouts),
        settings: await AsyncStorage.getItem(MOBILE_STORAGE_KEYS.settings),
      };
      await candidate.data.loadUserSettings();
      await prepareAccountWorkspace(AsyncStorage, candidate.userId, choice, snapshot);
      await candidate.data.loadUserSettings();
      if (mounted.current && current.current === candidate) setPhase("ready");
    });
  }

  function confirmImport() {
    Alert.alert("Import your device logs?", "Only continue if these device logs belong to you. They will be backed up locally, then synced to your Apple-linked account. Existing cloud records will not be silently replaced.", [
      {text: "Cancel", style: "cancel"}, {text: "Import my logs", onPress: () => prepare("import")},
    ]);
  }

  if (phase === "ready" && session) return <CloudWorkspace key={session.userId} session={session} />;
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.brand}>FitCheck Coach</Text>
    {phase === "loading" ? <><ActivityIndicator color={colors.primary} /><Text style={styles.body}>Opening your account</Text></> : phase === "setup" ? <>
      <Text style={styles.title}>Your account, your logs</Text>
      <Text style={styles.body}>Import this device's records into your account, or leave them separate. Neither option clears the original device logs.</Text>
      <Pressable accessibilityRole="button" disabled={busy} style={styles.primary} onPress={confirmImport}><Text style={styles.primaryText}>Import my device logs</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={busy} style={styles.secondary} onPress={() => prepare("separate")}><Text style={styles.buttonText}>Keep device logs separate</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={busy} style={styles.secondary} onPress={() => void perform(async () => { await current.current?.signOut(); })}><Text style={styles.buttonText}>Sign out</Text></Pressable>
    </> : <>
      <Text style={styles.title}>Your progress, together</Text>
      <Text style={styles.body}>Sign in to sync your workout, nutrition, and weight records privately across your devices.</Text>
      {Platform.OS === "ios" ? <View style={busy ? {opacity: 0.5} : undefined} pointerEvents={busy ? "none" : "auto"}>
        <AppleAuthentication.AppleAuthenticationButton buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK} cornerRadius={8} style={styles.apple} onPress={signIn} />
      </View> : <Text style={styles.body}>Account sign-in is available in the iPhone app.</Text>}
    </>}
    {busy && <ActivityIndicator color={colors.primary} />}
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background},
  content: {flexGrow: 1, justifyContent: "center", padding: 24, gap: 20, width: "100%", maxWidth: 520, alignSelf: "center"},
  brand: {fontSize: 18, fontWeight: "800", color: colors.primary},
  title: {fontSize: 28, fontWeight: "800", color: colors.text},
  body: {fontSize: 16, lineHeight: 24, color: colors.textMuted},
  apple: {height: 52, width: "100%"},
  primary: {backgroundColor: colors.primary, padding: 16, borderRadius: 8, alignItems: "center"},
  primaryText: {color: colors.surface, fontWeight: "700", fontSize: 16},
  secondary: {padding: 14, alignItems: "center"},
  buttonText: {color: colors.text, fontWeight: "700", fontSize: 15},
  error: {color: colors.danger, fontSize: 14, lineHeight: 21},
});
