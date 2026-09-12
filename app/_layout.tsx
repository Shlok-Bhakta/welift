import { Stack } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";

import { Loading, useWeliftFonts } from "../src/components/ui";
import { colors } from "../src/theme";
import { useWelift } from "../src/store/welift";

export default function RootLayout() {
  const [fontsLoaded] = useWeliftFonts();
  const hydrated = useWelift((s) => s.hydrated);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg);
  }, []);

  if (!fontsLoaded || !hydrated) return <Loading />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: "fade",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="session"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="onboard" />
        <Stack.Screen name="index" />
      </Stack>
    </GestureHandlerRootView>
  );
}
