import { Tabs } from "expo-router";

import { colors } from "../../src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg2,
          borderTopColor: colors.line,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen name="week" options={{ title: "Week", tabBarButtonTestID: "week-tab" }} />
      <Tabs.Screen
        name="progress"
        options={{ title: "Progress", tabBarButtonTestID: "progress-tab" }}
      />
      <Tabs.Screen
        name="people"
        options={{ title: "People", tabBarButtonTestID: "people-tab" }}
      />
    </Tabs>
  );
}
