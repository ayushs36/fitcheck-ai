import {useState} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { DailyLog, UserSettings } from "../types/fitness";
import { buildTrendSeries, TrendPoint } from "../utils/trendSeries";
import { convertWeightFromLbs, getWeightUnitLabel, UnitSystem } from "../utils/units";
import { getWeightTrendSummary } from "../utils/weightTrend";
import { Card } from "./Card";

type ProgressChartsCardProps = {
  logs: DailyLog[];
  settings?: UserSettings | null;
  unitSystem?: UnitSystem;
};

function getRange(points: TrendPoint[], target?: number): { min: number; max: number } {
  const values = typeof target === "number" ? [...points.map((point) => point.value), target] : points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { min, max: min === max ? min + 1 : max };
}

function MiniBarChart({ points, unit, color, weight, target }: { points: TrendPoint[]; unit: string; color: string; weight: boolean; target?: number }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [plotWidth, setPlotWidth] = useState(240);
  if (points.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>No logged data yet</Text>
      </View>
    );
  }

  const range = getRange(points, target);
  const min = weight ? Math.max(0, Math.floor((range.min - 0.5) * 10) / 10) : 0;
  const max = weight ? Math.ceil((range.max + 0.5) * 10) / 10 : Math.max(4, Math.ceil(range.max / 4) * 4);
  const ticks = Array.from({length: 5}, (_, i) => max - i * (max - min) / 4);
  const selected = points.find(point => point.date === selectedDate) ?? points[points.length - 1];
  const width = Math.max(240, plotWidth);
  const slotWidth = width / points.length;
  const labelInterval = Math.max(1, Math.ceil(points.length / 5));
  const targetHeight = typeof target === "number" ? (target - min) / (max - min) * 160 : undefined;
  const targetLabel =
    typeof target === "number" ? `Target ${target.toLocaleString()} ${unit}` : null;

  return (
    <View style={{gap: 10}}>
      <Text style={styles.chartMeta}>{selected.label}: {selected.value.toLocaleString()} {unit}</Text>
      <View style={styles.chartLayout}>
      <View style={styles.yAxis}>
        {ticks.map((tick, index) => <Text key={index} style={{position: "absolute", top: index * 40 - 8, right: 8, fontSize: 11, color: colors.textMuted}}>{tick.toLocaleString(undefined, {maximumFractionDigits: 1})}</Text>)}
      </View>
      <View
        onLayout={({nativeEvent}) => setPlotWidth(nativeEvent.layout.width)}
        style={styles.chartPlot}
      >
      {ticks.map((_, index) => <View key={index} style={{position: "absolute", top: index * 40, width: "100%", borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border}} />)}
      {typeof targetHeight === "number" && targetHeight >= 0 && targetHeight <= 160 && targetLabel ? (
        <View
          pointerEvents="none"
          style={[styles.targetLine, {bottom: 36 + targetHeight}]}
        >
          <Text style={styles.targetLineLabel}>{targetLabel}</Text>
        </View>
      ) : null}
      {points.map((point, index) => {
        const height = (point.value - min) / (max - min) * 160;
        const showDateLabel =
          index === 0 ||
          index === points.length - 1 ||
          (index % labelInterval === 0 && index < points.length - 2);
        const barWidth = Math.max(5, Math.min(14, slotWidth * 0.55));
        const dateLabelWidth = 44;
        const dateLabelLeft =
          index === 0
            ? 0
            : index === points.length - 1
              ? slotWidth - dateLabelWidth
              : (slotWidth - dateLabelWidth) / 2;

        return (
          <Pressable key={point.date} accessibilityRole="button" accessibilityLabel={`${point.label}: ${point.value} ${unit}`}
            accessibilityState={{selected: selected.date === point.date}} onPress={() => setSelectedDate(point.date)}
            style={{position: "absolute", left: index * slotWidth, width: slotWidth, height: 196, alignItems: "center"}}>
            <View style={{position: "absolute", bottom: weight ? 36 + height - 5 : 36, width: weight ? 10 : barWidth, height: weight ? 10 : height, borderRadius: weight ? 5 : 2, backgroundColor: color, opacity: selected.date === point.date ? 1 : 0.7}} />
            {showDateLabel ? <Text numberOfLines={1} style={{position: "absolute", bottom: 10, left: dateLabelLeft, width: dateLabelWidth, textAlign: "center", fontSize: 10, color: colors.textMuted}}>{point.date.slice(5).replace("-", "/")}</Text> : null}
          </Pressable>
        );
      })}
      </View>
      </View>
      <Text style={styles.chartMeta}>Date (month/day) · {unit}{weight ? " · Adjusted weight scale" : ""}</Text>
    </View>
  );
}

function ChartSection({
  label,
  points,
  unit,
  summary,
  target,
}: {
  label: string;
  points: TrendPoint[];
  unit: string;
  summary?: string;
  target?: number;
}) {
  const latestPoint = points[points.length - 1];

  return (
    <View style={styles.chartSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.chartLabel}>{label}</Text>
        <Text style={styles.chartMeta}>
          {summary ?? (latestPoint ? `${latestPoint.value} ${unit}` : "No data")}
        </Text>
      </View>
      <MiniBarChart points={points} unit={unit} weight={label === "Weight"} color={label === "Weight" ? colors.primary : label === "Calories" ? colors.warning : colors.success} target={target} />
      <Text style={styles.insightText}>{describeChartTrend(label, points, unit, target)}</Text>
      <Text style={styles.chartMeta}>Latest {points.length} logged {points.length === 1 ? "day" : "days"} shown</Text>
    </View>
  );
}

export function ProgressChartsCard({
  logs,
  settings,
  unitSystem = "imperial",
}: ProgressChartsCardProps) {
  const weightPoints = buildTrendSeries(logs, "weightLbs").map((point) => ({
    ...point,
    value: Math.round(convertWeightFromLbs(point.value, unitSystem) * 10) / 10,
  }));
  const caloriePoints = buildTrendSeries(logs, "calories");
  const stepPoints = buildTrendSeries(logs, "steps");
  const weightUnit = getWeightUnitLabel(unitSystem);
  const weightSummary = getWeightTrendSummary(logs);
  const weightTarget = typeof settings?.targetWeightLbs === "number"
    ? Math.round(convertWeightFromLbs(settings.targetWeightLbs, unitSystem) * 10) / 10
    : undefined;
  const weightMovingAverage =
    typeof weightSummary.movingAverage7 === "number"
      ? `${Math.round(convertWeightFromLbs(weightSummary.movingAverage7, unitSystem) * 10) / 10} ${weightUnit} 7-day avg`
      : undefined;

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Trends</Text>
        <Text style={styles.body}>Charts only use days where that field was logged.</Text>
      </View>

      <ChartSection label="Weight" points={weightPoints} unit={weightUnit} summary={weightMovingAverage} target={weightTarget} />
      <ChartSection label="Calories" points={caloriePoints} unit="cal" target={settings?.calorieTarget} />
      <ChartSection label="Steps" points={stepPoints} unit="steps" target={settings?.stepTarget} />
    </Card>
  );
}

function describeChartTrend(label: string, points: TrendPoint[], unit: string, target?: number): string {
  if (!points.length) {
    return "Add this field on a daily log to see its trend.";
  }

  const latest = points[points.length - 1];
  if (typeof target === "number") {
    const difference = label === "Weight"
      ? Math.round((latest.value - target) * 10) / 10
      : Math.round(latest.value - target);
    if (difference === 0) {
      return `Latest entry is on the ${label.toLowerCase()} target.`;
    }

    return `Latest entry is ${Math.abs(difference).toLocaleString()} ${unit} ${difference > 0 ? "above" : "below"} the target.`;
  }

  if (points.length < 2) {
    return "Log this field again to compare a direction.";
  }

  const change = latest.value - points[0].value;
  if (Math.abs(change) < (label === "Weight" ? 0.1 : 1)) {
    return `Latest logged value is steady across the displayed entries.`;
  }

  const roundedChange = label === "Weight" ? Math.round(Math.abs(change) * 10) / 10 : Math.round(Math.abs(change));
  return `Latest logged value is ${roundedChange.toLocaleString()} ${unit} ${change > 0 ? "higher" : "lower"} than the first displayed entry.`;
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
  chartLayout: {
    flexDirection: "row",
    paddingTop: 10,
  },
  chartPlot: {
    flex: 1,
    height: 196,
    minWidth: 0,
  },
  yAxis: {
    height: 160,
    width: 52,
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
  insightText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
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
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
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
  strengthMetric: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    flex: 1,
    gap: 2,
    minWidth: 96,
    padding: 10,
  },
  strengthMetricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  strengthMetricValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
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
  targetLine: {
    alignItems: "flex-end",
    borderColor: colors.primary,
    borderTopWidth: 1,
    borderStyle: "dashed",
    left: 0,
    position: "absolute",
    right: 0,
  },
  targetLineLabel: {
    backgroundColor: colors.surface,
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
    paddingLeft: 4,
  },
});
