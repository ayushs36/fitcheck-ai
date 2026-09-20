import {useState} from "react";
import {Pressable, StyleSheet, Text, View} from "react-native";
import type {DailyLog} from "../types/fitness";
import type {UnitSystem} from "../utils/units";
import {groupLogHistory} from "../utils/logHistory";
import {colors} from "../theme/colors";
import {RecentLogsList} from "./RecentLogsList";

export function LogHistory({logs, unitSystem, selectedDate, onSelectLog}: {
  logs: DailyLog[]; unitSystem: UnitSystem; selectedDate?: string; onSelectLog: (log: DailyLog) => void;
}) {
  const [expanded, setExpanded] = useState<string[]>([]);
  if (!logs.length) return <Text style={styles.count}>No logs yet.</Text>;
  return <View style={styles.groups}>
    {groupLogHistory(logs).map(group => {
      const open = expanded.includes(group.key);
      return <View key={group.key} style={styles.group}>
        <Pressable accessibilityRole="button" accessibilityState={{expanded: open}}
          accessibilityLabel={`${group.monthYear}, ${group.logs.length} logs`}
          style={styles.header} onPress={() => setExpanded(current => open
            ? current.filter(key => key !== group.key) : [...current, group.key])}>
          <View style={styles.heading}>
            <Text style={styles.title}>{group.monthYear}</Text>
            <Text style={styles.count}>{group.logs.length} log{group.logs.length === 1 ? "" : "s"}</Text>
          </View>
          <Text style={styles.action}>{open ? "Hide" : "View"}</Text>
        </Pressable>
        {open && <RecentLogsList logs={group.logs} unitSystem={unitSystem} selectedDate={selectedDate} onSelectLog={onSelectLog} />}
      </View>;
    })}
  </View>;
}
const styles = StyleSheet.create({
  groups: {gap: 16},
  group: {borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: 12},
  header: {minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12},
  heading: {flex: 1, gap: 4},
  title: {fontSize: 18, fontWeight: "600", color: colors.text},
  count: {fontSize: 14, color: colors.textMuted},
  action: {fontSize: 14, fontWeight: "600", color: colors.primary},
});
