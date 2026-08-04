import { StyleSheet, Text } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";

export function TrainingScreen() {
  return (
    <Screen
      title="Training"
      subtitle="Workout history, exercise logging, form focus, and progression will live here."
    >
      <Card>
        <Text style={styles.title}>Training foundation</Text>
        <Text style={styles.body}>
          Next step: add exercise templates, last workout recall, bodyweight exercise tracking, and
          2-3 week progression signals.
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
