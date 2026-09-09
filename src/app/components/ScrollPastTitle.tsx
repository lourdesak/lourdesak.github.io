"use client";

import { useEffect } from "react";

// Fired once the glide has come to rest, so anything that should only start
// after the page has settled can wait for it instead of guessing a delay.
export const SCROLL_SETTLED_EVENT = "scroll-past-title:settled";

// Fallback for when the settle can't be observed directly — long enough to
// cover the browser's own smooth-scroll on a full title's worth of travel.
const SETTLE_FALLBACK_MS = 1400;

function announceSettled() {
  window.dispatchEvent(new Event(SCROLL_SETTLED_EVENT));
}

/**
 * Lands the page like any other page (static, scrolled to top, title visible),
 * then lets the browser smooth-scroll `targetId` up under the fixed nav.
 *
 * The travel is the browser's own smooth scroll rather than a hand-driven
 * rAF loop: it runs on the compositor, so it stays smooth under load, and it
 * hands control straight back the instant the reader scrolls themselves
 * instead of fighting them frame by frame.
 *
 * `offset` is the gap left above the target, which needs to clear the fixed
 * nav in the top-left corner.
 */
export default function ScrollPastTitle({
  targetId,
  offset = 96,
}: {
  targetId: string;
  offset?: number;
}) {
  useEffect(() => {
    let settleTimer: ReturnType<typeof setTimeout>;
    let settled = false;

    function finish() {
      if (settled) return;
      settled = true;
      window.removeEventListener("scrollend", finish);
      clearTimeout(settleTimer);
      announceSettled();
    }

    // Wait a frame: Next resets scroll to the top on navigation, and web fonts
    // can still be settling, either of which would throw off the measurement.
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      if (!target) {
        finish(); // nothing to scroll to, so we are already settled
        return;
      }

      const targetY = Math.max(
        0,
        target.getBoundingClientRect().top + window.scrollY - offset
      );

      if (Math.abs(targetY - window.scrollY) < 4) {
        finish();
        return;
      }

      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      window.scrollTo({ top: targetY, behavior: reduce ? "auto" : "smooth" });

      // `scrollend` fires when the smooth scroll — or a reader who takes over
      // mid-glide — comes to rest; the timer covers browsers without it.
      window.addEventListener("scrollend", finish, { once: true });
      settleTimer = setTimeout(finish, reduce ? 0 : SETTLE_FALLBACK_MS);
    });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scrollend", finish);
      clearTimeout(settleTimer);
    };
  }, [targetId, offset]);

  return null;
}
