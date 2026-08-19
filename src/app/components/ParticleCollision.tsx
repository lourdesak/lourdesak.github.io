"use client";

import { useEffect, useRef } from "react";

const SEED_SPEED = 0.22; // px/ms
const SEED_RADIUS = 28;
const BURST_MIN = 10;
const BURST_MAX = 16;
const FRAGMENT_SPEED_MIN = 0.02; // px/ms
const FRAGMENT_SPEED_MAX = 0.09;
const FRAGMENT_SIZE_MIN = 20;
const FRAGMENT_SIZE_MAX = 48;
const FRAGMENT_LIFE_MIN = 4500; // ms
const FRAGMENT_LIFE_MAX = 7500;
const CYCLE_PAUSE_MS = 5000;
const RING_LIFE_MS = 900;

type Vec = { x: number; y: number };

type Seed = {
  pos: Vec;
  vel: Vec;
  target: Vec;
  arrived: boolean;
};

type Fragment = {
  pos: Vec;
  vel: Vec;
  age: number;
  life: number;
  size: number;
};

type Phase =
  | { kind: "waiting"; until: number }
  | { kind: "seeding"; seeds: [Seed, Seed]; target: Vec }
  | { kind: "bursting"; fragments: Fragment[]; ringAge: number; origin: Vec };

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function drawSphere(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  opacity: number,
) {
  const gradient = ctx.createRadialGradient(
    x - radius * 0.3,
    y - radius * 0.3,
    radius * 0.1,
    x,
    y,
    radius,
  );
  gradient.addColorStop(0, `rgba(255,255,255,${opacity})`);
  gradient.addColorStop(0.7, `rgba(255,255,255,${opacity * 0.55})`);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function makeSeeding(width: number, height: number): Phase {
  const y = rand(height * 0.3, height * 0.7);
  const target: Vec = { x: width / 2, y };
  const leftSeed: Seed = {
    pos: { x: -SEED_RADIUS - 10, y },
    vel: { x: SEED_SPEED, y: 0 },
    target,
    arrived: false,
  };
  const rightSeed: Seed = {
    pos: { x: width + SEED_RADIUS + 10, y },
    vel: { x: -SEED_SPEED, y: 0 },
    target,
    arrived: false,
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
    };
  });
  return { kind: "bursting", fragments, ringAge: 0, origin };
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
          drawSphere(ctx!, seed.pos.x, seed.pos.y, SEED_RADIUS, 0.9);
        }
        if (allArrived) phase = burstAt(phase.target);
      } else if (phase.kind === "bursting") {
        phase.ringAge += dt;
        const ringT = Math.min(phase.ringAge / RING_LIFE_MS, 1);
        if (ringT < 1) {
          ctx!.strokeStyle = `rgba(255,255,255,${0.5 * (1 - ringT)})`;
          ctx!.lineWidth = 1.5;
          ctx!.beginPath();
          ctx!.arc(phase.origin.x, phase.origin.y, 6 + ringT * 90, 0, Math.PI * 2);
          ctx!.stroke();
        }

        let alive = false;
        for (const f of phase.fragments) {
          f.age += dt;
          if (f.age >= f.life) continue;
          alive = true;
          f.pos.x += f.vel.x * dt;
          f.pos.y += f.vel.y * dt;
          const lifeT = f.age / f.life;
          const opacity = 1 - lifeT;
          drawSphere(ctx!, f.pos.x, f.pos.y, f.size, opacity * 0.9);
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
