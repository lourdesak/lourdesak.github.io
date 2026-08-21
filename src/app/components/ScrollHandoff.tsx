"use client";

import { useEffect } from "react";

// Was a bare `scrollIntoView({behavior:"smooth"})`, whose native browser
// timing is short and not configurable — this glide is driven by hand
// instead so its length is an actual, adjustable number.
const GLIDE_MS = 1800;

// Ease-in-out cubic: slow start, fast middle, slow finish — same curve
// ScrollPastTitle uses, so every scripted scroll on the page feels the same.
function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Hands the reader off to the next screen once they are far enough through this
 * one. Scrolling past `at` of the way down `fromId` glides the page to
 * `toId`, so the next section arrives as its own screen rather than creeping
 * up underneath the current one.
 *
 * Only ever fires while scrolling down, and only when the target is still
 * below the fold — so scrolling back up to re-read never yanks the reader
 * forward again.
 */
export default function ScrollHandoff({
  fromId,
  toId,
  at = 0.7,
}: {
  fromId: string;
  toId: string;
  at?: number;
}) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let lastY = window.scrollY;
    let busy = false;
    let frame: number;

    function onScroll() {
      const y = window.scrollY;
      const goingDown = y > lastY;
      lastY = y;
      if (busy || !goingDown) return;

      const from = document.getElementById(fromId);
      const to = document.getElementById(toId);
      if (!from || !to) return;

      const start = from.offsetTop;
      const progress = (y - start) / Math.max(from.offsetHeight, 1);
      // already at or past the target, so there is nothing to hand off to
      if (progress < at || y >= to.offsetTop - 4) return;

      busy = true;
      const startY = window.scrollY;
      const targetY = to.offsetTop;
      let startTime: number | null = null;

      function step(now: number) {
        if (startTime === null) startTime = now;
        const t = Math.min(1, (now - startTime) / GLIDE_MS);
        window.scrollTo(0, startY + (targetY - startY) * ease(t));
        if (t < 1) {
          frame = requestAnimationFrame(step);
        } else {
          busy = false;
          lastY = window.scrollY;
        }
      }
      frame = requestAnimationFrame(step);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [fromId, toId, at]);

  return null;
}
