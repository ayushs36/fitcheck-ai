import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

type Option<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.option, isSelected && styles.selectedOption]}
          >
            <Text style={[styles.label, isSelected && styles.selectedLabel]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    flexDirection: "row",
    padding: 4,
  },
  option: {
    alignItems: "center",
    borderRadius: 11,
    flex: 1,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  selectedOption: {
    backgroundColor: colors.surface,
    shadowColor: "#0B1220",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  label: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
  selectedLabel: {
    color: colors.primary,
  },
});
