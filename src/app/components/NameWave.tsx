"use client";

import { useLayoutEffect, useRef, useState } from "react";

const WIDTH = 300;
const HEIGHT = 36;
const BASE = 28;
const WAVE_COUNT = 3;
const UNIT_WIDTH = WIDTH / WAVE_COUNT;
const RISE = 15;
const MAX_RADIUS = 7;
const SWEEP = (480 * Math.PI) / 180;
const THETA0 = (-130 * Math.PI) / 180;
const SPIRAL_STEPS = 16;
const PHASE_SPEED = 0.035;
const STAGGER = 1.8;
const EASE = 0.06;

const FLAT_PATH = `M0,${BASE} L${WIDTH},${BASE}`;

function buildWavePath(intensity: number, phase: number) {
  if (intensity < 0.01) return FLAT_PATH;

  const rise = RISE * intensity;
  const maxRadius = MAX_RADIUS * intensity;
  let d = `M0,${BASE}`;

  for (let i = 0; i < WAVE_COUNT; i++) {
    const x0 = i * UNIT_WIDTH;
    const w = UNIT_WIDTH;
    const wavePhase = phase + i * STAGGER;

    const crestStart = { x: x0 + w * 0.4, y: BASE - rise };
    const c1 = { x: x0 + w * 0.12, y: BASE };
    const c2 = { x: x0 + w * 0.22, y: BASE - rise * 0.85 };
    d += ` C${c1.x.toFixed(2)},${c1.y.toFixed(2)} ${c2.x.toFixed(2)},${c2.y.toFixed(2)} ${crestStart.x.toFixed(2)},${crestStart.y.toFixed(2)}`;

    const center = {
      x: crestStart.x - maxRadius * Math.cos(THETA0),
      y: crestStart.y - maxRadius * Math.sin(THETA0),
    };

    let last = crestStart;
    for (let s = 1; s <= SPIRAL_STEPS; s++) {
      const t = s / SPIRAL_STEPS;
      // extra rotation and radius wobble are scaled by t so the spiral
      // always starts exactly at crestStart, keeping the path continuous
      const theta = THETA0 + SWEEP * t + wavePhase * 0.4 * t;
      const radius =
        maxRadius * (1 - t * 0.82) +
        maxRadius * 0.18 * Math.sin(wavePhase * 2 + t * 9) * t;
      last = {
        x: center.x + radius * Math.cos(theta),
        y: center.y + radius * Math.sin(theta),
      };
      d += ` L${last.x.toFixed(2)},${last.y.toFixed(2)}`;
    }

    const c3 = { x: last.x + w * 0.06, y: last.y + (BASE - last.y) * 0.35 };
    const c4 = { x: x0 + w * 0.82, y: BASE - 1 };
    const exit = { x: x0 + w, y: BASE };
    d += ` C${c3.x.toFixed(2)},${c3.y.toFixed(2)} ${c4.x.toFixed(2)},${c4.y.toFixed(2)} ${exit.x.toFixed(2)},${exit.y.toFixed(2)}`;
  }

  return d;
}

export default function NameWave({ name }: { name: string }) {
  const [hovered, setHovered] = useState(false);
  const [lineWidth, setLineWidth] = useState<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const intensityRef = useRef(0);
  const phaseRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (headingRef.current) {
      setLineWidth(headingRef.current.offsetWidth);
    }
  }, []);

  useLayoutEffect(() => {
    const targetIntensity = hovered ? 1 : 0;

    function tick() {
      intensityRef.current += (targetIntensity - intensityRef.current) * EASE;
      phaseRef.current += PHASE_SPEED;

      const intensity = intensityRef.current;
      const settled = !hovered && intensity < 0.01;

      if (settled) {
        pathRef.current?.setAttribute("d", FLAT_PATH);
        intensityRef.current = 0;
        frameRef.current = null;
        return;
      }

      pathRef.current?.setAttribute("d", buildWavePath(intensity, phaseRef.current));
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
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <h1
        ref={headingRef}
        className="inline-block text-4xl font-semibold tracking-tight text-black dark:text-zinc-50"
      >
        {name}
      </h1>
      {lineWidth != null && (
        <svg
          width={lineWidth}
          height={HEIGHT}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="block"
        >
          <path
            ref={pathRef}
            d={FLAT_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={hovered ? "text-[#8a7a00]" : "text-zinc-400 dark:text-zinc-600"}
          />
        </svg>
      )}
    </div>
  );
}
