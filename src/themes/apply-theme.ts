// =============================================================================
// Axis Theme — Apply Theme
// =============================================================================
// Converts a theme name into CSS variable assignments and applies them to the
// document root. Used at build time for the default theme CSS, and at runtime
// for theme switching.
// =============================================================================

import { themes, type ThemeColors } from './index';

/**
 * Generate a CSS string that sets the theme CSS variables for :root and .dark.
 */
export function generateThemeCSS(themeName: string): string {
  const theme = themes[themeName] ?? themes['axis'];
  return `
:root {
  --bg: ${theme.light.bg};
  --text: ${theme.light.text};
  --muted: ${theme.light.muted};
  --border: ${theme.light.border};
  --accent: ${theme.light.accent};
  --accent-text: ${theme.light.accentText};
}
.dark {
  --bg: ${theme.dark.bg};
  --text: ${theme.dark.text};
  --muted: ${theme.dark.muted};
  --border: ${theme.dark.border};
  --accent: ${theme.dark.accent};
  --accent-text: ${theme.dark.accentText};
}`;
}

/**
 * Apply a theme to the document at runtime (client-side only).
 */
export function applyThemeToDocument(themeName: string): void {
  const theme = themes[themeName] ?? themes['axis'];
  const isDark = document.documentElement.classList.contains('dark');
  const colors = isDark ? theme.dark : theme.light;

  const root = document.documentElement;
  root.style.setProperty('--bg', colors.bg);
  root.style.setProperty('--text', colors.text);
  root.style.setProperty('--muted', colors.muted);
  root.style.setProperty('--border', colors.border);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-text', colors.accentText);

  root.setAttribute('data-theme', themeName);
  localStorage.setItem('selectedTheme', themeName);
}

/**
 * Re-apply the stored theme after a dark/light mode toggle.
 * Called after toggling .dark class on <html>.
 */
export function reapplyThemeForMode(): void {
  const themeName = localStorage.getItem('selectedTheme') || 'axis';
  applyThemeToDocument(themeName);
}

/**
 * Inline script to embed in <head> so the theme is applied before first paint.
 * This prevents a flash of wrong-theme content.
 */
export function getThemeInitScript(defaultTheme: string): string {
  return `(function(){
  var t = localStorage.getItem('selectedTheme') || '${defaultTheme}';
  document.documentElement.setAttribute('data-theme', t);
})();`;
}
