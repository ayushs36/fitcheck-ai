import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { DailyCoachBriefCard } from "../components/DailyCoachBriefCard";
import { LogEditorCard } from "../components/LogEditorCard";
import { RecentLogsList } from "../components/RecentLogsList";
import { Screen } from "../components/Screen";
import {
  getDailyLogByDate,
  loadDailyLogsDescending,
  loadUserSettings,
  upsertDailyLog,
} from "../storage/mobileStorage";
import { colors } from "../theme/colors";
import { DailyLog, TodayLogDraft, UserSettings } from "../types/fitness";
import { formatReadableDate, getTodayKey } from "../utils/date";
import { blankTodayDraft, createDailyLogFromDraft, dailyLogToDraft } from "../utils/logDraft";
import { calculateProgressInsights } from "../utils/progressInsights";

export function TodayScreen() {
  const [draft, setDraft] = useState<TodayLogDraft>(blankTodayDraft);
  const [existingLog, setExistingLog] = useState<DailyLog | undefined>();
  const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const todayKey = useMemo(() => getTodayKey(), []);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedLog() {
      try {
        const [savedTodayLog, savedLogs, savedSettings] = await Promise.all([
          getDailyLogByDate(todayKey),
          loadDailyLogsDescending(),
          loadUserSettings(),
        ]);

        if (!isMounted) {
          return;
        }

        setExistingLog(savedTodayLog);
        setAllLogs(savedLogs);
        setSettings(savedSettings);
        setDraft(
          savedTodayLog
            ? dailyLogToDraft(savedTodayLog)
            : { ...dailyLogToDraft(undefined), goal: savedSettings?.defaultGoal ?? "maintain" },
        );
        setRecentLogs(savedLogs.slice(0, 5));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSavedLog();

    return () => {
      isMounted = false;
    };
  }, [todayKey]);

  async function saveLog() {
    const dailyLog = createDailyLogFromDraft({
      date: todayKey,
      draft,
      existingLog,
    });

    const updatedLogs = await upsertDailyLog(dailyLog);
    const sortedLogs = updatedLogs.slice().sort((a, b) => b.date.localeCompare(a.date));
    setExistingLog(dailyLog);
    setAllLogs(sortedLogs);
    setRecentLogs(sortedLogs.slice(0, 5));
    setLastSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    Alert.alert("Log saved", "Your daily log was saved on this device.");
  }

  const coachSettings: UserSettings = {
    unitSystem: settings?.unitSystem ?? "imperial",
    defaultGoal: draft.goal,
    startingWeightLbs: settings?.startingWeightLbs,
    targetWeightLbs: settings?.targetWeightLbs,
    weeklyGoalPaceLbs: settings?.weeklyGoalPaceLbs,
    calorieTarget: settings?.calorieTarget,
    proteinTarget: settings?.proteinTarget,
    stepTarget: settings?.stepTarget,
    hasCompletedOnboarding: settings?.hasCompletedOnboarding,
    updatedAt: settings?.updatedAt,
  };
  const coachInsights = calculateProgressInsights(allLogs, coachSettings);

  return (
    <Screen
      title="Today"
      subtitle="Log what you know. Blank fields stay blank and will not count against your trends."
    >
      <DailyCoachBriefCard insights={coachInsights} />

      <LogEditorCard
        dateLabel={formatReadableDate(todayKey)}
        draft={draft}
        onDraftChange={setDraft}
        onSubmit={saveLog}
        statusLabel={
          isLoading
            ? "Loading saved log"
            : existingLog
              ? "Editing saved daily log"
              : "New daily check-in"
        }
        submitLabel={existingLog ? "Update Today" : "Save Today"}
        footer={
          lastSavedAt ? <Text style={styles.savedMeta}>Last saved at {lastSavedAt}</Text> : null
        }
      />

      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent Logs</Text>
          <Text style={styles.cardMeta}>Last 5 saved days on this device</Text>
        </View>
        <RecentLogsList logs={recentLogs} />
      </Card>
    </Screen>
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
  savedMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});
