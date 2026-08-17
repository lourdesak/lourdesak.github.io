"use client";

import { useEffect, useRef, useState } from "react";

const WIDTH = 600;
const HEIGHT = 20;
const SEGMENTS = 60;
const FREQUENCY = 2.5;
const MAX_AMPLITUDE = 6;
const SPEED = 0.09;
const EASE = 0.08;

const FLAT_PATH = `M0,${HEIGHT / 2} L${WIDTH},${HEIGHT / 2}`;

export default function NameWave({ name }: { name: string }) {
  const [hovered, setHovered] = useState(false);
  const pathRef = useRef<SVGPathElement>(null);
  const amplitudeRef = useRef(0);
  const phaseRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const targetAmplitude = hovered ? MAX_AMPLITUDE : 0;

    function tick() {
      amplitudeRef.current += (targetAmplitude - amplitudeRef.current) * EASE;
      phaseRef.current += SPEED;

      const amplitude = amplitudeRef.current;
      const settled = !hovered && Math.abs(amplitude) < 0.05;

      if (settled) {
        pathRef.current?.setAttribute("d", FLAT_PATH);
        amplitudeRef.current = 0;
        frameRef.current = null;
        return;
      }

      const points: string[] = [];
      for (let i = 0; i <= SEGMENTS; i++) {
        const x = (WIDTH / SEGMENTS) * i;
        const y =
          HEIGHT / 2 +
          amplitude *
            Math.sin((i / SEGMENTS) * FREQUENCY * Math.PI * 2 + phaseRef.current);
        points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
      }
      pathRef.current?.setAttribute("d", `M${points.join(" L")}`);
      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [hovered]);

  return (
    <div
      className="inline-flex w-fit flex-col gap-1"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
        {name}
      </h1>
      <svg
        width="100%"
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
      >
        <path
          ref={pathRef}
          d={FLAT_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className="text-zinc-400 dark:text-zinc-600"
        />
      </svg>
    </div>
  );
}
