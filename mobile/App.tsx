import { useEffect, useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import { BottomTabs, MobileTab } from "./src/components/BottomTabs";
import { GoalsScreen } from "./src/screens/GoalsScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ProgressScreen } from "./src/screens/ProgressScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { TodayScreen } from "./src/screens/TodayScreen";
import { TrainingScreen } from "./src/screens/TrainingScreen";
import { loadUserSettings } from "./src/storage/mobileStorage";
import { colors } from "./src/theme/colors";
import { UserSettings } from "./src/types/fitness";

function renderScreen(activeTab: MobileTab, onDataReset: () => void) {
  switch (activeTab) {
    case "training":
      return <TrainingScreen />;
    case "progress":
      return <ProgressScreen />;
    case "goals":
      return <GoalsScreen />;
    case "settings":
      return <SettingsScreen onDataReset={onDataReset} />;
    case "today":
    default:
      return <TodayScreen />;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<MobileTab>("today");
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const settings = await loadUserSettings();
        if (isMounted) {
          setHasCompletedOnboarding(Boolean(settings?.hasCompletedOnboarding || settings));
        }
      } finally {
        if (isMounted) {
          setIsLoadingSettings(false);
        }
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  function completeOnboarding(_settings: UserSettings) {
    setHasCompletedOnboarding(true);
    setActiveTab("today");
  }

  function handleDataReset() {
    setHasCompletedOnboarding(false);
    setActiveTab("today");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.app}>
        {isLoadingSettings ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingTitle}>FitCheck AI</Text>
            <Text style={styles.loadingBody}>Loading your mobile workspace</Text>
          </View>
        ) : hasCompletedOnboarding ? (
          <>
            {renderScreen(activeTab, handleDataReset)}
            <BottomTabs activeTab={activeTab} onChange={setActiveTab} />
          </>
        ) : (
          <OnboardingScreen onComplete={completeOnboarding} />
        )}
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
  loadingBody: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "700",
  },
  loadingState: {
    alignItems: "center",
    flex: 1,
    gap: 8,
    justifyContent: "center",
    padding: 24,
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
});
