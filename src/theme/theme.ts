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
    primary: 'hsl(212 95% 45%)',
    primaryForeground: 'hsl(210 24% 98%)',
    secondary: 'hsl(180 85% 45%)',
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
    primary: 'hsl(45 93% 58%)',
    primaryForeground: 'hsl(222 84% 4.9%)',
    secondary: 'hsl(189 90% 58%)',
    background: 'hsl(222 84% 4.9%)',
    foreground: 'hsl(210 40% 98%)',
    card: 'hsl(225 30% 10%)',
    border: 'hsl(217 32.6% 17.5%)',
    muted: 'hsl(217 32.6% 17.5%)',
    success: 'hsl(142 47% 36%)',
    danger: 'hsl(0 84% 60%)',
  },
};

export const THEME_STORAGE_KEY = 'theme';
