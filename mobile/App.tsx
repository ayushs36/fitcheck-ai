import { useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { BottomTabs, MobileTab } from "./src/components/BottomTabs";
import { GoalsScreen } from "./src/screens/GoalsScreen";
import { ProgressScreen } from "./src/screens/ProgressScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { TodayScreen } from "./src/screens/TodayScreen";
import { TrainingScreen } from "./src/screens/TrainingScreen";
import { colors } from "./src/theme/colors";

function renderScreen(activeTab: MobileTab) {
  switch (activeTab) {
    case "training":
      return <TrainingScreen />;
    case "progress":
      return <ProgressScreen />;
    case "goals":
      return <GoalsScreen />;
    case "settings":
      return <SettingsScreen />;
    case "today":
    default:
      return <TodayScreen />;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<MobileTab>("today");

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.app}>
        {renderScreen(activeTab)}
        <BottomTabs activeTab={activeTab} onChange={setActiveTab} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: colors.background,
    flex: 1,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
