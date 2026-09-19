import {useState} from "react";
import {Modal, Pressable, ScrollView, StyleSheet, Text, View} from "react-native";
import {colors} from "../theme/colors";

export function SelectMenu<T extends string>({label, value, options, onChange}: {
  label: string; value?: T; options: {label: string; value: T}[]; onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{expanded: open}}
      onPress={() => setOpen(true)} style={styles.trigger}>
      <Text style={styles.text}>{options.find(option => option.value === value)?.label ?? label}</Text>
      <Text style={styles.text}>⌄</Text>
    </Pressable>
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Dismiss menu" onPress={() => setOpen(false)} />
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text style={styles.title}>{label}</Text>
          <ScrollView>
            {options.map(option => <Pressable key={option.value} accessibilityRole="button"
              accessibilityState={{selected: value === option.value}} style={styles.option}
              onPress={() => {setOpen(false); onChange(option.value);}}>
              <Text style={[styles.text, value === option.value && styles.selected]}>{option.label}</Text>
            </Pressable>)}
          </ScrollView>
          <Pressable accessibilityRole="button" style={styles.option} onPress={() => setOpen(false)}><Text style={styles.selected}>Cancel</Text></Pressable>
        </View>
      </View>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  trigger: {minHeight: 48, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8, flexDirection: "row", justifyContent: "space-between", gap: 12},
  text: {fontSize: 16, color: colors.text, flexShrink: 1},
  title: {fontSize: 18, fontWeight: "700", color: colors.text, paddingVertical: 12},
  selected: {fontSize: 16, fontWeight: "700", color: colors.primary},
  overlay: {flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.4)"},
  sheet: {maxHeight: "80%", width: "100%", maxWidth: 520, alignSelf: "center", backgroundColor: colors.surface, padding: 16, borderRadius: 8},
  option: {minHeight: 48, justifyContent: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border},
});
