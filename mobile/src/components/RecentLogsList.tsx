import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { DailyLog } from "../types/fitness";
import { formatReadableDate } from "../utils/date";

type RecentLogsListProps = {
  logs: DailyLog[];
  selectedDate?: string;
  onSelectLog?: (log: DailyLog) => void;
};

function formatMetric(label: string, value?: number, suffix = ""): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return `${label}: blank`;
  }

  return `${label}: ${value}${suffix}`;
}

export function RecentLogsList({ logs, selectedDate, onSelectLog }: RecentLogsListProps) {
  if (logs.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No logs yet</Text>
        <Text style={styles.emptyBody}>
          Save your first day to start building mobile progress history.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {logs.map((log) => {
        const isSelected = log.date === selectedDate;

        return (
          <Pressable
            accessibilityRole={onSelectLog ? "button" : undefined}
            disabled={!onSelectLog}
            key={log.id}
            onPress={() => onSelectLog?.(log)}
            style={[styles.row, isSelected && styles.selectedRow]}
          >
            <View style={styles.rowHeader}>
              <Text style={styles.date}>{formatReadableDate(log.date)}</Text>
              <Text style={styles.goal}>{log.goal}</Text>
            </View>
            <Text style={styles.metrics}>
              {[
                formatMetric("Weight", log.weightLbs, " lb"),
                formatMetric("Cals", log.calories),
                formatMetric("Protein", log.proteinGrams, "g"),
                formatMetric("Steps", log.steps),
              ].join("   ")}
            </Text>
            <View style={styles.footerRow}>
              <Text style={styles.workout}>{log.workoutType ?? "No workout selected"}</Text>
              {onSelectLog ? (
                <Text style={styles.editHint}>{isSelected ? "Editing" : "Tap to edit"}</Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  date: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  emptyState: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    gap: 6,
    padding: 16,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  editHint: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  footerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  goal: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  list: {
    gap: 10,
  },
  metrics: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  row: {
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  rowHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  selectedRow: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  workout: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
});
