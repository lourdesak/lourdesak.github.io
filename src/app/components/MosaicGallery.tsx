"use client";

import { useState } from "react";
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

  return (
    <div className="relative" style={{ width, height }}>
      {tiles.map((tile, i) => (
        <div
          key={i}
          // A ring rather than a border: a border would shrink the content box
          // by a pixel on each side, changing its shape and forcing the photo
          // to be cropped to fit. The height is left off for the same reason —
          // the photo sets it, so the frame is always exactly its shape.
          className="absolute overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
          style={{ left: tile.x, top: tile.y, width: tile.w }}
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
    </div>
  );
}
