import { Tabs } from "expo-router";
import * as Haptics from "expo-haptics";

import { TabIcon } from "../../src/components/TabIcon";
import { colors, type } from "../../src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.bg2,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontFamily: "DMSans_600SemiBold",
          fontSize: type.tab,
          letterSpacing: 0.2,
        },
      }}
      screenListeners={{
        tabPress: () => {
          void Haptics.selectionAsync().catch(() => undefined);
        },
      }}
    >
      <Tabs.Screen
        name="week"
        options={{
          title: "Week",
          tabBarButtonTestID: "week-tab",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="week" color={String(color)} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarButtonTestID: "progress-tab",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="progress" color={String(color)} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: "People",
          tabBarButtonTestID: "people-tab",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="people" color={String(color)} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
