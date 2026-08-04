import { StyleSheet, Text } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";

export function GoalsScreen() {
  return (
    <Screen
      title="Goals"
      subtitle="Set whether the app should interpret your logs for fat loss, maintenance, or muscle gain."
    >
      <Card>
        <Text style={styles.title}>Goal setup</Text>
        <Text style={styles.body}>
          Upcoming work: goal pace, target weight, calorie target, protein target, and step target.
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
