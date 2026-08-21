"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ImageCarousel, { type CarouselImage } from "./ImageCarousel";
import MosaicLeaders, { type MosaicTile } from "./MosaicLeaders";

/**
 * The gallery wall. Frames sit exactly where MOSAIC_SLOTS puts them and cannot
 * be moved, so the arrangement is fixed and nothing can overlap.
 *
 * Owns which frame is hovered so its place-name leader line (and only that
 * one's) can be revealed in MosaicLeaders.
 */
export default function MosaicGallery({
  tiles,
  images,
  places,
  width,
  height,
}: {
  tiles: MosaicTile[];
  images: CarouselImage[][];
  places: string[];
  width: number;
  height: number;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  // Escape closes the expanded view, and the page behind it stays put rather
  // than scrolling under the overlay.
  useEffect(() => {
    if (expanded === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(null);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [expanded]);

  const shown = expanded === null ? null : images[expanded]?.[0];

  return (
    // z-10 so the leader lines/labels always paint above the flanking
    // SidePanes, guaranteed by stacking order rather than incidentally by
    // DOM order (SidePanes carries no z-index of its own).
    <div className="relative z-10" style={{ width, height }}>
      {tiles.map((tile, i) => (
        <div
          key={i}
          // A ring rather than a border: a border would shrink the content box
          // by a pixel on each side, changing its shape and forcing the photo
          // to be cropped to fit. The height is left off for the same reason —
          // the photo sets it, so the frame is always exactly its shape.
          className="absolute cursor-zoom-in overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 transition-shadow hover:shadow-lg dark:bg-zinc-900 dark:ring-zinc-800"
          style={{ left: tile.x, top: tile.y, width: tile.w }}
          onClick={() => setExpanded(i)}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() =>
            setHoveredIndex((current) => (current === i ? null : current))
          }
        >
          <ImageCarousel images={images[i]} />
        </div>
      ))}
      <MosaicLeaders
        tiles={tiles}
        places={places}
        width={width}
        height={height}
        hoveredIndex={hoveredIndex}
      />

      {/* Portaled to the body so the overlay is fixed to the viewport itself,
          not to whichever transformed ancestor it happens to sit under. */}
      {shown &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex cursor-zoom-out flex-col items-center justify-center gap-4 bg-black/90 p-6 backdrop-blur-sm"
            onClick={() => setExpanded(null)}
            role="dialog"
            aria-modal="true"
            aria-label={shown.alt}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shown.src}
              alt={shown.alt}
              className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
            />
            <p className="text-sm tracking-wide text-zinc-300">{shown.alt}</p>
          </div>,
          document.body
        )}
    </div>
  );
}
