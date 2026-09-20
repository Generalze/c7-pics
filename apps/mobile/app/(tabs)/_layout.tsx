import { Tabs } from "expo-router";
import React from "react";
import { Text, type ColorValue } from "react-native";
import { colors } from "../../src/ui/theme";

function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{glyph}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.primaryText,
        headerTitleStyle: { fontWeight: "600" },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 64, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Status", tabBarIcon: ({ color }) => <TabIcon glyph="◉" color={color} /> }} />
      <Tabs.Screen name="duty" options={{ title: "Duty", tabBarIcon: ({ color }) => <TabIcon glyph="◎" color={color} /> }} />
      <Tabs.Screen name="report" options={{ title: "Report", tabBarIcon: ({ color }) => <TabIcon glyph="▤" color={color} /> }} />
      <Tabs.Screen name="tasks" options={{ title: "Tasks", tabBarIcon: ({ color }) => <TabIcon glyph="☑" color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: ({ color }) => <TabIcon glyph="≡" color={color} /> }} />
    </Tabs>
  );
}
