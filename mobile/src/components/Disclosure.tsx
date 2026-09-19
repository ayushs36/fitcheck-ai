import {useState, type ReactNode} from "react";
import {Pressable, StyleSheet, Text, View} from "react-native";
import {colors} from "../theme/colors";

export function Disclosure({title, children, initiallyOpen = false}: {
  title: string; children: ReactNode; initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return <View style={styles.section}>
    <Pressable accessibilityRole="button" accessibilityState={{expanded: open}}
      onPress={() => setOpen(value => !value)} style={styles.trigger}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.indicator}>{open ? "−" : "+"}</Text>
    </Pressable>
    {open && <View style={styles.content}>{children}</View>}
  </View>;
}
const styles = StyleSheet.create({
  section: {borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border},
  trigger: {minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12},
  title: {color: colors.text, fontSize: 15, fontWeight: "600", flex: 1},
  indicator: {color: colors.primary, fontSize: 22},
  content: {gap: 12, paddingBottom: 8},
});
