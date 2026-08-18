"use client";

import { useEffect, useState } from "react";

const INTERVAL_MS = 3000;
const TRANSITION_MS = 700;

type CarouselImage = {
  src: string;
  alt: string;
};

export default function ImageCarousel({ images }: { images: CarouselImage[] }) {
  const [tick, setTick] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setTransitioning(true);
      const timeout = setTimeout(() => setTransitioning(false), TRANSITION_MS);
      return () => clearTimeout(timeout);
    }, INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const current = tick % images.length;
  const prev = (tick - 1 + images.length) % images.length;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {transitioning && (
        <img
          key={`out-${tick}`}
          src={images[prev].src}
          alt={images[prev].alt}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ animation: `slide-out-right ${TRANSITION_MS}ms ease-in-out forwards` }}
        />
      )}
      <img
        key={`in-${tick}`}
        src={images[current].src}
        alt={images[current].alt}
        className="absolute inset-0 h-full w-full object-cover"
        style={
          transitioning
            ? { animation: `slide-in-right ${TRANSITION_MS}ms ease-in-out forwards` }
            : undefined
        }
      />
    </div>
  );
}
