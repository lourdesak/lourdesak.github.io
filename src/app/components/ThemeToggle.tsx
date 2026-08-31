"use client";

import { toggleTheme } from "../lib/theme";

/**
 * Flips the site between light and dark and remembers the choice.
 *
 * Which glyph shows is decided purely by CSS off `<html data-theme>` — the sun
 * carries `dark:hidden`, the moon carries `hidden dark:block`, and `dark:` is
 * that same attribute (see globals.css). So this component renders identically
 * on the server and the client: no hydration mismatch, no mount guard, no
 * flash of the wrong icon.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      aria-label="Toggle light and dark theme"
      title="Toggle theme"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-600 shadow-sm backdrop-blur transition-colors hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a7a00] dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-400 dark:hover:text-zinc-50 ${className}`}
    >
      {/* sun — shown in light mode */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        aria-hidden="true"
        className="h-[18px] w-[18px] dark:hidden"
      >
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6" />
      </svg>

      {/* moon — shown in dark mode */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="hidden h-[18px] w-[18px] dark:block"
      >
        <path d="M20 14.3A8 8 0 1 1 9.7 4a6.3 6.3 0 0 0 10.3 10.3z" />
      </svg>
    </button>
  );
}
