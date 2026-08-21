"use client";

import { useEffect } from "react";

// Was a bare `scrollIntoView({behavior:"smooth"})`, whose native browser
// timing is short and not configurable — this glide is driven by hand
// instead so its length is an actual, adjustable number.
const GLIDE_MS = 1800;

const IDLE_MS = 220; // how long the scroll must be still before anything moves
const REACH_DOWN = 0.7; // how far short of the section it will still tidy up from
const ALIGNED = 6; // px; closer than this and moving would just be fussing

// Ease-in-out cubic: slow start, fast middle, slow finish — same curve
// ScrollPastTitle uses, so every scripted scroll on the page feels the same.
function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Settles the page onto a section once the reader has stopped scrolling.
 *
 * It deliberately never interrupts a scroll in progress. Firing the moment a
 * threshold is crossed fights the reader mid-gesture — the page is taken over
 * while they are still moving, and however smooth the glide is, that reads as
 * the scroll being cut off. So they scroll as far as they like, and only once
 * the page has gone quiet does the section ease into place.
 *
 * It only ever settles forwards, and only from nearby. Once the reader has gone
 * past the section — on their way to whatever follows it — they are left there:
 * pulling them back up would mean they could never get past this screen without
 * fighting it, which is precisely the sort of hijacking this is meant to avoid.
 * Coming to rest well short of the section is likewise taken as deliberate.
 */
export default function ScrollHandoff({ toId }: { toId: string }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let idle: ReturnType<typeof setTimeout>;
    let frame: number;
    let busy = false;

    function settle() {
      if (busy) return;
      const to = document.getElementById(toId);
      if (!to) return;

      // where the section's top sits relative to the top of the viewport;
      // negative means the reader has already scrolled past it
      const offset = to.getBoundingClientRect().top;
      if (offset <= ALIGNED) return;
      if (offset >= window.innerHeight * REACH_DOWN) return;

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
        }
      }
      frame = requestAnimationFrame(step);
    }

    function onScroll() {
      clearTimeout(idle);
      idle = setTimeout(settle, IDLE_MS);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(idle);
      cancelAnimationFrame(frame);
    };
  }, [toId]);

  return null;
}
