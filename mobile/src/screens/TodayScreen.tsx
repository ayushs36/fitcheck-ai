import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { LogEditorCard } from "../components/LogEditorCard";
import { RecentLogsList } from "../components/RecentLogsList";
import { Screen } from "../components/Screen";
import { getDailyLogByDate, loadRecentDailyLogs, upsertDailyLog } from "../storage/mobileStorage";
import { colors } from "../theme/colors";
import { DailyLog, TodayLogDraft } from "../types/fitness";
import { formatReadableDate, getTodayKey } from "../utils/date";
import { blankTodayDraft, createDailyLogFromDraft, dailyLogToDraft } from "../utils/logDraft";

export function TodayScreen() {
  const [draft, setDraft] = useState<TodayLogDraft>(blankTodayDraft);
  const [existingLog, setExistingLog] = useState<DailyLog | undefined>();
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const todayKey = useMemo(() => getTodayKey(), []);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedLog() {
      try {
        const [savedTodayLog, savedRecentLogs] = await Promise.all([
          getDailyLogByDate(todayKey),
          loadRecentDailyLogs(5),
        ]);

        if (!isMounted) {
          return;
        }

        setExistingLog(savedTodayLog);
        setDraft(dailyLogToDraft(savedTodayLog));
        setRecentLogs(savedRecentLogs);
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
    setExistingLog(dailyLog);
    setRecentLogs(updatedLogs.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5));
    setLastSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    Alert.alert("Log saved", "Your daily log was saved on this device.");
  }

  return (
    <Screen
      title="Today"
      subtitle="Log what you know. Blank fields stay blank and will not count against your trends."
    >
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
          <Text style={styles.cardMeta}>Saved on this device</Text>
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
