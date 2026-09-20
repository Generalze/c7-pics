/** A light, high-contrast palette: this app is used outdoors, in daylight, on cheap screens. */
export const colors = {
  navy: "#0b1a2b",
  navySoft: "#16324a",
  primary: "#0f7b4f",
  primaryText: "#ffffff",
  background: "#f4f6f8",
  surface: "#ffffff",
  border: "#d7dde3",
  text: "#101820",
  textMuted: "#5b6b7a",
  danger: "#b3261e",
  dangerSoft: "#fbe9e7",
  warning: "#8a5a00",
  warningSoft: "#fff3d6",
  success: "#0f7b4f",
  successSoft: "#e3f4ec",
  info: "#1f5f9e",
  infoSoft: "#e5eef8",
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 6, md: 10, lg: 14 } as const;

export const typography = {
  title: { fontSize: 24, fontWeight: "700" as const, color: colors.text },
  heading: { fontSize: 18, fontWeight: "600" as const, color: colors.text },
  body: { fontSize: 16, color: colors.text },
  label: { fontSize: 13, fontWeight: "600" as const, color: colors.textMuted, textTransform: "uppercase" as const, letterSpacing: 0.4 },
  muted: { fontSize: 14, color: colors.textMuted },
  mono: { fontSize: 14, color: colors.text, fontFamily: "monospace" },
} as const;
