export type ThemeName = 'light' | 'dark' | 'system';

export interface ThemeTokens {
  name: ThemeName;
  colors: Record<string, string>;
  spacing?: Record<string, string>;
  typography?: Record<string, string>;
}

export const lightTheme: ThemeTokens = {
  name: 'light',
  colors: {
    // Light theme keeps the original light, neutral system. Values are HSL strings
    primary: 'hsl(222 74% 52%)', // friendly blue (~#3b82f6)
    primaryForeground: 'hsl(210 24% 98%)',
    secondary: 'hsl(187 75% 45%)', // muted cyan/teal for subtle accents
    background: 'hsl(210 24% 98%)',
    foreground: 'hsl(215 16% 12%)',
    card: 'hsl(210 20% 100%)',
    border: 'hsl(220 14% 90%)',
    muted: 'hsl(220 11% 84%)',
    success: 'hsl(142 47% 36%)',
    danger: 'hsl(0 78% 57%)',
  },
};

export const darkTheme: ThemeTokens = {
  name: 'dark',
  colors: {
    // Dark theme uses a neutral very-dark base with desaturated cool accents.
    // These HSL tokens map to the CSS variables in `src/index.css` for consistency.
    primary: 'hsl(217 72% 52%)', // calm blue for actions (slightly muted)
    primaryForeground: 'hsl(220 12% 8%)',
    secondary: 'hsl(187 60% 48%)', // subtle teal
    background: 'hsl(220 12% 7%)', // near-black charcoal
    foreground: 'hsl(210 16% 96%)', // light text
    card: 'hsl(220 13% 12%)',
    border: 'hsl(220 13% 18%)',
    muted: 'hsl(220 9% 30%)',
    success: 'hsl(142 47% 36%)',
    danger: 'hsl(0 78% 57%)',
  },
};

export const THEME_STORAGE_KEY = 'theme';

// uiColors: JS-friendly color tokens (hex) for places that need immediate color strings
// (charts, inline styles, components). Keep these in-sync with the CSS variables above.
export const uiColors = {
  primary: '#3b82f6', // blue-500
  primarySoft: '#60a5fa',
  secondary: '#06b6d4', // cyan-500 (subtle accent)
  accent: '#f59e0b', // amber-500 for highlights
  trendUp: '#10B981', // green
  trendDown: '#EF4444', // red
  trendStable: '#6B7280', // neutral gray
  card: '#0f1720',
};
