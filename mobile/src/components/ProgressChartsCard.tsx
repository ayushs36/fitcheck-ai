import {useRef, useState} from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { DailyLog } from "../types/fitness";
import { buildTrendSeries, TrendPoint } from "../utils/trendSeries";
import { convertWeightFromLbs, getWeightUnitLabel, UnitSystem } from "../utils/units";
import { Card } from "./Card";

type ProgressChartsCardProps = {
  logs: DailyLog[];
  unitSystem?: UnitSystem;
};

function getRange(points: TrendPoint[]): { min: number; max: number } {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { min, max: min === max ? min + 1 : max };
}

function MiniBarChart({ points, unit, color, weight }: { points: TrendPoint[]; unit: string; color: string; weight: boolean }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const scroll = useRef<ScrollView>(null);
  if (points.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>No logged data yet</Text>
      </View>
    );
  }

  const range = getRange(points);
  const min = weight ? Math.max(0, Math.floor((range.min - 0.5) * 10) / 10) : 0;
  const max = weight ? Math.ceil((range.max + 0.5) * 10) / 10 : Math.max(4, Math.ceil(range.max / 4) * 4);
  const ticks = Array.from({length: 5}, (_, i) => max - i * (max - min) / 4);
  const start = Date.parse(`${points[0].date}T12:00:00Z`);
  const end = Date.parse(`${points[points.length - 1].date}T12:00:00Z`);
  const days = Math.round((end - start) / 86400000) + 1;
  const selected = points.find(point => point.date === selectedDate) ?? points[points.length - 1];
  const width = Math.max(240, days * 48);

  return (
    <View style={{gap: 10}}>
      <Text style={styles.chartMeta}>{selected.label}: {selected.value.toLocaleString()} {unit}</Text>
      <View style={{flexDirection: "row", paddingTop: 10}}>
      <View style={{width: 60, height: 160}}>
        {ticks.map((tick, index) => <Text key={index} style={{position: "absolute", top: index * 40 - 8, right: 8, fontSize: 11, color: colors.textMuted}}>{tick.toLocaleString(undefined, {maximumFractionDigits: 1})}</Text>)}
      </View>
      <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator onContentSizeChange={() => scroll.current?.scrollToEnd({animated: false})}>
      <View style={{width, height: 196}}>
      {ticks.map((_, index) => <View key={index} style={{position: "absolute", top: index * 40, width: "100%", borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border}} />)}
      {points.map((point) => {
        const height = (point.value - min) / (max - min) * 160;
        const offset = Math.round((Date.parse(`${point.date}T12:00:00Z`) - start) / 86400000);

        return (
          <Pressable key={point.date} accessibilityRole="button" accessibilityLabel={`${point.label}: ${point.value} ${unit}`}
            accessibilityState={{selected: selected.date === point.date}} onPress={() => setSelectedDate(point.date)}
            style={{position: "absolute", left: offset / days * width, width: width / days, height: 196, alignItems: "center"}}>
            <View style={{position: "absolute", bottom: weight ? 36 + height - 5 : 36, width: weight ? 10 : 18, height: weight ? 10 : height, borderRadius: weight ? 5 : 2, backgroundColor: color, opacity: selected.date === point.date ? 1 : 0.7}} />
            <Text style={{position: "absolute", bottom: 10, fontSize: 10, color: colors.textMuted}}>{point.date.slice(5).replace("-", "/")}</Text>
          </Pressable>
        );
      })}
      </View>
      </ScrollView>
      </View>
      <Text style={styles.chartMeta}>Date (month/day) · {unit}{weight ? " · Adjusted weight scale" : ""}</Text>
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
      <MiniBarChart points={points} unit={unit} weight={label === "Weight"} color={label === "Weight" ? colors.primary : label === "Calories" ? colors.warning : colors.success} />
      <Text style={styles.chartMeta}>{points.length} logged days shown</Text>
    </View>
  );
}

export function ProgressChartsCard({
  logs,
  unitSystem = "imperial",
}: ProgressChartsCardProps) {
  const weightPoints = buildTrendSeries(logs, "weightLbs").map((point) => ({
    ...point,
    value: Math.round(convertWeightFromLbs(point.value, unitSystem) * 10) / 10,
  }));
  const caloriePoints = buildTrendSeries(logs, "calories");
  const stepPoints = buildTrendSeries(logs, "steps");
  const weightUnit = getWeightUnitLabel(unitSystem);

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Trends</Text>
        <Text style={styles.body}>Charts only use days where that field was logged.</Text>
      </View>

      <ChartSection label="Weight" points={weightPoints} unit={weightUnit} />
      <ChartSection label="Calories" points={caloriePoints} unit="cal" />
      <ChartSection label="Steps" points={stepPoints} unit="steps" />
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
});
