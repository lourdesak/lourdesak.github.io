"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Playfair_Display } from "next/font/google";
import frame from "./booksFrame.module.css";

// Same face and cut as the "Crossroads" heading on this page, so a title
// here reads as part of the same page rather than a different typeface
// dropped in underneath it.
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["italic"],
});

function subscribeNoop() {
  return () => {};
}

export type Book = {
  title: string;
  author: string;
  /** subject/genre — physics, fiction, psychology, etc. */
  field: string;
  description: string;
  /** path under /public to the cover art; falls back to a plain slab without one */
  cover?: string;
};

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The cover art when there is some, otherwise a soft gradient slab with a
// spine edge and the title set into it, standing in until real art is found.
// `spin` remounts the element (a fresh key from the caller) so the one-time
// spin keyframe plays again each time it changes, rather than looping.
function BookCover({ title, cover, spin }: { title: string; cover?: string; spin: boolean }) {
  const spinClass = spin ? "animate-[spin-once_700ms_ease-in-out]" : "";

  if (cover) {
    return (
      <img
        src={cover}
        alt={`${title} cover`}
        className={`h-72 w-52 flex-none rounded-md border border-zinc-300/70 object-cover shadow-lg dark:border-zinc-700/60 ${spinClass}`}
      />
    );
  }

  return (
    <div
      className={`relative h-72 w-52 flex-none overflow-hidden rounded-md border border-zinc-300/70 shadow-lg dark:border-zinc-700/60 ${spinClass}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-400 dark:from-zinc-700 dark:via-zinc-800 dark:to-zinc-950" />
      <div className="absolute inset-y-0 left-0 w-2 bg-black/10 dark:bg-black/30" />
      <div className="absolute inset-y-0 left-2 w-px bg-white/40 dark:bg-white/10" />
      <div className="absolute inset-0 flex items-center justify-center p-5">
        <p className="text-center text-sm font-medium leading-snug text-zinc-700 dark:text-zinc-200">
          {title}
        </p>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10" />
    </div>
  );
}

const MIN_SCALE = 0.6;
// 0 once the panel's top edge is at the very bottom of the viewport (just
// starting to appear), 1 once it has scrolled up to the vertical middle —
// scrubbed straight off scroll position every frame, not a fixed-length
// animation, so the growth tracks the scroll itself rather than racing
// ahead of or lagging behind it.
function zoomProgress(panelTop: number, viewportH: number) {
  return Math.min(1, Math.max(0, (viewportH - panelTop) / (viewportH * 0.5)));
}

// Shelf panel: one book at a time, its description alongside, cycled with the
// prev/next controls. It owns its own centred screen now, so it sizes to a
// readable column rather than breaking out to full width — the old
// left-1/2 + w-screen trick existed only to escape a narrow ancestor column
// and would fight the centring here (and overflow by the scrollbar's width).
//
// The whole panel grows continuously as it scrolls up into view — read
// straight from scroll position every frame (rAF-throttled, direct style
// writes, the same approach NameWave uses) rather than an
// IntersectionObserver firing a fixed-duration transition once, so "zoom
// in" actually means tied to the scrolling motion, not a canned animation
// that happens to start near it. The cover spins once, the moment the panel
// first finishes growing — then again on every subsequent prev/next, since
// that's the only later moment a new cover appears.
export default function BooksPanel({ books }: { books: Book[] }) {
  const [index, setIndex] = useState(0);
  const [spun, setSpun] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const hasSpunRef = useRef(false);

  const reducedMotion = useSyncExternalStore(
    subscribeNoop,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;

    if (reducedMotion) {
      inner.style.transform = "scale(1)";
      inner.style.opacity = "1";
      return;
    }

    let queued = false;

    function apply() {
      queued = false;
      const el = panelRef.current;
      if (!el || !inner) return;
      const progress = zoomProgress(el.getBoundingClientRect().top, window.innerHeight);
      const scale = MIN_SCALE + (1 - MIN_SCALE) * progress;
      inner.style.transform = `scale(${scale})`;
      inner.style.opacity = String(0.15 + 0.85 * progress);

      if (progress >= 0.98 && !hasSpunRef.current) {
        hasSpunRef.current = true;
        setSpun(true);
      }
    }

    function onScrollOrResize() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(apply);
    }

    apply();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [reducedMotion]);

  if (books.length === 0) return null;
  const book = books[index];

  const go = (delta: number) =>
    setIndex((i) => (i + delta + books.length) % books.length);

  return (
    <div ref={panelRef} className="relative mx-auto w-full max-w-5xl">
      {/* The silver band is what scales and fades on scroll, with the panel
          inside it — the frame has to move as one piece with what it frames,
          not sit still while the panel grows inside it. */}
      <div
        ref={innerRef}
        className={frame.frame}
        style={{ transform: `scale(${MIN_SCALE})`, opacity: 0.15 }}
      >
        {/* the four mitred faces of the frame */}
        <span className={`${frame.bevel} ${frame.top}`} />
        <span className={`${frame.bevel} ${frame.right}`} />
        <span className={`${frame.bevel} ${frame.bottom}`} />
        <span className={`${frame.bevel} ${frame.left}`} />
        <div className={`${frame.inner} border border-zinc-200/70 bg-gradient-to-r from-zinc-300/85 via-zinc-200/80 to-zinc-300/85 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)] backdrop-blur-md dark:border-zinc-800/70 dark:from-zinc-950/90 dark:via-black/85 dark:to-zinc-950/90 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]`}>
          <div className="mx-auto flex max-w-5xl items-center gap-10 px-10 py-16">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous book"
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-zinc-300 text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
          >
            <ChevronIcon direction="left" />
          </button>

          <div
            key={index}
            className="flex flex-1 animate-[fade-in_400ms_ease-out] items-center gap-10"
            style={{ perspective: 1000 }}
          >
            <BookCover title={book.title} cover={book.cover} spin={spun || reducedMotion} />
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                  {index + 1} of {books.length}
                </p>
                <h3
                  className={`${playfairDisplay.className} text-3xl font-semibold italic tracking-wide text-zinc-900 dark:text-zinc-50`}
                >
                  {book.title}
                </h3>
                <p className="text-base text-zinc-500 dark:text-zinc-400">{book.author}</p>
                <span className="mt-2 inline-flex w-fit items-center rounded-full border border-[#8a7a00] px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                  {book.field}
                </span>
              </div>
              <p className="max-w-lg text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                {book.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next book"
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-zinc-300 text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
          >
            <ChevronIcon direction="right" />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
