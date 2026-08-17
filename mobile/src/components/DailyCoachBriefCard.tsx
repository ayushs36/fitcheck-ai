import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { ProgressInsights } from "../utils/progressInsights";
import { Card } from "./Card";

type DailyCoachBriefCardProps = {
  insights: ProgressInsights;
};

function formatTrend(insights: ProgressInsights): string {
  const weeklyChange = insights.weightTrend.weeklyChange;
  if (typeof weeklyChange !== "number") {
    return "Need more weigh-ins";
  }

  return `${weeklyChange} lb/week`;
}

function formatQualityLabel(status: ProgressInsights["loggingQuality"]["status"]): string {
  if (status === "strong") {
    return "Strong data";
  }

  if (status === "usable") {
    return "Usable data";
  }

  if (status === "thin") {
    return "Thin data";
  }

  return "Build baseline";
}

export function DailyCoachBriefCard({ insights }: DailyCoachBriefCardProps) {
  return (
    <Card>
      <View style={styles.accentBar} />
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Today's Coach Brief</Text>
          <Text style={styles.title}>{insights.priority}</Text>
        </View>
        <View style={styles.goalPill}>
          <Text style={styles.goalText}>{insights.activeGoal}</Text>
        </View>
      </View>

      <Text style={styles.body}>{insights.nextAction}</Text>

      <View style={styles.signalRow}>
        <View style={styles.signalBox}>
          <Text style={styles.signalLabel}>Trend</Text>
          <Text style={styles.signalValue}>{formatTrend(insights)}</Text>
          <Text style={styles.signalMeta}>{insights.weightTrend.status}</Text>
        </View>
        <View style={styles.signalBox}>
          <Text style={styles.signalLabel}>Quality</Text>
          <Text style={styles.signalValue}>{insights.loggingQuality.score}/100</Text>
          <Text style={styles.signalMeta}>{formatQualityLabel(insights.loggingQuality.status)}</Text>
        </View>
      </View>

      <View style={styles.nextBox}>
        <Text style={styles.nextLabel}>Plan Guardrail</Text>
        <Text style={styles.nextText}>{insights.loggingQuality.nextAction}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  accentBar: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 4,
    width: 54,
  },
  body: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  goalPill: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  goalText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
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
  nextBox: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    gap: 4,
    padding: 12,
  },
  nextLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  nextText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  signalBox: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    flex: 1,
    gap: 3,
    padding: 12,
  },
  signalLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  signalMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  signalRow: {
    flexDirection: "row",
    gap: 10,
  },
  signalValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
});
