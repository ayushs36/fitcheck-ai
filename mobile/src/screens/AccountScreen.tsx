import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import { useMobileStorage } from "../storage/StorageProvider";
import { colors } from "../theme/colors";
import { MobileAccount } from "../types/fitness";

type AccountScreenProps = {
  onComplete: (account: MobileAccount) => void;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function AccountScreen({ onComplete }: AccountScreenProps) {
  const { saveMobileAccount } = useMobileStorage();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  async function createAccount() {
    const cleanName = displayName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      Alert.alert("Name required", "Add your name to continue.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      Alert.alert("Email required", "Add a valid email to continue.");
      return;
    }

    const now = new Date().toISOString();
    const account: MobileAccount = {
      id: `local-${Date.now()}`,
      displayName: cleanName,
      email: cleanEmail,
      authProvider: "local",
      privateAIAccess: "backend-required",
      createdAt: now,
      updatedAt: now,
    };

    await saveMobileAccount(account);
    onComplete(account);
  }

  return (
    <Screen
      title="Create Account"
      subtitle="Set up your FitCheck profile before choosing your goal."
    >
      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>FitCheck Coach</Text>
          <Text style={styles.body}>
            Your logs stay on this device. Cloud login and private AI access will use a secure
            backend instead of storing an API key in the app.
          </Text>
        </View>

        <TextField
          autoCapitalize="words"
          label="Name"
          onChangeText={setDisplayName}
          placeholder="Your name"
          value={displayName}
        />

        <TextField
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="you@example.com"
          value={email}
        />

        <Pressable accessibilityRole="button" onPress={createAccount} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  header: {
    gap: 6,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 15,
    minHeight: 52,
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "800",
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
});
