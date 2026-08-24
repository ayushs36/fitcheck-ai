import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { DailyLog } from "../types/fitness";
import { formatReadableDate } from "../utils/date";
import { formatWeightFromLbs, getWeightUnitLabel, UnitSystem } from "../utils/units";

type RecentLogsListProps = {
  logs: DailyLog[];
  unitSystem?: UnitSystem;
  selectedDate?: string;
  onSelectLog?: (log: DailyLog) => void;
};

function formatMetricValue(value?: number, suffix = ""): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "blank";
  }

  return `${value.toLocaleString()}${suffix}`;
}

function formatWeight(value: number | undefined, unitSystem: UnitSystem): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "blank";
  }

  return `${formatWeightFromLbs(value, unitSystem)} ${getWeightUnitLabel(unitSystem)}`;
}

export function RecentLogsList({
  logs,
  unitSystem = "imperial",
  selectedDate,
  onSelectLog,
}: RecentLogsListProps) {
  if (logs.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Your first trend starts here</Text>
        <Text style={styles.emptyBody}>
          Save today with any fields you know. Blank fields stay blank and will be skipped in
          averages.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {logs.map((log) => {
        const isSelected = log.date === selectedDate;
        const metricItems = [
          { label: "Weight", value: formatWeight(log.weightLbs, unitSystem) },
          { label: "Calories", value: formatMetricValue(log.calories) },
          { label: "Protein", value: formatMetricValue(log.proteinGrams, "g") },
          { label: "Steps", value: formatMetricValue(log.steps) },
        ];

        return (
          <Pressable
            accessibilityRole={onSelectLog ? "button" : undefined}
            disabled={!onSelectLog}
            key={log.id}
            onPress={() => onSelectLog?.(log)}
            style={[styles.row, isSelected && styles.selectedRow]}
          >
            <View style={styles.rowHeader}>
              <View style={styles.dateBlock}>
                <Text style={styles.date}>{formatReadableDate(log.date)}</Text>
                <Text style={styles.dateMeta}>{log.date}</Text>
              </View>
              <View style={styles.goalPill}>
                <Text style={styles.goal}>{log.goal}</Text>
              </View>
            </View>
            <View style={styles.metricGrid}>
              {metricItems.map((item) => (
                <View key={item.label} style={styles.metricItem}>
                  <Text style={styles.metricLabel}>{item.label}</Text>
                  <Text style={styles.metricValue}>{item.value}</Text>
                </View>
              ))}
            </View>
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
  dateBlock: {
    flex: 1,
    gap: 2,
  },
  dateMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  emptyState: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
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
    fontWeight: "900",
    textTransform: "uppercase",
  },
  goalPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  list: {
    gap: 10,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricItem: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: "47%",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 2,
  },
  row: {
    backgroundColor: colors.surface,
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
