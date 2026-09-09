"use client";

import { Fraunces } from "next/font/google";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ImageCarousel, { type CarouselImage } from "./ImageCarousel";

// A different serif from the Playfair the pages use for their section headings —
// higher contrast, softer terminals, a touch more character at display size.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500"],
});

type Section = {
  heading: string;
  /**
   * When set, the column is split in two: this poster fills the top half and
   * the framed heading panel drops to the bottom half.
   */
  poster?: { src: string; alt: string };
  /** Fills the panel beneath the heading — the space "left for material". */
  body?: React.ReactNode;
};

type SimulationDetailProps = {
  media: CarouselImage[];
  /** shown in the modal header, alongside the field pill */
  title: string;
  tag: string;
  /** the three columns; the space beneath each heading is left for material */
  sections: readonly [Section, Section, Section];
};

/**
 * A project's media, made clickable: a click anywhere on the image or video
 * opens a modal split into three vertical sections, one per heading.
 */
export default function SimulationDetail({
  media,
  title,
  tag,
  sections,
}: SimulationDetailProps) {
  const [open, setOpen] = useState(false);
  // The click target below covers the carousel, so the carousel never sees the
  // hover itself — we track it here and drive the cycling through `active`.
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <ImageCarousel images={media} fill active={hovered} />

      {/* Sits over the media so a click anywhere on it opens the pop-up. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="absolute inset-0 z-10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8a7a00]"
      >
        <span className="sr-only">Open {title} details</span>
      </button>

      {open && (
        <SimulationModal
          title={title}
          tag={tag}
          sections={sections}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function SimulationModal({
  title,
  tag,
  sections,
  onClose,
}: Omit<SimulationDetailProps, "media"> & { onClose: () => void }) {
  // The poster currently blown up into its own lightbox, if any.
  const [zoomed, setZoomed] = useState<Section["poster"] | null>(null);

  // The page behind stays frozen for as long as the modal is mounted.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Escape steps back one layer — the lightbox first, then the modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (zoomed) setZoomed(null);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [zoomed, onClose]);

  // Rendered on the body so the card's hover transform and `overflow-hidden`
  // can't clip it or trap its fixed positioning.
  return createPortal(
    <>
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{ animation: "fade-in 180ms ease-out both" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        // Nearly full-screen — it takes over the page the way the card it
        // opened from fills its row.
        className="relative flex h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-black shadow-2xl ring-1 ring-zinc-800"
      >
        {/* Header, built from the same pieces as the project card: serif title
            plus the gold field pill. */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-7 py-6 sm:px-9">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2
              className={`${fraunces.className} text-[26px] leading-tight tracking-tight text-zinc-50`}
            >
              {title}
            </h2>
            <span className="rounded-full border border-[#8a7a00] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-300">
              {tag}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 shrink-0 rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        {/* The three columns, each its own framed panel so they read as
            distinct, stretched to fill the height. A column with a poster
            shows it bare above that panel, no frame of its own. */}
        <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto p-7 sm:grid-cols-3 sm:p-9">
          {sections.map(({ heading, poster, body }) => (
            <div key={heading} className="flex min-h-[320px] flex-col gap-6">
              {poster && (
                <button
                  type="button"
                  onClick={() => setZoomed(poster)}
                  aria-haspopup="dialog"
                  className="min-h-0 w-full flex-1 cursor-zoom-in rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8a7a00]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={poster.src}
                    alt={poster.alt}
                    className="h-full w-full object-contain"
                  />
                </button>
              )}

              <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl ring-1 ring-zinc-800">
                {/* Heading panel on top. */}
                <div className="border-b border-zinc-800 bg-white/[0.04] px-4 py-5 text-center">
                  <h3
                    className={`${fraunces.className} text-[22px] leading-snug tracking-tight text-zinc-100`}
                  >
                    {heading}
                  </h3>
                  <span className="mx-auto mt-2.5 block h-px w-9 bg-[#8a7a00]/70" />
                </div>

                {/* Space left for material. */}
                <div className="min-h-0 flex-1 overflow-y-auto bg-black px-4 py-5">
                  {body}
                </div>
              </section>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* The poster blown up into its own layer over the modal. */}
    {zoomed && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${zoomed.alt}, enlarged`}
        onClick={() => setZoomed(null)}
        style={{ animation: "fade-in 150ms ease-out both" }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-10"
      >
        <button
          type="button"
          onClick={() => setZoomed(null)}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-md p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
        >
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>
        {/* Click anywhere — image or backdrop — to close. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={zoomed.src}
          alt={zoomed.alt}
          className="max-h-full max-w-full cursor-zoom-out rounded-lg object-contain shadow-2xl ring-1 ring-white/10"
        />
      </div>
    )}
    </>,
    document.body,
  );
}
