import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export type MobileTab = "today" | "training" | "progress" | "goals" | "settings";

const tabItems: { icon: string; label: string; value: MobileTab }[] = [
  { icon: "+", label: "Today", value: "today" },
  { icon: "kg", label: "Train", value: "training" },
  { icon: "~", label: "Progress", value: "progress" },
  { icon: ">", label: "Goals", value: "goals" },
  { icon: "=", label: "Settings", value: "settings" },
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
            <Text style={[styles.icon, isActive && styles.activeLabel]}>{item.icon}</Text>
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
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  tab: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    minHeight: 46,
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: colors.primarySoft,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
  },
  icon: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 13,
  },
  activeLabel: {
    color: colors.primary,
  },
});
