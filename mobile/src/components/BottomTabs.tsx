import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export type MobileTab = "today" | "training" | "progress" | "goals" | "settings";

const tabItems: { label: string; value: MobileTab }[] = [
  { label: "Today", value: "today" },
  { label: "Train", value: "training" },
  { label: "Progress", value: "progress" },
  { label: "Goals", value: "goals" },
  { label: "Settings", value: "settings" },
];

type BottomTabsProps = {
  activeTab: MobileTab;
  onChange: (tab: MobileTab) => void;
};

export function BottomTabs({ activeTab, onChange }: BottomTabsProps) {
  return (
    <View style={styles.shell}>
      {tabItems.map((item) => {
        const isActive = item.value === activeTab;
        return (
          <Pressable
            accessibilityRole="tab"
            key={item.value}
            onPress={() => onChange(item.value)}
            style={[styles.tab, isActive && styles.activeTab]}
          >
            <Text style={[styles.label, isActive && styles.activeLabel]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    bottom: 20,
    flexDirection: "row",
    gap: 4,
    left: 16,
    padding: 6,
    position: "absolute",
    right: 16,
    shadowColor: "#0B1220",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  tab: {
    alignItems: "center",
    borderRadius: 18,
    flex: 1,
    minHeight: 46,
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: colors.primarySoft,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  activeLabel: {
    color: colors.primary,
  },
});
