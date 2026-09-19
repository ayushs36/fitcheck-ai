import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export type MobileTab = "today" | "training" | "progress" | "goals" | "settings";

const tabItems: { icon: string; label: string; value: MobileTab }[] = [
  { icon: "+", label: "Today", value: "today" },
  { icon: "kg", label: "Train", value: "training" },
  { icon: "~", label: "Progress", value: "progress" },
  { icon: ">", label: "Goals", value: "goals" },
  { icon: "=", label: "Account", value: "settings" },
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
            accessibilityState={{selected: isActive}}
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
    borderRadius: 0,
    borderWidth: 1,
    bottom: 0,
    flexDirection: "row",
    gap: 4,
    left: 0,
    padding: 6,
    position: "absolute",
    right: 0,
  },
  tab: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    minHeight: 52,
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
