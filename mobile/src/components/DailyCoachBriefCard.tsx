import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { ProgressInsights } from "../utils/progressInsights";
import { convertWeightFromLbs, getWeightUnitLabel, UnitSystem } from "../utils/units";
import { Card } from "./Card";

type DailyCoachBriefCardProps = {
  insights: ProgressInsights;
  unitSystem?: UnitSystem;
};

function formatTrend(insights: ProgressInsights, unitSystem: UnitSystem): string {
  const weeklyChange = insights.weightTrend.weeklyChange;
  if (typeof weeklyChange !== "number") {
    return "Need more weigh-ins";
  }

  const convertedChange = Math.round(convertWeightFromLbs(weeklyChange, unitSystem) * 10) / 10;
  return `${convertedChange} ${getWeightUnitLabel(unitSystem)}/week`;
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

function formatAverageValue(
  average: ProgressInsights["averages"][number],
): string {
  if (typeof average.value !== "number") {
    return "No data";
  }

  return `${average.value.toLocaleString()} ${average.unit}`;
}

function formatAverageTarget(
  average: ProgressInsights["averages"][number],
): string {
  if (average.targetLabel) {
    return average.targetLabel;
  }

  if (typeof average.target !== "number") {
    return "No target";
  }

  return `${average.target.toLocaleString()} ${average.unit}`;
}

function getAverageStatusLabel(status: ProgressInsights["averages"][number]["status"]) {
  if (status === "onTarget") {
    return "On target";
  }

  if (status === "above") {
    return "Above target";
  }

  if (status === "below") {
    return "Below target";
  }

  if (status === "noData") {
    return "No data";
  }

  return "No target";
}

function getAverageStatusStyle(average: ProgressInsights["averages"][number]) {
  if (average.status === "onTarget") {
    return styles.targetStatusGood;
  }

  if (average.status === "above" && average.label !== "Calories") {
    return styles.targetStatusGood;
  }

  if (average.status === "above" || average.status === "below") {
    return styles.targetStatusWarning;
  }

  return styles.targetStatusNeutral;
}

export function DailyCoachBriefCard({
  insights,
  unitSystem = "imperial",
}: DailyCoachBriefCardProps) {
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
          <Text style={styles.signalValue}>{formatTrend(insights, unitSystem)}</Text>
          <Text style={styles.signalMeta}>{insights.weightTrend.status}</Text>
        </View>
        <View style={styles.signalBox}>
          <Text style={styles.signalLabel}>Quality</Text>
          <Text style={styles.signalValue}>{insights.loggingQuality.score}/100</Text>
          <Text style={styles.signalMeta}>{formatQualityLabel(insights.loggingQuality.status)}</Text>
        </View>
      </View>

      <View style={styles.weeklyBox}>
        <View style={styles.weeklyHeader}>
          <View style={styles.headerCopy}>
            <Text style={styles.nextLabel}>Weekly Check</Text>
            <Text style={styles.weeklyTitle}>{insights.weeklyExecution.status}</Text>
          </View>
          <View style={styles.weeklyScoreWrap}>
            <Text style={styles.weeklyScore}>{insights.weeklyExecution.score}</Text>
            <Text style={styles.weeklyScoreMeta}>/100</Text>
          </View>
        </View>

        <Text style={styles.weeklyBody}>{insights.weeklyExecution.summary}</Text>

        <View style={styles.targetGrid}>
          {insights.averages.map((average) => (
            <View key={average.label} style={styles.targetItem}>
              <Text style={styles.targetLabel}>{average.label}</Text>
              <Text style={styles.targetValue}>{formatAverageValue(average)}</Text>
              <Text style={styles.targetMeta}>Target {formatAverageTarget(average)}</Text>
              <Text style={[styles.targetStatus, getAverageStatusStyle(average)]}>
                {getAverageStatusLabel(average.status)} - {average.loggedDays}/7 logged
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.weeklyAction}>{insights.weeklyExecution.nextAction}</Text>
        <Text style={styles.weeklyMeta}>
          Based on 7-day logged averages. Blank fields are skipped.
        </Text>
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
  weeklyAction: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  weeklyBody: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  weeklyBox: {
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  weeklyHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  weeklyMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  weeklyScore: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "900",
  },
  weeklyScoreMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
  },
  weeklyScoreWrap: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 54,
    width: 58,
  },
  weeklyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  targetGrid: {
    gap: 8,
  },
  targetItem: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    gap: 3,
    padding: 11,
  },
  targetLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  targetMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  targetStatus: {
    fontSize: 12,
    fontWeight: "900",
  },
  targetStatusGood: {
    color: colors.success,
  },
  targetStatusNeutral: {
    color: colors.textMuted,
  },
  targetStatusWarning: {
    color: colors.warning,
  },
  targetValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
});
