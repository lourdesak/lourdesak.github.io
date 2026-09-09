"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import NamePin from "./NamePin";

/**
 * The location mark beside the name opens a small panel — a transit-map style
 * timeline of every place Lourdes has lived, newest at the top, walked back to
 * her birthplace at the bottom. Each stop's `years` is how long she stayed
 * before leaving, and it sets the drop to the next stop: one month in Honolulu
 * barely registers, ten years in Tirunelveli draws the long fall.
 *
 * Straight rail, one column of ticks, one column of labels — the two never
 * cross, so nothing overlaps. On open the rail draws itself top-down and the
 * stations light up in order behind it.
 *
 *   22 years old. Philadelphia 4 + Sivakasi 1 + Bangalore 5 + Sivakasi 1 = 11.
 *   Honolulu is ~1 month so far. Tuticorin is her birthplace, ~1 year there.
 *   22 - 11 - ~0 (Honolulu) - 1 (Tuticorin) => ~10 years in Tirunelveli.
 */

type Stop = { name: string; note: string; years: number };

const STOPS: Stop[] = [
  // Honolulu's note is filled in at render time from HONOLULU_ARRIVAL below.
  { name: "Honolulu", note: "", years: 1 / 12 },
  { name: "Philadelphia", note: "4 yrs", years: 4 },
  { name: "Sivakasi", note: "1 yr", years: 1 },
  { name: "Bangalore", note: "5 yrs", years: 5 },
  { name: "Sivakasi", note: "1 yr", years: 1 },
  { name: "Tirunelveli", note: "10 yrs", years: 10 },
  { name: "Tuticorin", note: "born · 1 yr", years: 1 },
];

// The day Lourdes landed in Honolulu. The "how long so far" note counts up from
// this on its own — Aug 5 -> Sep 5 reads as one month — so nothing needs hand-
// editing as the tenure grows. (Month is 0-based: 7 = August.)
const HONOLULU_ARRIVAL = new Date(2026, 7, 5);

// Rough elapsed time as a terse note: "~3 wks", "~1 mo", "5 mos", "1 yr",
// "1 yr 4 mos". Deliberately approximate — it only has to read right at a
// glance in a 10px label.
function tenureSince(from: Date, to: Date): string {
  const days = Math.max(0, (to.getTime() - from.getTime()) / 86_400_000);

  if (days < 25) {
    const wks = Math.max(1, Math.round(days / 7));
    return `~${wks} wk${wks === 1 ? "" : "s"}`;
  }

  const months = Math.max(1, Math.round(days / 30.44));
  if (months < 12) return `${months === 1 ? "~1" : months} mo${months === 1 ? "" : "s"}`;

  const yrs = Math.floor(months / 12);
  const rem = months % 12;
  const y = `${yrs} yr${yrs === 1 ? "" : "s"}`;
  return rem === 0 ? y : `${y} ${rem} mo${rem === 1 ? "" : "s"}`;
}

// px added above each stop after the first — a sqrt keeps the eleven-year leg
// from dwarfing the rest, and the small floor stops labels from touching.
// Kept tight so the whole card fits the clear space up-right of the mark.
const GAPS = (() => {
  const weights = STOPS.slice(0, -1).map((s) => Math.sqrt(s.years + 0.3));
  const max = Math.max(...weights);
  return weights.map((v) => 1 + Math.round(6 * (v / max)));
})();

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => {
  const m = window.matchMedia(RM_QUERY);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

export default function JourneyMap() {
  const [open, setOpen] = useState(false);
  const reduce = useSyncExternalStore(
    subscribeRM,
    () => window.matchMedia(RM_QUERY).matches,
    () => false,
  );
  const rootRef = useRef<HTMLSpanElement>(null);

  // Re-render every hour so the Honolulu tenure keeps advancing even if the tab
  // is left open for days.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  const honoluluNote = tenureSince(HONOLULU_ARRIVAL, new Date());
  const noteFor = (i: number) => (i === 0 ? honoluluNote : STOPS[i].note);

  // close on Escape or a press anywhere outside
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <span ref={rootRef} className="relative inline-flex shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-label={
          open ? "Hide the places I've lived" : "Show the places I've lived"
        }
        onClick={() => setOpen((v) => !v)}
        className="group mt-[2px] block cursor-pointer rounded-sm p-0.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a227]"
      >
        <NamePin active={open} />
      </button>

      {/* the panel: opens up and to the right of the mark, into the empty
          space above the paragraph and clear of the name — so it never lands
          on any writing or headings. Kept short (one line per stop) so it fits
          the gap between the nav and the paragraph; right-anchored on small
          screens so it can't run off the edge. */}
      <div
        aria-hidden="true"
        className={`absolute bottom-[calc(100%-22px)] left-[calc(100%+8px)] z-30 max-h-[calc(100vh-4.5rem)] w-[196px] origin-bottom-left overflow-y-auto overflow-x-hidden rounded-xl border border-zinc-200 bg-white/95 shadow-xl backdrop-blur-sm transition duration-200 ease-out max-sm:fixed max-sm:inset-x-0 max-sm:bottom-auto max-sm:left-0 max-sm:right-0 max-sm:top-[88px] max-sm:mx-auto max-sm:w-[min(15rem,calc(100vw-2rem))] max-sm:origin-top dark:border-zinc-800 dark:bg-zinc-900/95 ${
          open
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        {/* faint graticule, so the card reads as a scrap of map */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(#8a7a00 1px, transparent 1px), linear-gradient(90deg, #8a7a00 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />

        <div className="relative px-3.5 py-3">
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7a00] dark:text-[#c9a227]">
            Where I&apos;ve lived
          </p>

          <ol className="relative">
            {/* the rail, drawn top-down on open */}
            <span
              className="absolute left-[5px] w-px bg-[#8a7a00]/70 dark:bg-[#c9a227]/70"
              style={{
                top: 6,
                bottom: 8,
                transformOrigin: "top",
                transform: open ? "scaleY(1)" : "scaleY(0)",
                transition: reduce ? "none" : "transform 780ms ease-out",
              }}
            />

            {STOPS.map((s, i) => {
              const delay = open && !reduce ? 140 + i * 95 : 0;
              return (
                <li
                  key={i}
                  className="relative flex items-baseline gap-2 pl-5"
                  style={{ marginTop: i === 0 ? 0 : GAPS[i - 1] }}
                >
                  <span
                    className={`absolute left-0 top-[4px] h-[10px] w-[10px] rounded-full border-2 border-white bg-[#8a7a00] dark:border-zinc-900 dark:bg-[#c9a227] ${
                      i === 0
                        ? "ring-2 ring-[#8a7a00]/25 dark:ring-[#c9a227]/25"
                        : ""
                    }`}
                    style={{
                      opacity: open ? 1 : 0,
                      transform: open ? "scale(1)" : "scale(0.4)",
                      transition: reduce
                        ? "none"
                        : `opacity 240ms ease-out ${delay}ms, transform 300ms cubic-bezier(.2,.7,.3,1.4) ${delay}ms`,
                    }}
                  />
                  <span
                    className="flex min-w-0 flex-1 items-baseline gap-1.5"
                    style={{
                      opacity: open ? 1 : 0,
                      transform: open ? "translateX(0)" : "translateX(-4px)",
                      transition: reduce
                        ? "none"
                        : `opacity 240ms ease-out ${delay + 45}ms, transform 240ms ease-out ${delay + 45}ms`,
                    }}
                  >
                    <span className="truncate text-[12px] font-semibold leading-tight text-zinc-800 dark:text-zinc-100">
                      {s.name}
                    </span>
                    <span
                      className="shrink-0 text-[10px] leading-tight text-zinc-400 dark:text-zinc-500"
                      suppressHydrationWarning
                    >
                      {noteFor(i)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* the same route, read out for assistive tech */}
      <ul className="sr-only">
        {STOPS.map((s, i) => (
          <li key={i} suppressHydrationWarning>
            {s.name} — {noteFor(i)}
          </li>
        ))}
      </ul>
    </span>
  );
}
