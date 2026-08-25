import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { ProgressInsights } from "../utils/progressInsights";
import { convertWeightFromLbs, getWeightUnitLabel, UnitSystem } from "../utils/units";
import { Card } from "./Card";

type ProgressDashboardCardProps = {
  insights: ProgressInsights;
  unitSystem?: UnitSystem;
};

function formatValue(value?: number, unit = ""): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "No data";
  }

  return `${value}${unit ? ` ${unit}` : ""}`;
}

function formatTarget(target?: number, unit = "", targetLabel?: string): string {
  if (targetLabel) {
    return `Target ${targetLabel}`;
  }

  if (typeof target !== "number" || !Number.isFinite(target)) {
    return "No target";
  }

  return `Target ${target}${unit ? ` ${unit}` : ""}`;
}

function formatMetricStatus(status: string): string {
  if (status === "above") {
    return "Above target";
  }

  if (status === "below") {
    return "Below target";
  }

  if (status === "onTarget") {
    return "On target";
  }

  if (status === "noData") {
    return "No data";
  }

  return "No target";
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

function formatQualityStatus(status: ProgressInsights["loggingQuality"]["status"]): string {
  if (status === "strong") {
    return "Strong";
  }

  if (status === "usable") {
    return "Usable";
  }

  if (status === "thin") {
    return "Thin";
  }

  return "Build baseline";
}

function formatStreak(days: number): string {
  return `${days} day${days === 1 ? "" : "s"} logged in a row`;
}

function formatWeeklyChange(value: number, unitSystem: UnitSystem): string {
  const convertedValue = Math.round(convertWeightFromLbs(value, unitSystem) * 10) / 10;
  return `${convertedValue} ${getWeightUnitLabel(unitSystem)}/week`;
}

function formatWeight(value: number | undefined, unitSystem: UnitSystem): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "No data";
  }

  const convertedValue = Math.round(convertWeightFromLbs(value, unitSystem) * 10) / 10;
  return `${convertedValue} ${getWeightUnitLabel(unitSystem)}`;
}

function formatDateLabel(dateKey?: string): string {
  if (!dateKey) {
    return "No projection";
  }

  return new Date(`${dateKey}T12:00:00`).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProgressDashboardCard({
  insights,
  unitSystem = "imperial",
}: ProgressDashboardCardProps) {
  const coverageItems = [
    { label: "Weight", value: insights.loggingQuality.coverage.weight },
    { label: "Calories", value: insights.loggingQuality.coverage.calories },
    { label: "Protein", value: insights.loggingQuality.coverage.protein },
    { label: "Steps", value: insights.loggingQuality.coverage.steps },
  ];

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
              ? formatWeeklyChange(insights.weightTrend.weeklyChange, unitSystem)
              : "Not enough data"}
          </Text>
          <Text style={styles.body}>
            {insights.weightTrend.weighIns} weigh-ins used. Missing weigh-ins are skipped.
          </Text>
        </View>
      </View>

      <Text style={styles.summary}>{insights.summary}</Text>

      <View style={styles.timelineBox}>
        <View style={styles.timelineHeader}>
          <View>
            <Text style={styles.actionEyebrow}>Goal Timeline</Text>
            <Text style={styles.timelineTitle}>
              {insights.goalTimeline.projectedDate
                ? formatDateLabel(insights.goalTimeline.projectedDate)
                : formatDateLabel(insights.goalTimeline.plannedDate)}
            </Text>
          </View>
          <View style={styles.timelinePill}>
            <Text style={styles.timelinePillText}>{insights.goalTimeline.status}</Text>
          </View>
        </View>

        <View style={styles.timelineGrid}>
          <View style={styles.timelineMetric}>
            <Text style={styles.metricLabel}>Current</Text>
            <Text style={styles.timelineValue}>
              {formatWeight(insights.goalTimeline.latestWeightLbs, unitSystem)}
            </Text>
          </View>
          <View style={styles.timelineMetric}>
            <Text style={styles.metricLabel}>Target</Text>
            <Text style={styles.timelineValue}>
              {formatWeight(insights.goalTimeline.targetWeightLbs, unitSystem)}
            </Text>
          </View>
          <View style={styles.timelineMetric}>
            <Text style={styles.metricLabel}>Remaining</Text>
            <Text style={styles.timelineValue}>
              {formatWeight(insights.goalTimeline.poundsRemaining, unitSystem)}
            </Text>
          </View>
        </View>

        <Text style={styles.executionBody}>{insights.goalTimeline.summary}</Text>
        <Text style={styles.executionAction}>{insights.goalTimeline.nextAction}</Text>
      </View>

      <View style={styles.qualityBox}>
        <View style={styles.qualityHeader}>
          <View style={styles.qualityScoreWrap}>
            <Text style={styles.qualityScore}>{insights.loggingQuality.score}</Text>
            <Text style={styles.qualityScoreMeta}>/100</Text>
          </View>
          <View style={styles.qualityCopy}>
            <Text style={styles.actionEyebrow}>Logging Quality</Text>
            <Text style={styles.qualityTitle}>
              {formatQualityStatus(insights.loggingQuality.status)}
            </Text>
            <Text style={styles.body}>{insights.loggingQuality.summary}</Text>
          </View>
        </View>

        <View style={styles.coverageGrid}>
          {coverageItems.map((item) => (
            <View key={item.label} style={styles.coverageItem}>
              <Text style={styles.coverageValue}>{item.value}/7</Text>
              <Text style={styles.coverageLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.qualityAction}>
          {formatStreak(insights.loggingQuality.streakDays)}. {insights.loggingQuality.nextAction}
        </Text>
      </View>

      <View style={styles.executionBox}>
        <View style={styles.executionHeader}>
          <View>
            <Text style={styles.actionEyebrow}>Weekly Execution</Text>
            <Text style={styles.executionTitle}>{insights.weeklyExecution.status}</Text>
          </View>
          <View style={styles.executionScoreWrap}>
            <Text style={styles.executionScore}>{insights.weeklyExecution.score}</Text>
            <Text style={styles.executionScoreMeta}>/100</Text>
          </View>
        </View>
        <Text style={styles.executionBody}>{insights.weeklyExecution.summary}</Text>
        <Text style={styles.executionAction}>{insights.weeklyExecution.nextAction}</Text>
        <Text style={styles.executionMeta}>
          Based on 7-day logged averages. One off day is okay if the weekly average
          stays on target.
        </Text>
      </View>

      <View style={styles.actionBox}>
        <Text style={styles.actionEyebrow}>Current Priority</Text>
        <Text style={styles.actionTitle}>{insights.priority}</Text>
        <Text style={styles.actionBody}>{insights.nextAction}</Text>
        <View style={styles.evidenceList}>
          {insights.evidence.map((item) => (
            <Text key={item} style={styles.evidenceItem}>
              {item}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.metricGrid}>
        {insights.averages.map((average) => (
          <View key={average.label} style={styles.metricBox}>
            <Text style={styles.metricLabel}>{average.label}</Text>
            <Text style={styles.metricValue}>{formatValue(average.value)}</Text>
            <Text style={styles.metricMeta}>7-day logged average</Text>
            <Text style={styles.metricMeta}>
              {formatTarget(average.target, average.unit, average.targetLabel)}
            </Text>
            <Text style={styles.metricStatus}>{formatMetricStatus(average.status)}</Text>
            <Text style={styles.metricMeta}>
              {average.loggedDays}/7 days logged. Blank fields skipped.
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actionBody: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  actionBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    gap: 7,
    padding: 14,
  },
  actionEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  actionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
  },
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
  evidenceItem: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  evidenceList: {
    gap: 4,
  },
  executionAction: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  executionBody: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  executionBox: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 7,
    padding: 14,
  },
  executionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  executionMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  executionScore: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "900",
  },
  executionScoreMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
  },
  executionScoreWrap: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 58,
    width: 62,
  },
  executionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
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
  metricStatus: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  metricValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  coverageGrid: {
    flexDirection: "row",
    gap: 8,
  },
  coverageItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    flex: 1,
    gap: 2,
    padding: 10,
  },
  coverageLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
  },
  coverageValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  qualityAction: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  qualityBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    gap: 10,
    padding: 14,
  },
  qualityCopy: {
    flex: 1,
    gap: 4,
  },
  qualityHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  qualityScore: {
    color: colors.primary,
    fontSize: 25,
    fontWeight: "900",
  },
  qualityScoreMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
  },
  qualityScoreWrap: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 70,
    width: 70,
  },
  qualityTitle: {
    color: colors.text,
    fontSize: 18,
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
  timelineBox: {
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  timelineGrid: {
    flexDirection: "row",
    gap: 8,
  },
  timelineHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  timelineMetric: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    flex: 1,
    gap: 4,
    padding: 10,
  },
  timelinePill: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  timelinePillText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  timelineTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  timelineValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
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
