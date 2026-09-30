import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme/colors";

type InfoButtonProps = {
  title: string;
  message: string;
};

export function InfoButton({ title, message }: InfoButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`About ${title}`}
      hitSlop={8}
      onPress={() => Alert.alert(title, message)}
      style={styles.button}
    >
      <Text style={styles.label}>i</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  label: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 16,
  },
});
