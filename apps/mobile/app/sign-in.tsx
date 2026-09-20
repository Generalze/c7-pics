import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { describeError, useAuth } from "../src/lib/auth";
import { API_BASE_URL } from "../src/lib/config";
import { Banner, Button, Field } from "../src/ui/components";
import { colors, radius, spacing, typography } from "../src/ui/theme";

export default function SignInScreen() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = email.trim().length > 3 && password.length >= 8 && consent && !busy;

  async function handleSubmit() {
    setBusy(true);
    setError("");
    try {
      await signIn(email, password);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.brand}>PICS Agent</Text>
        <Text style={styles.tagline}>Polling unit field operations · Ogun State</Text>
      </View>

      <View style={styles.form}>
        {error ? <Banner tone="danger">{error}</Banner> : null}
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="username"
          autoComplete="email"
          editable={!busy}
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          autoComplete="password"
          editable={!busy}
          onSubmitEditing={canSubmit ? handleSubmit : undefined}
        />

        <Pressable
          onPress={() => setConsent((value) => !value)}
          style={styles.consentRow}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consent }}
        >
          <View style={[styles.checkbox, consent ? styles.checkboxChecked : null]}>
            {consent ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.consentText}>
            I agree that PICS records my location when I check in and while I am on duty at my polling unit. Sign-in is
            refused without this consent.
          </Text>
        </Pressable>

        <Button title={busy ? "Signing in…" : "Sign in"} onPress={handleSubmit} disabled={!canSubmit} loading={busy} />
      </View>

      <Text style={styles.footer}>Server: {API_BASE_URL.replace(/^https?:\/\//, "")}</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy, paddingHorizontal: spacing.xl, justifyContent: "space-between" },
  header: { gap: spacing.xs },
  brand: { fontSize: 34, fontWeight: "800", color: colors.primaryText },
  tagline: { fontSize: 15, color: "#b9c6d3" },
  form: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.lg },
  consentRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: colors.primaryText, fontWeight: "700" },
  consentText: { ...typography.muted, flex: 1, lineHeight: 20 },
  footer: { color: "#7f93a6", fontSize: 12, textAlign: "center" },
});
