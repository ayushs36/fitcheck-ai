import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { WorkoutSession } from "../types/fitness";
import { buildStrengthPreview, ExerciseTrend } from "../utils/trendSeries";
import { formatWeightFromLbs, getWeightUnitLabel, UnitSystem } from "../utils/units";
import { Card } from "./Card";

type TrainingAnalyticsCardProps = {
  sessions: WorkoutSession[];
  unitSystem?: UnitSystem;
};

function formatTrendChange(change: number | undefined, latestScore: number) {
  if (typeof change !== "number") {
    return String(latestScore);
  }

  return `${change > 0 ? "+" : ""}${change}`;
}

function formatExerciseDetail(trend: ExerciseTrend, unitSystem: UnitSystem) {
  const unit = getWeightUnitLabel(unitSystem);
  const latestLoad =
    typeof trend.latestTopWeightLbs === "number"
      ? `, top ${formatWeightFromLbs(trend.latestTopWeightLbs, unitSystem)} ${unit}`
      : "";
  const previousLoad =
    typeof trend.previousTopWeightLbs === "number"
      ? `, top ${formatWeightFromLbs(trend.previousTopWeightLbs, unitSystem)} ${unit}`
      : "";
  const previous =
    typeof trend.previousSets === "number" && typeof trend.previousReps === "number"
      ? `Previous: ${trend.previousSets} sets, ${trend.previousReps} reps, ${trend.previousRepsPerSet ?? 0} reps/set${previousLoad}`
      : "Previous: need another matching session";

  return `Latest ${trend.latestSets} sets, ${trend.latestReps} reps, ${trend.latestRepsPerSet} reps/set${latestLoad}. ${previous}.`;
}

export function TrainingAnalyticsCard({
  sessions,
  unitSystem = "imperial",
}: TrainingAnalyticsCardProps) {
  const preview = buildStrengthPreview(sessions);

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Training Coach</Text>
        <Text style={styles.status}>{preview.status}</Text>
      </View>
      <Text style={styles.body}>{preview.detail}</Text>
      <View style={styles.metricGrid}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{preview.workoutsLogged}</Text>
          <Text style={styles.metricLabel}>workouts</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{preview.latestWeightedSets ?? 0}</Text>
          <Text style={styles.metricLabel}>weighted sets</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{preview.latestBodyweightSets ?? 0}</Text>
          <Text style={styles.metricLabel}>bodyweight sets</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{preview.latestFormFocusSets ?? 0}</Text>
          <Text style={styles.metricLabel}>form-focus sets</Text>
        </View>
      </View>

      {preview.exerciseTrends.length ? (
        <View style={styles.trendList}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendTitle}>Repeat Exercises</Text>
            <Text style={styles.trendMeta}>Latest vs previous workout</Text>
          </View>
          {preview.exerciseTrends.map((trend) => (
            <View key={trend.name} style={styles.trendRow}>
              <View style={styles.trendCopy}>
                <Text style={styles.trendName}>{trend.name}</Text>
                <Text style={styles.body}>{trend.summary}</Text>
                <Text style={styles.trendDetail}>
                  {formatExerciseDetail(trend, unitSystem)}
                </Text>
                <Text style={styles.trendMeta}>
                  {trend.latestDate}
                  {trend.previousDate ? ` vs ${trend.previousDate}` : ""}
                </Text>
              </View>
              <View style={styles.trendBadge}>
                <Text style={styles.trendBadgeText}>{trend.status}</Text>
                <Text style={styles.trendScoreText}>
                  {formatTrendChange(trend.change, trend.latestScore)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  header: {
    gap: 4,
  },
  metric: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    flex: 1,
    gap: 3,
    minWidth: 120,
    padding: 12,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  metricValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  status: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  trendBadge: {
    alignItems: "flex-end",
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    gap: 3,
    minWidth: 92,
    padding: 10,
  },
  trendBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  trendCopy: {
    flex: 1,
    gap: 3,
  },
  trendDetail: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  trendHeader: {
    gap: 2,
  },
  trendList: {
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  trendMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  trendName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  trendRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  trendScoreText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  trendTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
});
