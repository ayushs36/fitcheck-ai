import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { WorkoutSession } from "../types/fitness";
import { buildStrengthPreview } from "../utils/trendSeries";
import { Card } from "./Card";

type TrainingAnalyticsCardProps = {
  sessions: WorkoutSession[];
};

export function TrainingAnalyticsCard({ sessions }: TrainingAnalyticsCardProps) {
  const preview = buildStrengthPreview(sessions);

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Training Analytics</Text>
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
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
});
