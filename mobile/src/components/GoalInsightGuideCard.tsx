import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { GoalType } from "../types/fitness";
import { Card } from "./Card";

type GoalInsightGuideCardProps = {
  goal: GoalType;
};

function getGuide(goal: GoalType) {
  if (goal === "cut") {
    return {
      title: "Cutting Signals",
      points: ["Weight trend should move down", "Protein should stay near target", "Steps help confirm activity"],
    };
  }

  if (goal === "bulk") {
    return {
      title: "Bulking Signals",
      points: ["Weight trend should move up slowly", "Training quality matters", "Calories support recovery"],
    };
  }

  return {
    title: "Maintenance Signals",
    points: ["Weight trend should stay stable", "Calories should be consistent", "Steps explain day-to-day movement"],
  };
}

export function GoalInsightGuideCard({ goal }: GoalInsightGuideCardProps) {
  const guide = getGuide(goal);

  return (
    <Card>
      <Text style={styles.title}>{guide.title}</Text>
      <View style={styles.pointList}>
        {guide.points.map((point) => (
          <View key={point} style={styles.pointRow}>
            <View style={styles.dot} />
            <Text style={styles.pointText}>{point}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  dot: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 7,
    marginTop: 7,
    width: 7,
  },
  pointList: {
    gap: 8,
  },
  pointRow: {
    flexDirection: "row",
    gap: 9,
  },
  pointText: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
});
