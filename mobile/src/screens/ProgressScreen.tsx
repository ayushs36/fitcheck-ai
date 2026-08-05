import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { RecentLogsList } from "../components/RecentLogsList";
import { Screen } from "../components/Screen";
import { loadRecentDailyLogs } from "../storage/mobileStorage";
import { colors } from "../theme/colors";
import { DailyLog } from "../types/fitness";

export function ProgressScreen() {
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshLogs() {
    setIsLoading(true);
    const logs = await loadRecentDailyLogs(14);
    setRecentLogs(logs);
    setIsLoading(false);
  }

  useEffect(() => {
    refreshLogs();
  }, []);

  return (
    <Screen
      title="Progress"
      subtitle="Your saved logs become trends here. Missing fields stay blank and are skipped from future averages."
    >
      <Card>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Log History</Text>
            <Text style={styles.body}>
              {isLoading
                ? "Loading saved logs"
                : `${recentLogs.length} saved ${recentLogs.length === 1 ? "day" : "days"}`}
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={refreshLogs} style={styles.refreshButton}>
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>
        <RecentLogsList logs={recentLogs} />
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
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
});
