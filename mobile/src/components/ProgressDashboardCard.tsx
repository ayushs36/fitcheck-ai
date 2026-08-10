import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { ProgressInsights } from "../utils/progressInsights";
import { Card } from "./Card";

type ProgressDashboardCardProps = {
  insights: ProgressInsights;
};

function formatValue(value?: number, unit = ""): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "No data";
  }

  return `${value}${unit ? ` ${unit}` : ""}`;
}

function formatTarget(target?: number, unit = ""): string {
  if (typeof target !== "number" || !Number.isFinite(target)) {
    return "No target";
  }

  return `Target ${target}${unit ? ` ${unit}` : ""}`;
}

function getTrendSymbol(direction: ProgressInsights["weightTrend"]["direction"]): string {
  if (direction === "up") {
    return "UP";
  }

  if (direction === "down") {
    return "DOWN";
  }

  if (direction === "flat") {
    return "FLAT";
  }

  return "--";
}

export function ProgressDashboardCard({ insights }: ProgressDashboardCardProps) {
  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Current Goal</Text>
          <Text style={styles.title}>{insights.activeGoal}</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{insights.weightTrend.status}</Text>
        </View>
      </View>

      <View style={styles.trendBox}>
        <Text style={styles.trendSymbol}>{getTrendSymbol(insights.weightTrend.direction)}</Text>
        <View style={styles.trendCopy}>
          <Text style={styles.trendValue}>
            {typeof insights.weightTrend.weeklyChange === "number"
              ? `${insights.weightTrend.weeklyChange} lb/week`
              : "Not enough data"}
          </Text>
          <Text style={styles.body}>
            {insights.weightTrend.weighIns} weigh-ins used. Missing weigh-ins are skipped.
          </Text>
        </View>
      </View>

      <Text style={styles.summary}>{insights.summary}</Text>

      <View style={styles.metricGrid}>
        {insights.averages.map((average) => (
          <View key={average.label} style={styles.metricBox}>
            <Text style={styles.metricLabel}>{average.label}</Text>
            <Text style={styles.metricValue}>{formatValue(average.value)}</Text>
            <Text style={styles.metricMeta}>{formatTarget(average.target)}</Text>
            <Text style={styles.metricMeta}>{average.loggedDays} logged days</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  metricBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    gap: 5,
    padding: 14,
  },
  metricGrid: {
    gap: 10,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  metricMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  metricValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  statusPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  summary: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  trendBox: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  trendCopy: {
    flex: 1,
    gap: 4,
  },
  trendSymbol: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
    width: 48,
  },
  trendValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
});
