"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

// Wraps a word in the bio so that hovering it pops the photo up above the line.
// Focus opens it too, so it isn't mouse-only.
export default function HoverPhoto({
  children,
  src,
  alt,
  width,
  height,
  // Tailwind width for the popup. Portrait shots want a narrower panel than
  // landscape ones, or they end up taller than the viewport.
  panelWidth = "w-56",
}: {
  children: ReactNode;
  src: string;
  alt: string;
  width: number;
  height: number;
  panelWidth?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        // inherits its colour from the surrounding text, so the caller keeps control of it
        className="cursor-help underline decoration-dotted underline-offset-4 transition hover:brightness-125 focus-visible:brightness-125"
      >
        {children}
      </button>

      <span
        aria-hidden={!open}
        className={`pointer-events-none absolute bottom-full left-1/2 z-30 mb-3 block ${panelWidth} origin-bottom transition duration-300 ease-out ${
          open
            ? "-translate-x-1/2 translate-y-0 rotate-[-2deg] scale-100 opacity-100"
            : "-translate-x-1/2 translate-y-3 rotate-0 scale-95 opacity-0"
        }`}
      >
        <span className="relative block overflow-hidden rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/15">
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="block h-auto w-full"
          />
        </span>
      </span>
    </span>
  );
}
