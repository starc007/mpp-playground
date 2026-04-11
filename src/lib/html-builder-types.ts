/**
 * Types and presets for the HTML Builder.
 * Maps to mppx's `Html.Config` — the `theme` and `text` fields
 * passed to `tempo.charge({ html: { theme, text } })`.
 */

/** Light/dark color pair — mppx accepts [light, dark] tuples. */
export type LightDark = [string, string];

export interface HtmlTheme {
  colorScheme: "light" | "dark" | "light dark";
  accent: LightDark;
  background: LightDark;
  border: LightDark;
  foreground: LightDark;
  muted: LightDark;
  negative: LightDark;
  positive: LightDark;
  surface: LightDark;
  fontFamily: string;
  /** Google Fonts URL injected as a <link> in the payment page. */
  fontUrl?: string;
  fontSizeBase: string;
  radius: string;
  spacingUnit: string;
}

export interface HtmlText {
  title: string;
  pay: string;
  paymentRequired: string;
  expires: string;
}

export interface HtmlConfig {
  theme: HtmlTheme;
  text: HtmlText;
}

/** mppx defaults from config.ts */
export const DEFAULT_THEME: HtmlTheme = {
  colorScheme: "light dark",
  accent: ["#171717", "#ededed"],
  background: ["#ffffff", "#0a0a0a"],
  border: ["#e5e5e5", "#2e2e2e"],
  foreground: ["#0a0a0a", "#ededed"],
  muted: ["#666666", "#a1a1a1"],
  negative: ["#e5484d", "#e5484d"],
  positive: ["#30a46c", "#30a46c"],
  surface: ["#f5f5f5", "#1a1a1a"],
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontSizeBase: "16px",
  radius: "6px",
  spacingUnit: "2px",
};

export const DEFAULT_TEXT: HtmlText = {
  title: "Payment Required",
  pay: "Pay",
  paymentRequired: "Payment Required",
  expires: "Expires at",
};

/** Color token metadata for rendering the form. */
export const COLOR_TOKENS = [
  { key: "accent", label: "Accent", description: "Buttons, links" },
  { key: "background", label: "Background", description: "Page background" },
  { key: "surface", label: "Surface", description: "Card background" },
  { key: "foreground", label: "Foreground", description: "Primary text" },
  { key: "muted", label: "Muted", description: "Secondary text" },
  { key: "border", label: "Border", description: "Borders" },
  { key: "positive", label: "Positive", description: "Success states" },
  { key: "negative", label: "Negative", description: "Error states" },
] as const;

export const TEXT_FIELDS = [
  { key: "title", label: "Page title" },
  { key: "pay", label: "Pay button" },
  { key: "paymentRequired", label: "Badge label" },
  { key: "expires", label: "Expiry prefix" },
] as const;

/** Presets */
export interface Preset {
  name: string;
  theme: HtmlTheme;
}

export const PRESETS: Preset[] = [
  {
    name: "Default",
    theme: { ...DEFAULT_THEME },
  },
  {
    name: "Dark",
    theme: {
      ...DEFAULT_THEME,
      colorScheme: "dark",
      accent: ["#ededed", "#ededed"],
      background: ["#0a0a0a", "#0a0a0a"],
      border: ["#2e2e2e", "#2e2e2e"],
      foreground: ["#ededed", "#ededed"],
      muted: ["#a1a1a1", "#a1a1a1"],
      surface: ["#1a1a1a", "#1a1a1a"],
    },
  },
  {
    name: "Tempo Green",
    theme: {
      ...DEFAULT_THEME,
      colorScheme: "dark",
      accent: ["#4ade80", "#4ade80"],
      background: ["#0a0a0a", "#0a0a0a"],
      border: ["#1e3a2a", "#1e3a2a"],
      foreground: ["#e8e8ed", "#e8e8ed"],
      muted: ["#8b9e8b", "#8b9e8b"],
      surface: ["#111a15", "#111a15"],
      positive: ["#4ade80", "#4ade80"],
      radius: "14px",
    },
  },
  {
    name: "Minimal Light",
    theme: {
      ...DEFAULT_THEME,
      colorScheme: "light",
      accent: ["#000000", "#000000"],
      background: ["#ffffff", "#ffffff"],
      border: ["#eeeeee", "#eeeeee"],
      foreground: ["#000000", "#000000"],
      muted: ["#888888", "#888888"],
      surface: ["#fafafa", "#fafafa"],
      radius: "14px",
    },
  },
  {
    name: "Purple",
    theme: {
      ...DEFAULT_THEME,
      colorScheme: "dark",
      accent: ["#a78bfa", "#a78bfa"],
      background: ["#0f0b1a", "#0f0b1a"],
      border: ["#2a2040", "#2a2040"],
      foreground: ["#e8e0f8", "#e8e0f8"],
      muted: ["#8b7faa", "#8b7faa"],
      surface: ["#1a1425", "#1a1425"],
      positive: ["#a78bfa", "#a78bfa"],
    },
  },
];

/** Font families with Google Fonts URLs for the HTML builder. */
export const FONT_FAMILIES = [
  { label: "System Default", value: "system-ui, -apple-system, sans-serif", fontUrl: undefined },
  { label: "Inter", value: "Inter, sans-serif", fontUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" },
  { label: "IBM Plex Sans", value: "IBM Plex Sans, sans-serif", fontUrl: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" },
  { label: "IBM Plex Mono", value: "IBM Plex Mono, monospace", fontUrl: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" },
  { label: "Roboto", value: "Roboto, sans-serif", fontUrl: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" },
  { label: "Open Sans", value: "Open Sans, sans-serif", fontUrl: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap" },
  { label: "Lato", value: "Lato, sans-serif", fontUrl: "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap" },
  { label: "Poppins", value: "Poppins, sans-serif", fontUrl: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" },
  { label: "DM Sans", value: "DM Sans, sans-serif", fontUrl: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" },
  { label: "DM Mono", value: "DM Mono, monospace", fontUrl: "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" },
  { label: "Space Grotesk", value: "Space Grotesk, sans-serif", fontUrl: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" },
  { label: "JetBrains Mono", value: "JetBrains Mono, monospace", fontUrl: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" },
  { label: "Fira Code", value: "Fira Code, monospace", fontUrl: "https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&display=swap" },
  { label: "Source Code Pro", value: "Source Code Pro, monospace", fontUrl: "https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;600;700&display=swap" },
] as const;

/**
 * Build the config object that developers paste into their server code.
 * Only includes fields that differ from the mppx defaults.
 */
export function buildServerConfig(
  theme: HtmlTheme,
  text: HtmlText,
): Record<string, unknown> {
  const config: Record<string, unknown> = {};

  const themeDiff: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(theme)) {
    const defaultVal = DEFAULT_THEME[key as keyof HtmlTheme];
    if (JSON.stringify(value) !== JSON.stringify(defaultVal)) {
      themeDiff[key] = value;
    }
  }
  if (Object.keys(themeDiff).length > 0) config.theme = themeDiff;

  const textDiff: Record<string, string> = {};
  for (const [key, value] of Object.entries(text)) {
    if (value !== DEFAULT_TEXT[key as keyof HtmlText]) {
      textDiff[key] = value;
    }
  }
  if (Object.keys(textDiff).length > 0) config.text = textDiff;

  return config;
}
