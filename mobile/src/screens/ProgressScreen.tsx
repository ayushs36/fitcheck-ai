import { StyleSheet, Text } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";

export function ProgressScreen() {
  return (
    <Screen
      title="Progress"
      subtitle="Weight, calories, protein, steps, and strength trends will be separated from daily logging."
    >
      <Card>
        <Text style={styles.title}>Trend dashboard</Text>
        <Text style={styles.body}>
          This screen will show goal-aware progress for cutting, maintaining, or bulking without
          penalizing missing fields.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
});
