"use client";

import { useEffect, useState } from "react";

const INTERVAL_MS = 1500;
const TRANSITION_MS = 700;

export type CarouselImage = {
  src: string;
  alt: string;
  /** intrinsic pixel size, so the browser reserves the right box before load */
  w?: number;
  h?: number;
};

/**
 * Two ways of sitting in its container, because its two callers need opposite
 * things.
 *
 * By default the photo is a plain block image at full width with its height
 * left to the browser, so the frame ends up exactly as tall as the photo is.
 * That is what makes cropping impossible on the mosaic wall: nothing asserts a
 * height for the photo to be fitted into, so there is no mismatch to crop away.
 *
 * With `fill`, it instead fits itself inside a container that has its own
 * fixed height — for a card in a grid, where every card must be the same
 * height. It fits rather than covers: the whole photograph is always shown,
 * and whatever the frame's shape leaves over is left as plain black bars.
 * Covering the frame instead would fill it edge to edge, but only by cutting
 * pieces off the photograph, and a partly-shown picture is worse than a
 * letterboxed one.
 */
export default function ImageCarousel({
  images,
  fill = false,
}: {
  images: CarouselImage[];
  fill?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [tick, setTick] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (!hovered || images.length < 2) return;

    const interval = setInterval(() => {
      setTick((t) => t - 1);
      setTransitioning(true);
      setTimeout(() => setTransitioning(false), TRANSITION_MS);
    }, INTERVAL_MS);
    return () => clearInterval(interval);
  }, [hovered, images.length]);

  if (images.length === 0) {
    return (
      <div
        className={`bg-zinc-100 dark:bg-zinc-900 ${
          fill ? "absolute inset-0" : "aspect-[4/3] w-full"
        }`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
    );
  }

  const mod = (n: number) => ((n % images.length) + images.length) % images.length;
  const current = mod(tick);
  const prev = mod(tick + 1);

  return (
    <div
      className={`overflow-hidden ${fill ? "absolute inset-0 bg-black" : "relative"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {transitioning && (
        <img
          key={`out-${tick}`}
          src={images[prev].src}
          alt=""
          draggable={false}
          className={`absolute inset-0 h-full w-full ${fill ? "object-contain" : ""}`}
          style={{ animation: `slide-out-left ${TRANSITION_MS}ms ease-in-out forwards` }}
        />
      )}
      <img
        key={`in-${tick}`}
        src={images[current].src}
        alt={images[current].alt}
        draggable={false}
        width={images[current].w}
        height={images[current].h}
        className={
          fill ? "absolute inset-0 h-full w-full object-contain" : "block h-auto w-full"
        }
        style={
          transitioning
            ? { animation: `slide-in-left ${TRANSITION_MS}ms ease-in-out forwards` }
            : undefined
        }
      />
    </div>
  );
}
