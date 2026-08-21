"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

function subscribeNoop() {
  return () => {};
}

// Top-left corner label for the books screen: slides in from the left once
// the screen comes into view, holds for a couple of seconds, then slides out
// to the right and off the page. Plays once — an announcement, not a loop.
export default function BookRecommendationsLabel() {
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPlay(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const className = reducedMotion
    ? "opacity-100"
    : play
      ? "animate-[book-rec-banner_3s_ease-in-out_forwards]"
      : "opacity-0";

  return (
    <p
      ref={ref}
      className={`pointer-events-none absolute left-6 top-18 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400 ${className}`}
    >
      Book recommendations
    </p>
  );
}
