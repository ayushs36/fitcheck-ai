import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { DailyLog, WorkoutSession } from "../types/fitness";
import { buildStrengthPreview, buildTrendSeries, TrendPoint } from "../utils/trendSeries";
import { Card } from "./Card";

type ProgressChartsCardProps = {
  logs: DailyLog[];
  workouts: WorkoutSession[];
};

function getRange(points: TrendPoint[]): { min: number; max: number } {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { min, max: min === max ? min + 1 : max };
}

function MiniBarChart({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>No logged data yet</Text>
      </View>
    );
  }

  const range = getRange(points);

  return (
    <View style={styles.chartRow}>
      {points.map((point) => {
        const heightPercent = ((point.value - range.min) / (range.max - range.min)) * 68 + 18;

        return (
          <View key={`${point.date}-${point.value}`} style={styles.barSlot}>
            <View style={[styles.bar, { height: `${heightPercent}%` }]} />
          </View>
        );
      })}
    </View>
  );
}

function ChartSection({
  label,
  points,
  unit,
}: {
  label: string;
  points: TrendPoint[];
  unit: string;
}) {
  const latestPoint = points[points.length - 1];

  return (
    <View style={styles.chartSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.chartLabel}>{label}</Text>
        <Text style={styles.chartMeta}>
          {latestPoint ? `${latestPoint.value} ${unit}` : "No data"}
        </Text>
      </View>
      <MiniBarChart points={points} />
      <Text style={styles.chartMeta}>{points.length} logged days shown</Text>
    </View>
  );
}

function getDirectionText(direction: string): string {
  if (direction === "up") {
    return "Up";
  }

  if (direction === "down") {
    return "Down";
  }

  if (direction === "flat") {
    return "Flat";
  }

  return "More data needed";
}

export function ProgressChartsCard({ logs, workouts }: ProgressChartsCardProps) {
  const weightPoints = buildTrendSeries(logs, "weightLbs");
  const caloriePoints = buildTrendSeries(logs, "calories");
  const stepPoints = buildTrendSeries(logs, "steps");
  const strengthPreview = buildStrengthPreview(workouts);

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Trends</Text>
        <Text style={styles.body}>Charts only use days where that field was logged.</Text>
      </View>

      <ChartSection label="Weight" points={weightPoints} unit="lb" />
      <ChartSection label="Calories" points={caloriePoints} unit="cal" />
      <ChartSection label="Steps" points={stepPoints} unit="steps" />

      <View style={styles.strengthBox}>
        <View style={styles.sectionHeader}>
          <Text style={styles.chartLabel}>Strength Preview</Text>
          <Text style={styles.chartMeta}>{getDirectionText(strengthPreview.direction)}</Text>
        </View>
        <Text style={styles.strengthStatus}>{strengthPreview.status}</Text>
        <Text style={styles.body}>
          {strengthPreview.latestWorkout ?? "Log workouts to start seeing training direction."}
        </Text>
        {typeof strengthPreview.latestSets === "number" ? (
          <Text style={styles.chartMeta}>
            Latest: {strengthPreview.latestSets} sets, {strengthPreview.latestReps ?? 0} reps
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    minHeight: 8,
    width: "100%",
  },
  barSlot: {
    alignItems: "center",
    flex: 1,
    height: 78,
    justifyContent: "flex-end",
  },
  body: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  chartLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  chartMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  chartRow: {
    alignItems: "flex-end",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    flexDirection: "row",
    gap: 5,
    height: 96,
    padding: 12,
  },
  chartSection: {
    gap: 8,
  },
  emptyChart: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    height: 96,
    justifyContent: "center",
    padding: 12,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  header: {
    gap: 4,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  strengthBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    gap: 6,
    padding: 14,
  },
  strengthStatus: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
});
