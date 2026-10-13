export type ThemePreference = "light" | "dark" | "system";
export const themeStorageKey = "trace:theme";
export function resolveTheme(
  preference: ThemePreference,
  systemDark: boolean,
): "light" | "dark" {
  return preference === "system" ? (systemDark ? "dark" : "light") : preference;
}
export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(themeStorageKey);
    if (value === "light" || value === "system") return value;
  } catch {
    /* Storage may be unavailable in a private session. */
  }
  return "dark";
}
export function applyTheme(preference: ThemePreference) {
  const theme = resolveTheme(
    preference,
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}
