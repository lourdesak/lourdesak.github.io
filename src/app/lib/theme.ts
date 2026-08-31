/**
 * Theme plumbing shared by the toggle button. Three states:
 *
 *   "system"          no `data-theme` on <html>; CSS follows the OS via
 *                     `@media (prefers-color-scheme)`. This is the default.
 *   "light" / "dark"  an explicit choice, written to `<html data-theme>` and
 *                     remembered in localStorage so it survives reloads and
 *                     applies on every page.
 *
 * The matching pre-paint snippet lives in `app/layout.tsx` as an inline
 * <script> so the attribute is set before the first paint (no flash). If you
 * change the storage key or the attribute name, change it there too.
 */

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/** What is actually on screen right now, resolving "system" against the OS. */
export function resolvedTheme(): ResolvedTheme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** The stored preference, or "system" when nothing is pinned. */
export function themeChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* storage unavailable — treat as following the system */
  }
  return "system";
}

/** Pin a choice (or clear back to "system") and apply it to <html> at once. */
export function setTheme(choice: ThemeChoice): void {
  const root = document.documentElement;

  try {
    if (choice === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    /* storage blocked — the attribute below still applies for this page */
  }

  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
}

/** Flip light <-> dark, pinning the result. Returns the theme now showing. */
export function toggleTheme(): ResolvedTheme {
  const next: ResolvedTheme = resolvedTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

/**
 * Fires `cb` whenever the *resolved* theme might have changed — the OS setting
 * flips, or the manual choice is toggled. Returns an unsubscribe function.
 *
 * CSS handles `dark:` on its own; this is for <canvas> painters and anything
 * else that has to pick a colour in JS.
 */
export function onThemeChange(cb: () => void): () => void {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener("change", cb);

  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  return () => {
    mq.removeEventListener("change", cb);
    observer.disconnect();
  };
}
