"use client";

import { useEffect } from "react";

const IDLE_MS = 300; // how long the scroll must be still before anything moves
const REACH_DOWN = 0.5; // how far short of the section it will still tidy up from
const ALIGNED = 6; // px; closer than this and moving would just be fussing

/**
 * Settles the page onto a section once the reader has stopped scrolling.
 *
 * It never interrupts a scroll in progress: it waits for the page to go quiet
 * for {@link IDLE_MS}, and the travel itself is the browser's own smooth
 * scroll, which runs on the compositor and yields control back the instant the
 * reader scrolls again — nothing here drives `scrollTo` frame by frame against
 * them, which is what used to make this stutter.
 *
 * It only ever settles forwards, and only from nearby. Once the reader is past
 * the section, or has come to rest well short of it, they are left alone — and
 * once they have reached it the once, this stops watching entirely so it can
 * never pull them back later.
 */
export default function ScrollHandoff({ toId }: { toId: string }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let idle: ReturnType<typeof setTimeout>;

    function teardown() {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(idle);
    }

    function settle() {
      const to = document.getElementById(toId);
      if (!to) return;

      // where the section's top sits relative to the top of the viewport;
      // negative means the reader has already scrolled past it
      const offset = to.getBoundingClientRect().top;
      if (offset <= ALIGNED) {
        teardown(); // arrived — done watching for good
        return;
      }
      if (offset >= window.innerHeight * REACH_DOWN) return;

      window.scrollTo({ top: to.offsetTop, behavior: "smooth" });
    }

    function onScroll() {
      clearTimeout(idle);
      idle = setTimeout(settle, IDLE_MS);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return teardown;
  }, [toId]);

  return null;
}
