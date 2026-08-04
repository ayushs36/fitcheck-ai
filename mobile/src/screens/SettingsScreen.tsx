import { StyleSheet, Text } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";

export function SettingsScreen() {
  return (
    <Screen
      title="Settings"
      subtitle="Manage units, data, and future App Store preferences."
    >
      <Card>
        <Text style={styles.title}>Private by default</Text>
        <Text style={styles.body}>
          Logs are stored on-device in the mobile app foundation. No OpenAI API key is included in
          the public mobile client.
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
