import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { GlassSurface } from "../src/components/GlassSurface";
import { Button, Display, Field, Mini, Muted, Screen } from "../src/components/ui";
import { useWelift } from "../src/store/welift";
import { colors, space } from "../src/theme";

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
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: 18,
      }}
    >
      <KeyboardAvoidingView
        style={styles.avoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.brand}>
          <GlassSurface style={styles.logo}>
            <Svg width={30} height={30} viewBox="0 0 64 64" fill={colors.accent}>
              <Rect x="6" y="28" width="52" height="8" rx="2" />
              <Rect x="10" y="18" width="8" height="28" rx="2" />
              <Rect x="46" y="18" width="8" height="28" rx="2" />
              <Path d="M26 22c0-2 1.5-4 6-4s6 2 6 4v20c0 2-1.5 4-6 4s-6-2-6-4V22z" />
              <Circle cx="32" cy="12" r="3" />
            </Svg>
          </GlassSurface>
          <Mini>Ultimate week</Mini>
        </View>

        <View style={styles.form}>
          <Mini>Your name</Mini>
          <Field
            value={name}
            onChangeText={setName}
            placeholder="Shlok"
            accessibilityLabel="Your name"
            testID="onboard-name"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={openWeek}
          />
          <Button label="Open my week" onPress={openWeek} />
        </View>

        <View style={styles.copy}>
          <Display style={styles.title}>
            Chalk warmth.{"\n"}Tide lines.
          </Display>
          <Muted>
            Rolling 7 days. Tap a day to log or edit. Weight or time — your call.
          </Muted>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avoid: {
    flex: 1,
    gap: space.xl,
  },
  brand: {
    gap: space.sm,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  form: {
    gap: 12,
  },
  copy: {
    gap: space.md,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  title: {
    fontSize: 50,
    lineHeight: 50,
    marginVertical: 4,
  },
});
