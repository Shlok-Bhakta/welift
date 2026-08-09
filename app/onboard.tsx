import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Body, Button, Field, Screen } from "../src/components/ui";
import { useWelift } from "../src/store/welift";
import { space } from "../src/theme";

export default function OnboardScreen() {
  const insets = useSafeAreaInsets();
  const createProfile = useWelift((s) => s.createProfile);
  const [name, setName] = useState("");

  const openWeek = () => {
    if (!name.trim()) return;
    createProfile(name);
    router.replace("/week");
  };

  return (
    <Screen
      style={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 16,
        paddingHorizontal: 20,
      }}
    >
      <KeyboardAvoidingView
        style={styles.avoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <View style={styles.form}>
          <Body style={styles.label}>Enter your name</Body>
          <Field
            value={name}
            onChangeText={setName}
            placeholder="Name"
            accessibilityLabel="Enter your name"
            testID="onboard-name"
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={openWeek}
          />
        </View>

        <Button label="Next" onPress={openWeek} testID="onboard-next" />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avoid: {
    flex: 1,
  },
  form: {
    flex: 1,
    justifyContent: "center",
    gap: space.md,
  },
  label: {
    fontSize: 22,
  },
});
