"use client";

import { useEffect, useRef } from "react";

const SEED_SPEED = 0.05; // px/ms
const BURST_MIN = 10;
const BURST_MAX = 16;
const FRAGMENT_SPEED_MIN = 0.02; // px/ms
const FRAGMENT_SPEED_MAX = 0.09;
const FRAGMENT_LIFE_MIN = 4500; // ms
const FRAGMENT_LIFE_MAX = 7500;
const CYCLE_PAUSE_MS = 5000;
const RING_LIFE_MS = 900;

type Vec = { x: number; y: number };

type Seed = {
  pos: Vec;
  vel: Vec;
  target: Vec;
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

function leftEdgePoint(height: number): Vec {
  return { x: -20, y: rand(0, height) };
}

function rightEdgePoint(width: number, height: number): Vec {
  return { x: width + 20, y: rand(0, height) };
}

function makeSeeding(width: number, height: number): Phase {
  const target: Vec = {
    x: rand(width * 0.25, width * 0.75),
    y: rand(height * 0.25, height * 0.75),
  };
  const seeds = [leftEdgePoint(height), rightEdgePoint(width, height)].map(
    (pos) => {
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const dist = Math.hypot(dx, dy) || 1;
      return {
        pos,
        vel: { x: (dx / dist) * SEED_SPEED, y: (dy / dist) * SEED_SPEED },
        target,
      };
    },
  ) as [Seed, Seed];
  return { kind: "seeding", seeds, target };
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
      size: rand(4, 9.6),
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
        let reached = true;
        for (const seed of phase.seeds) {
          seed.pos.x += seed.vel.x * dt;
          seed.pos.y += seed.vel.y * dt;
          const dx = seed.target.x - seed.pos.x;
          const dy = seed.target.y - seed.pos.y;
          if (Math.hypot(dx, dy) > 4) reached = false;
        }
        for (const seed of phase.seeds) {
          ctx!.strokeStyle = "rgba(255,255,255,0.85)";
          ctx!.lineWidth = 5.6;
          ctx!.beginPath();
          ctx!.moveTo(seed.pos.x - seed.vel.x * 12, seed.pos.y - seed.vel.y * 12);
          ctx!.lineTo(seed.pos.x, seed.pos.y);
          ctx!.stroke();
        }
        if (reached) phase = burstAt(phase.target);
      } else if (phase.kind === "bursting") {
        phase.ringAge += dt;
        const ringT = Math.min(phase.ringAge / RING_LIFE_MS, 1);
        if (ringT < 1) {
          ctx!.strokeStyle = `rgba(255,255,255,${0.5 * (1 - ringT)})`;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          ctx!.arc(phase.origin.x, phase.origin.y, 4 + ringT * 46, 0, Math.PI * 2);
          ctx!.stroke();
        }

        let alive = false;
        for (const f of phase.fragments) {
          f.age += dt;
          if (f.age >= f.life) continue;
          alive = true;
          const prevX = f.pos.x;
          const prevY = f.pos.y;
          f.pos.x += f.vel.x * dt;
          f.pos.y += f.vel.y * dt;
          const lifeT = f.age / f.life;
          const opacity = 1 - lifeT;
          ctx!.strokeStyle = `rgba(255,255,255,${opacity * 0.9})`;
          ctx!.lineWidth = f.size;
          ctx!.beginPath();
          ctx!.moveTo(prevX, prevY);
          ctx!.lineTo(f.pos.x, f.pos.y);
          ctx!.stroke();
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
