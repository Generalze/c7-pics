import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { AuthProvider, useAuth } from "../src/lib/auth";
import { Loading } from "../src/ui/components";
import { colors } from "../src/ui/theme";

function RootNavigator() {
  const { isBootstrapping, token, user } = useAuth();
  if (isBootstrapping) {
    return <Loading label="Checking your session…" />;
  }
  const signedIn = Boolean(token && user);
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.primaryText,
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="incident" options={{ title: "Report an incident", presentation: "modal" }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}
