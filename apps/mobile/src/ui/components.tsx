import React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "./theme";

export function Screen({
  children,
  onRefresh,
  refreshing = false,
  padded = true,
}: {
  children: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  padded?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        padded ? styles.screenContent : null,
        { paddingBottom: insets.bottom + spacing.xxl },
      ]}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

export function Card({ title, children, style }: { title?: string; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <Text style={typography.muted}>{children}</Text>;
}

export function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const toneStyles: Record<Tone, { background: string; text: string }> = {
  neutral: { background: colors.border, text: colors.text },
  success: { background: colors.successSoft, text: colors.success },
  warning: { background: colors.warningSoft, text: colors.warning },
  danger: { background: colors.dangerSoft, text: colors.danger },
  info: { background: colors.infoSoft, text: colors.info },
};

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  const tones = toneStyles[tone];
  return (
    <View style={[styles.pill, { backgroundColor: tones.background }]}>
      <Text style={[styles.pillText, { color: tones.text }]}>{children}</Text>
    </View>
  );
}

export function Banner({ tone = "info", children }: { tone?: Tone; children: React.ReactNode }) {
  const tones = toneStyles[tone];
  return (
    <View style={[styles.banner, { backgroundColor: tones.background }]}>
      <Text style={[styles.bannerText, { color: tones.text }]}>{children}</Text>
    </View>
  );
}

export function Button({
  title,
  onPress,
  disabled,
  loading,
  variant = "primary",
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const isDisabled = disabled || loading;
  const background = variant === "primary" ? colors.primary : variant === "danger" ? colors.danger : colors.surface;
  const textColor = variant === "secondary" ? colors.text : colors.primaryText;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, opacity: isDisabled ? 0.6 : pressed ? 0.85 : 1 },
        variant === "secondary" ? styles.buttonSecondary : null,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>}
    </Pressable>
  );
}

export function Field({ label, hint, ...inputProps }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={styles.field}>
      <Label>{label}</Label>
      <TextInput
        placeholderTextColor={colors.textMuted}
        {...inputProps}
        style={[styles.input, inputProps.multiline ? styles.inputMultiline : null, inputProps.style]}
      />
      {hint ? <Muted>{hint}</Muted> : null}
    </View>
  );
}

/** A horizontal set of mutually exclusive choices; large targets for gloved or hurried thumbs. */
export function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.field}>
      <Label>{label}</Label>
      <View style={styles.choices}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.choice, selected ? styles.choiceSelected : null]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.choiceText, selected ? styles.choiceTextSelected : null]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
      <Muted>{label}</Muted>
    </View>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.empty}>
      <Muted>{children}</Muted>
    </View>
  );
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export function humanize(value: string): string {
  return value.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenContent: { padding: spacing.lg, gap: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: { ...typography.heading },
  label: { ...typography.label, marginBottom: spacing.xs },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, paddingVertical: spacing.xs },
  rowLabel: { ...typography.muted, flexShrink: 0 },
  rowValue: { ...typography.body, textAlign: "right", flexShrink: 1 },
  pill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  pillText: { fontSize: 13, fontWeight: "600" },
  banner: { borderRadius: radius.md, padding: spacing.md },
  bannerText: { fontSize: 15, lineHeight: 21 },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  buttonSecondary: { borderWidth: 1, borderColor: colors.border },
  buttonText: { fontSize: 17, fontWeight: "600" },
  field: { gap: spacing.xs },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: "top" },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  choice: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  choiceSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  choiceText: { fontSize: 15, color: colors.text },
  choiceTextSelected: { color: colors.primaryText, fontWeight: "600" },
  loading: { alignItems: "center", gap: spacing.sm, padding: spacing.xl },
  empty: { alignItems: "center", padding: spacing.xl },
});
