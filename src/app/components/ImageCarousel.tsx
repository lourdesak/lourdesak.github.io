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
  /** renders as a looping, muted <video> instead of an <img> */
  type?: "video";
  /** shown while the video loads; only meaningful when type is "video" */
  poster?: string;
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
  active,
}: {
  images: CarouselImage[];
  fill?: boolean;
  /**
   * Drives the cycling from outside. Callers that lay something over the
   * carousel (SimulationDetail's click target) steal the hover, so they track
   * it themselves and hand it in here. Left undefined, the carousel watches
   * its own hover as before.
   */
  active?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [tick, setTick] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const running = active ?? hovered;

  useEffect(() => {
    if (!running || images.length < 2) return;

    const interval = setInterval(() => {
      setTick((t) => t - 1);
      setTransitioning(true);
      setTimeout(() => setTransitioning(false), TRANSITION_MS);
    }, INTERVAL_MS);
    return () => clearInterval(interval);
  }, [running, images.length]);

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
        <Slide
          key={`out-${tick}`}
          image={images[prev]}
          // the outgoing slide stays absolutely positioned even off `fill`,
          // so it can slide away without disturbing document flow
          className={`absolute inset-0 h-full w-full ${fill ? "object-contain" : ""}`}
          alt=""
          style={{ animation: `slide-out-left ${TRANSITION_MS}ms ease-in-out forwards` }}
        />
      )}
      <Slide
        key={`in-${tick}`}
        image={images[current]}
        className={
          fill ? "absolute inset-0 h-full w-full object-contain" : "block h-auto w-full"
        }
        alt={images[current].alt}
        style={
          transitioning
            ? { animation: `slide-in-left ${TRANSITION_MS}ms ease-in-out forwards` }
            : undefined
        }
      />
    </div>
  );
}

/** One slide: an <img>, or a looping muted <video> when the item asks for it. */
function Slide({
  image,
  className,
  alt,
  style,
}: {
  image: CarouselImage;
  className: string;
  alt: string;
  style?: React.CSSProperties;
}) {
  if (image.type === "video") {
    return (
      <video
        src={image.src}
        poster={image.poster}
        width={image.w}
        height={image.h}
        className={className}
        style={style}
        autoPlay
        loop
        muted
        playsInline
      />
    );
  }

  return (
    <img
      src={image.src}
      alt={alt}
      draggable={false}
      width={image.w}
      height={image.h}
      className={className}
      style={style}
    />
  );
}
