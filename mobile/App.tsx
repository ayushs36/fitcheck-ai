import { useEffect, useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import { BottomTabs, MobileTab } from "./src/components/BottomTabs";
import { AccountScreen } from "./src/screens/AccountScreen";
import { GoalsScreen } from "./src/screens/GoalsScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ProgressScreen } from "./src/screens/ProgressScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { TodayScreen } from "./src/screens/TodayScreen";
import { TrainingScreen } from "./src/screens/TrainingScreen";
import { loadMobileAccount, loadUserSettings } from "./src/storage/mobileStorage";
import { colors } from "./src/theme/colors";
import { MobileAccount, UserSettings } from "./src/types/fitness";

function renderScreen(
  activeTab: MobileTab,
  onDataReset: () => void,
  onAccountSignedOut: () => void,
) {
  switch (activeTab) {
    case "training":
      return <TrainingScreen />;
    case "progress":
      return <ProgressScreen />;
    case "goals":
      return <GoalsScreen />;
    case "settings":
      return (
        <SettingsScreen
          onAccountSignedOut={onAccountSignedOut}
          onDataReset={onDataReset}
        />
      );
    case "today":
    default:
      return <TodayScreen />;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<MobileTab>("today");
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [hasAccount, setHasAccount] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const [account, settings] = await Promise.all([
          loadMobileAccount(),
          loadUserSettings(),
        ]);
        if (isMounted) {
          setHasAccount(Boolean(account));
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

  function completeAccount(_account: MobileAccount) {
    setHasAccount(true);
  }

  function handleDataReset() {
    setHasAccount(false);
    setHasCompletedOnboarding(false);
    setActiveTab("today");
  }

  function handleAccountSignedOut() {
    setHasAccount(false);
    setActiveTab("today");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.app}>
        {isLoadingSettings ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingTitle}>FitCheck Coach</Text>
            <Text style={styles.loadingBody}>Loading your mobile workspace</Text>
          </View>
        ) : !hasAccount ? (
          <AccountScreen onComplete={completeAccount} />
        ) : hasCompletedOnboarding ? (
          <>
            {renderScreen(activeTab, handleDataReset, handleAccountSignedOut)}
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
