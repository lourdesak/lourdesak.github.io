"use client";

import { useEffect, useRef } from "react";

const SEED_SPEED = 0.22; // px/ms
const SEED_RADIUS = 28;
const BURST_MIN = 24;
const BURST_MAX = 40;
const FRAGMENT_SPEED_MIN = 0.02; // px/ms
const FRAGMENT_SPEED_MAX = 0.13;
const FRAGMENT_SIZE_MIN = 3;
const FRAGMENT_SIZE_MAX = 22; // must stay below SEED_RADIUS
const FRAGMENT_LIFE_MIN = 4500; // ms
const FRAGMENT_LIFE_MAX = 7500;
const CYCLE_PAUSE_MS = 5000;
const RING_LIFE_MS = 900;
const CHORD_COUNT_MIN = 14;
const CHORD_COUNT_MAX = 26;
const ARC_COUNT_MIN = 4;
const ARC_COUNT_MAX = 7;
const BOUNDARY_DELAY_MS = 2000; // corner lining appears/activates this long after burst
const BOUNDARY_FADE_MS = 600;
const BOUNDARY_RADIUS_RATIO = 0.22;
const BOUNDARY_RADIUS_MIN = 140;
const BOUNDARY_RADIUS_MAX = 260;

type Vec = { x: number; y: number };

type SphereLine =
  | { kind: "chord"; a1: number; a2: number; width: number; alpha: number }
  | { kind: "arc"; rotation: number; ry: number; width: number; alpha: number };

type Seed = {
  pos: Vec;
  vel: Vec;
  target: Vec;
  arrived: boolean;
  lines: SphereLine[];
};

type Fragment = {
  pos: Vec;
  vel: Vec;
  age: number;
  life: number;
  size: number;
  lines: SphereLine[];
  stopped: boolean;
};

type Phase =
  | { kind: "waiting"; until: number }
  | { kind: "seeding"; seeds: [Seed, Seed]; target: Vec }
  | { kind: "bursting"; fragments: Fragment[]; age: number; origin: Vec };

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function generateWireSphereLines(): SphereLine[] {
  const lines: SphereLine[] = [];
  const chordCount = Math.floor(rand(CHORD_COUNT_MIN, CHORD_COUNT_MAX));
  for (let i = 0; i < chordCount; i++) {
    lines.push({
      kind: "chord",
      a1: rand(0, Math.PI * 2),
      a2: rand(0, Math.PI * 2),
      width: rand(0.5, 1.4),
      alpha: rand(0.25, 0.7),
    });
  }
  const arcCount = Math.floor(rand(ARC_COUNT_MIN, ARC_COUNT_MAX));
  for (let i = 0; i < arcCount; i++) {
    lines.push({
      kind: "arc",
      rotation: rand(0, Math.PI),
      ry: rand(0.15, 0.9),
      width: rand(0.6, 1.3),
      alpha: rand(0.25, 0.55),
    });
  }
  return lines;
}

function drawWireSphere(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  opacity: number,
  lines: SphereLine[],
) {
  ctx.strokeStyle = `rgba(255,255,255,${opacity})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  for (const line of lines) {
    ctx.strokeStyle = `rgba(255,255,255,${opacity * line.alpha})`;
    ctx.lineWidth = line.width;
    if (line.kind === "chord") {
      ctx.beginPath();
      ctx.moveTo(x + radius * Math.cos(line.a1), y + radius * Math.sin(line.a1));
      ctx.lineTo(x + radius * Math.cos(line.a2), y + radius * Math.sin(line.a2));
      ctx.stroke();
    } else {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(line.rotation);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius, radius * line.ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function boundaryRadius(width: number, height: number) {
  const raw = Math.min(width, height) * BOUNDARY_RADIUS_RATIO;
  return Math.min(BOUNDARY_RADIUS_MAX, Math.max(BOUNDARY_RADIUS_MIN, raw));
}

function drawCornerLining(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
  opacity: number,
) {
  const corners: { x: number; y: number; start: number; end: number }[] = [
    { x: 0, y: 0, start: 0, end: Math.PI / 2 },
    { x: width, y: 0, start: Math.PI / 2, end: Math.PI },
    { x: width, y: height, start: Math.PI, end: Math.PI * 1.5 },
    { x: 0, y: height, start: Math.PI * 1.5, end: Math.PI * 2 },
  ];
  for (const corner of corners) {
    for (const inset of [0, 8]) {
      ctx.strokeStyle = `rgba(255,255,255,${opacity * (inset === 0 ? 0.55 : 0.35)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, radius - inset, corner.start, corner.end);
      ctx.stroke();
    }
  }
}

function makeSeeding(width: number, height: number): Phase {
  const y = rand(height * 0.3, height * 0.7);
  const target: Vec = { x: width / 2, y };
  const leftSeed: Seed = {
    pos: { x: -SEED_RADIUS - 10, y },
    vel: { x: SEED_SPEED, y: 0 },
    target,
    arrived: false,
    lines: generateWireSphereLines(),
  };
  const rightSeed: Seed = {
    pos: { x: width + SEED_RADIUS + 10, y },
    vel: { x: -SEED_SPEED, y: 0 },
    target,
    arrived: false,
    lines: generateWireSphereLines(),
  };
  return { kind: "seeding", seeds: [leftSeed, rightSeed], target };
}

function burstAt(origin: Vec): Phase {
  const count = Math.floor(rand(BURST_MIN, BURST_MAX));
  const fragments: Fragment[] = Array.from({ length: count }, () => {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(FRAGMENT_SPEED_MIN, FRAGMENT_SPEED_MAX);
    return {
      pos: { x: origin.x, y: origin.y },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      age: 0,
      life: rand(FRAGMENT_LIFE_MIN, FRAGMENT_LIFE_MAX),
      size: rand(FRAGMENT_SIZE_MIN, FRAGMENT_SIZE_MAX),
      lines: generateWireSphereLines(),
      stopped: false,
    };
  });
  return { kind: "bursting", fragments, age: 0, origin };
}

export default function ParticleCollision() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    let phase: Phase = { kind: "waiting", until: performance.now() + 500 };
    let lastTime = performance.now();
    let frameId: number;

    function step(now: number) {
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;
      ctx!.clearRect(0, 0, width, height);

      if (phase.kind === "waiting") {
        if (now >= phase.until) phase = makeSeeding(width, height);
      } else if (phase.kind === "seeding") {
        let allArrived = true;
        for (const seed of phase.seeds) {
          if (!seed.arrived) {
            const prevDx = seed.target.x - seed.pos.x;
            seed.pos.x += seed.vel.x * dt;
            const newDx = seed.target.x - seed.pos.x;
            if (Math.sign(prevDx) !== Math.sign(newDx) || Math.abs(newDx) < 1) {
              seed.pos.x = seed.target.x;
              seed.arrived = true;
            }
          }
          if (!seed.arrived) allArrived = false;
        }
        for (const seed of phase.seeds) {
          drawWireSphere(ctx!, seed.pos.x, seed.pos.y, SEED_RADIUS, 0.9, seed.lines);
        }
        if (allArrived) phase = burstAt(phase.target);
      } else if (phase.kind === "bursting") {
        phase.age += dt;
        const ringT = Math.min(phase.age / RING_LIFE_MS, 1);
        if (ringT < 1) {
          ctx!.strokeStyle = `rgba(255,255,255,${0.5 * (1 - ringT)})`;
          ctx!.lineWidth = 1.5;
          ctx!.beginPath();
          ctx!.arc(phase.origin.x, phase.origin.y, 6 + ringT * 90, 0, Math.PI * 2);
          ctx!.stroke();
        }

        const boundaryActive = phase.age >= BOUNDARY_DELAY_MS;
        if (boundaryActive) {
          const fadeT = Math.min((phase.age - BOUNDARY_DELAY_MS) / BOUNDARY_FADE_MS, 1);
          drawCornerLining(ctx!, width, height, boundaryRadius(width, height), fadeT);
        }

        let alive = false;
        for (const f of phase.fragments) {
          f.age += dt;
          if (f.age >= f.life) continue;
          alive = true;

          if (!f.stopped) {
            f.pos.x += f.vel.x * dt;
            f.pos.y += f.vel.y * dt;

            if (boundaryActive) {
              const r = boundaryRadius(width, height);
              const corners: Vec[] = [
                { x: 0, y: 0 },
                { x: width, y: 0 },
                { x: width, y: height },
                { x: 0, y: height },
              ];
              for (const corner of corners) {
                const dx = f.pos.x - corner.x;
                const dy = f.pos.y - corner.y;
                const dist = Math.hypot(dx, dy);
                if (dist <= r) {
                  const nx = dist === 0 ? 1 : dx / dist;
                  const ny = dist === 0 ? 0 : dy / dist;
                  f.pos.x = corner.x + nx * r;
                  f.pos.y = corner.y + ny * r;
                  f.vel.x = 0;
                  f.vel.y = 0;
                  f.stopped = true;
                  break;
                }
              }
            }
          }

          const lifeT = f.age / f.life;
          const opacity = 1 - lifeT;
          drawWireSphere(ctx!, f.pos.x, f.pos.y, f.size, opacity * 0.9, f.lines);
        }
        if (!alive) phase = { kind: "waiting", until: now + CYCLE_PAUSE_MS };
      }

      frameId = requestAnimationFrame(step);
    }

    frameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
