"use client";

import { useEffect } from "react";

const DURATION_MS = 1000;

// Fired once the glide has come to rest, so anything that should only start
// after the page has settled can wait for it instead of guessing a delay.
export const SCROLL_SETTLED_EVENT = "scroll-past-title:settled";

function announceSettled() {
  window.dispatchEvent(new Event(SCROLL_SETTLED_EVENT));
}

// Ease-in-out cubic: slow start, fast middle, slow finish.
function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Lands the page like any other page (static, scrolled to top, title
// visible), then glides the page down over DURATION_MS so `targetId` ends up
// at the top, tucking the page title behind the fixed nav bar.
//
// `offset` is the gap left above the target, which needs to clear the fixed
// nav in the top-left corner.
export default function ScrollPastTitle({
  targetId,
  offset = 96,
}: {
  targetId: string;
  offset?: number;
}) {
  useEffect(() => {
    let frame: number;
    let startTime: number | null = null;
    let startY = 0;
    let targetY = 0;

    // Wait a frame: Next resets scroll to the top on navigation, and web fonts
    // can still be settling, either of which would throw off the measurement.
    frame = requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      if (!target) {
        announceSettled(); // nothing to scroll to, so we are already settled
        return;
      }
      startY = window.scrollY;
      targetY = Math.max(
        0,
        target.getBoundingClientRect().top + window.scrollY - offset
      );

      function step(now: number) {
        if (startTime === null) startTime = now;
        const t = Math.min(1, (now - startTime) / DURATION_MS);
        window.scrollTo(0, startY + (targetY - startY) * ease(t));
        if (t < 1) {
          frame = requestAnimationFrame(step);
        } else {
          announceSettled();
        }
      }
      frame = requestAnimationFrame(step);
    });

    return () => cancelAnimationFrame(frame);
  }, [targetId, offset]);

  return null;
}
