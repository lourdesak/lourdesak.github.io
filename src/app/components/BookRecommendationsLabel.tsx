"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

function subscribeNoop() {
  return () => {};
}

// Top-left corner label for the books screen: slides in from the left once
// the screen comes into view, holds for a couple of seconds, then slides out
// to the right and off the page. Plays once — an announcement, not a loop.
//
// Set to match the Crossroads heading — same face, size, tracking and colour —
// so the two screens are headed alike. `fontClassName` is passed in rather
// than the font being loaded again here: calling next/font a second time with
// the same options creates a second instance of it, rather than reusing one.
export default function BookRecommendationsLabel({
  fontClassName = "",
}: {
  fontClassName?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [play, setPlay] = useState(false);

  const reducedMotion = useSyncExternalStore(
    subscribeNoop,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );

  useEffect(() => {
    if (reducedMotion) return;
    const el = ref.current;
    if (!el) return;

    // Watch the whole books screen rather than this label. The label is a few
    // lines tall, so it clears any threshold while the screen is still mostly
    // below the fold; the section is a full viewport, so requiring nearly all
    // of it means the screen really has arrived before the banner runs.
    const screen = el.closest("section") ?? el;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.95) {
          setPlay(true);
          observer.disconnect();
        }
      },
      { threshold: [0.95, 0.99, 1] }
    );
    observer.observe(screen);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const className = reducedMotion
    ? "opacity-100"
    : play
      ? "animate-[book-rec-banner_4.2s_ease-in-out_forwards]"
      : "opacity-0";

  return (
    <p
      ref={ref}
      className={`${fontClassName} pointer-events-none absolute left-6 top-36 text-3xl italic tracking-wide text-zinc-800 dark:text-zinc-100 ${className}`}
    >
      Book recommendations
    </p>
  );
}
