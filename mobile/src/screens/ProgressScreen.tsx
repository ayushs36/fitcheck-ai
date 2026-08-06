import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { LogEditorCard } from "../components/LogEditorCard";
import { RecentLogsList } from "../components/RecentLogsList";
import { Screen } from "../components/Screen";
import { loadDailyLogsDescending, upsertDailyLog } from "../storage/mobileStorage";
import { colors } from "../theme/colors";
import { DailyLog, TodayLogDraft } from "../types/fitness";
import { formatReadableDate } from "../utils/date";
import { blankTodayDraft, createDailyLogFromDraft, dailyLogToDraft } from "../utils/logDraft";

export function ProgressScreen() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<DailyLog | undefined>();
  const [editDraft, setEditDraft] = useState<TodayLogDraft>(blankTodayDraft);
  const [isLoading, setIsLoading] = useState(true);
  const [lastEditedDate, setLastEditedDate] = useState<string | null>(null);

  async function refreshLogs() {
    setIsLoading(true);
    const savedLogs = await loadDailyLogsDescending();
    setLogs(savedLogs);

    if (selectedLog) {
      const refreshedSelectedLog = savedLogs.find((log) => log.date === selectedLog.date);
      setSelectedLog(refreshedSelectedLog);
      setEditDraft(dailyLogToDraft(refreshedSelectedLog));
    }

    setIsLoading(false);
  }

  function selectLog(log: DailyLog) {
    setSelectedLog(log);
    setEditDraft(dailyLogToDraft(log));
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
    });

    const updatedLogs = await upsertDailyLog(updatedLog);
    const sortedLogs = updatedLogs.slice().sort((a, b) => b.date.localeCompare(a.date));
    setLogs(sortedLogs);
    setSelectedLog(updatedLog);
    setEditDraft(dailyLogToDraft(updatedLog));
    setLastEditedDate(updatedLog.date);
    Alert.alert("Past log updated", `${formatReadableDate(updatedLog.date)} was updated.`);
  }

  useEffect(() => {
    refreshLogs();
  }, []);

  return (
    <Screen
      title="Progress"
      subtitle="Review saved days and tap a log to edit it. Blank fields stay blank."
    >
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
            </View>
          }
        />
      ) : (
        <Card>
          <Text style={styles.title}>Edit a Past Day</Text>
          <Text style={styles.body}>
            Select a saved log above to adjust weight, nutrition, steps, workout type, or notes.
          </Text>
        </Card>
      )}
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
