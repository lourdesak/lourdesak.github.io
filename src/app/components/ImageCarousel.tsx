"use client";

import { useEffect, useState } from "react";

const INTERVAL_MS = 1500;
const TRANSITION_MS = 700;

type CarouselImage = {
  src: string;
  alt: string;
};

export default function ImageCarousel({ images }: { images: CarouselImage[] }) {
  const [hovered, setHovered] = useState(false);
  const [tick, setTick] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (!hovered || images.length === 0) return;

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
        className="absolute inset-0 overflow-hidden bg-black"
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
      className="absolute inset-0 overflow-hidden bg-black"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {transitioning && (
        <img
          key={`out-${tick}`}
          src={images[prev].src}
          alt={images[prev].alt}
          className="absolute inset-0 h-full w-full object-contain"
          style={{ animation: `slide-out-left ${TRANSITION_MS}ms ease-in-out forwards` }}
        />
      )}
      <img
        key={`in-${tick}`}
        src={images[current].src}
        alt={images[current].alt}
        className="absolute inset-0 h-full w-full object-contain"
        style={
          transitioning
            ? { animation: `slide-in-left ${TRANSITION_MS}ms ease-in-out forwards` }
            : undefined
        }
      />
    </div>
  );
}
