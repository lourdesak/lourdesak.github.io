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
const BOUNDARY_DELAY_MS = 2000; // detectors appear/activate this long after burst
const BOUNDARY_FADE_MS = 600;
const DOME_BULGE_RATIO = 0.22; // how far the dome pokes into the page, relative to min(width,height)
const DOME_BULGE_MIN = 140;
const DOME_BULGE_MAX = 260;
const DOME_CURVE_FACTOR = 3; // bigger = larger, gentler sphere (more convex, less tight)
const DOME_HALF_ANGLE = 0.58; // ~33deg visible slice of the sphere
const DOME_ROWS = 6;
const DOME_DOTS_PER_ROW = 13;
const DOME_DOT_RADIUS = 1.6;
const QUICK_FADE_MS = 350; // how fast a fragment vanishes once it touches a detector

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

type Dome = { center: Vec; outerRadius: number; centerAngle: number };

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

function bulgeDepth(width: number, height: number) {
  const raw = Math.min(width, height) * DOME_BULGE_RATIO;
  return Math.min(DOME_BULGE_MAX, Math.max(DOME_BULGE_MIN, raw));
}

// A convex dome bulging into the page from a corner: the sphere's own center
// sits outside the canvas, beyond the corner, so the visible cap curves
// toward the viewer/particles rather than receding into the corner.
function getCornerDomes(width: number, height: number): Dome[] {
  const bulge = bulgeDepth(width, height);
  const curve = bulge * DOME_CURVE_FACTOR;
  const corners: Vec[] = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];
  return corners.map((corner) => {
    const dirX = corner.x === 0 ? 1 : -1;
    const dirY = corner.y === 0 ? 1 : -1;
    const center = { x: corner.x - dirX * curve, y: corner.y - dirY * curve };
    return {
      center,
      outerRadius: curve + bulge,
      centerAngle: Math.atan2(dirY, dirX),
    };
  });
}

function drawDome(ctx: CanvasRenderingContext2D, dome: Dome, opacity: number) {
  const { center, outerRadius, centerAngle } = dome;
  const innerRadius = outerRadius - bulgeDepthFromRadius(outerRadius);

  ctx.strokeStyle = `rgba(255,255,255,${opacity * 0.55})`;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(
    center.x,
    center.y,
    outerRadius,
    centerAngle - DOME_HALF_ANGLE,
    centerAngle + DOME_HALF_ANGLE,
  );
  ctx.stroke();

  for (let r = 0; r < DOME_ROWS; r++) {
    const t = r / (DOME_ROWS - 1);
    const rowRadius = innerRadius + (outerRadius - innerRadius) * t;
    for (let d = 0; d < DOME_DOTS_PER_ROW; d++) {
      const a =
        centerAngle -
        DOME_HALF_ANGLE +
        ((d + 0.5) / DOME_DOTS_PER_ROW) * DOME_HALF_ANGLE * 2;
      const x = center.x + rowRadius * Math.cos(a);
      const y = center.y + rowRadius * Math.sin(a);
      const shade = 0.32 + 0.3 * Math.abs(Math.sin(r * 12.9898 + d * 4.1414));
      ctx.fillStyle = `rgba(255,255,255,${opacity * shade})`;
      ctx.beginPath();
      ctx.arc(x, y, DOME_DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function bulgeDepthFromRadius(outerRadius: number) {
  // the lattice only fills the outer shell of the sphere (the "bulge"),
  // not the full radius back to its (offscreen) center
  return outerRadius / (1 + DOME_CURVE_FACTOR);
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
        const domes = boundaryActive ? getCornerDomes(width, height) : [];
        if (boundaryActive) {
          const fadeT = Math.min((phase.age - BOUNDARY_DELAY_MS) / BOUNDARY_FADE_MS, 1);
          for (const dome of domes) drawDome(ctx!, dome, fadeT);
        }

        let alive = false;
        for (const f of phase.fragments) {
          f.age += dt;
          if (f.age >= f.life) continue;
          alive = true;

          if (!f.stopped) {
            f.pos.x += f.vel.x * dt;
            f.pos.y += f.vel.y * dt;

            for (const dome of domes) {
              const dx = f.pos.x - dome.center.x;
              const dy = f.pos.y - dome.center.y;
              const dist = Math.hypot(dx, dy);
              if (dist <= dome.outerRadius) {
                const nx = dist === 0 ? 1 : dx / dist;
                const ny = dist === 0 ? 0 : dy / dist;
                f.pos.x = dome.center.x + nx * dome.outerRadius;
                f.pos.y = dome.center.y + ny * dome.outerRadius;
                f.vel.x = 0;
                f.vel.y = 0;
                f.stopped = true;
                f.life = Math.min(f.life, f.age + QUICK_FADE_MS);
                break;
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
