import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { ProgressChartsCard } from "../components/ProgressChartsCard";
import { LogEditorCard } from "../components/LogEditorCard";
import { ProgressDashboardCard } from "../components/ProgressDashboardCard";
import { RecentLogsList } from "../components/RecentLogsList";
import { Screen } from "../components/Screen";
import {
  deleteDailyLogByDate,
  loadDailyLogsDescending,
  loadRecentWorkoutSessions,
  loadUserSettings,
  upsertDailyLog,
} from "../storage/mobileStorage";
import { colors } from "../theme/colors";
import { DailyLog, TodayLogDraft, UserSettings, WorkoutSession } from "../types/fitness";
import { formatReadableDate } from "../utils/date";
import { blankTodayDraft, createDailyLogFromDraft, dailyLogToDraft } from "../utils/logDraft";
import { calculateProgressInsights } from "../utils/progressInsights";
import { getWeightUnitLabel } from "../utils/units";

export function ProgressScreen() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [selectedLog, setSelectedLog] = useState<DailyLog | undefined>();
  const [editDraft, setEditDraft] = useState<TodayLogDraft>(blankTodayDraft);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastEditedDate, setLastEditedDate] = useState<string | null>(null);

  async function refreshLogs() {
    setIsLoading(true);
    const [savedLogs, savedSettings, savedWorkouts] = await Promise.all([
      loadDailyLogsDescending(),
      loadUserSettings(),
      loadRecentWorkoutSessions(10),
    ]);
    setLogs(savedLogs);
    setSettings(savedSettings);
    setWorkouts(savedWorkouts);

    if (selectedLog) {
      const refreshedSelectedLog = savedLogs.find((log) => log.date === selectedLog.date);
      setSelectedLog(refreshedSelectedLog);
      setEditDraft(dailyLogToDraft(refreshedSelectedLog, savedSettings?.unitSystem ?? "imperial"));
    }

    setIsLoading(false);
  }

  function selectLog(log: DailyLog) {
    setSelectedLog(log);
    setEditDraft(dailyLogToDraft(log, settings?.unitSystem ?? "imperial"));
    setLastEditedDate(null);
  }

  function cancelEdit() {
    setSelectedLog(undefined);
    setEditDraft(blankTodayDraft);
    setLastEditedDate(null);
  }

  async function savePastLog() {
    if (!selectedLog) {
      return;
    }

    const updatedLog = createDailyLogFromDraft({
      date: selectedLog.date,
      draft: editDraft,
      existingLog: selectedLog,
      unitSystem: settings?.unitSystem ?? "imperial",
    });

    const updatedLogs = await upsertDailyLog(updatedLog);
    const sortedLogs = updatedLogs.slice().sort((a, b) => b.date.localeCompare(a.date));
    setLogs(sortedLogs);
    setSelectedLog(updatedLog);
    setEditDraft(dailyLogToDraft(updatedLog, settings?.unitSystem ?? "imperial"));
    setLastEditedDate(updatedLog.date);
    Alert.alert("Past log updated", `${formatReadableDate(updatedLog.date)} was updated.`);
  }

  function deleteSelectedLog() {
    if (!selectedLog) {
      return;
    }

    const logDate = selectedLog.date;

    Alert.alert(
      "Delete this log?",
      `${formatReadableDate(logDate)} will be removed from your trends, averages, and charts.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedLogs = await deleteDailyLogByDate(logDate);
            setLogs(updatedLogs);
            setSelectedLog(undefined);
            setEditDraft(blankTodayDraft);
            setLastEditedDate(null);
            Alert.alert("Log deleted", `${formatReadableDate(logDate)} was removed.`);
          },
        },
      ],
    );
  }

  useEffect(() => {
    refreshLogs();
  }, []);

  const insights = calculateProgressInsights(logs, settings);
  const unitSystem = settings?.unitSystem ?? "imperial";
  const weightUnit = getWeightUnitLabel(unitSystem);

  return (
    <Screen
      title="Progress"
      subtitle="Track goal-aware trends while skipping missing fields from averages."
    >
      <ProgressDashboardCard insights={insights} unitSystem={unitSystem} />
      <ProgressChartsCard logs={logs} workouts={workouts} unitSystem={unitSystem} />

      <Card>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Log History</Text>
            <Text style={styles.body}>
              {isLoading ? "Loading saved logs" : `${logs.length} saved ${logs.length === 1 ? "day" : "days"}`}
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={refreshLogs} style={styles.refreshButton}>
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>
        <RecentLogsList
          logs={logs}
          unitSystem={unitSystem}
          onSelectLog={selectLog}
          selectedDate={selectedLog?.date}
        />
      </Card>

      {selectedLog ? (
        <LogEditorCard
          dateLabel={formatReadableDate(selectedLog.date)}
          draft={editDraft}
          onDraftChange={setEditDraft}
          onSubmit={savePastLog}
          weightUnit={weightUnit}
          statusLabel="Editing past log"
          submitLabel="Update Past Log"
          footer={
            <View style={styles.editFooter}>
              {lastEditedDate ? (
                <Text style={styles.savedMeta}>
                  Updated {formatReadableDate(lastEditedDate)}
                </Text>
              ) : (
                <Text style={styles.editNote}>
                  Changes only apply to this selected day.
                </Text>
              )}
              <Pressable accessibilityRole="button" onPress={cancelEdit} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Close Editor</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={deleteSelectedLog}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteText}>Delete This Log</Text>
              </Pressable>
            </View>
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  cancelButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: "center",
  },
  cancelText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  deleteButton: {
    alignItems: "center",
    borderColor: colors.danger,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: "center",
  },
  deleteText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "800",
  },
  editFooter: {
    gap: 10,
  },
  editNote: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  refreshButton: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  refreshText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  savedMeta: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
});
