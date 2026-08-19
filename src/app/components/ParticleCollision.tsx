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
const QUICK_FADE_MS = 350; // how fast a fragment vanishes once it touches the detector wall

const WALL_DELAY_MS = 2000; // detector wall appears this long after the burst
const WALL_FADE_IN_MS = 700;
const WALL_FADE_OUT_MS = 800; // how long the wall takes to disappear once every particle has arrived
const WALL_VP_X_RATIO = 0.5; // vanishing point: where the dome recedes to
const WALL_VP_Y_RATIO = 0.35;
const WALL_RING_SPACING = 20; // px between concentric rings
const WALL_ARC_DOT_SPACING = 20; // approx px between dots along a ring
const WALL_DOT_MIN_RADIUS = 0.6; // near the vanishing point (far away)
const WALL_DOT_MAX_RADIUS = 3.2; // near the edges (close to the viewer)
const WALL_MAX_TILT = 1.15; // rad; how obliquely we see a dome out at the rim
const WALL_MIN_FORESHORTEN = 0.3; // domes never squash flatter than this
const WALL_LIGHT_DIR = { x: -0.55, y: -0.83 }; // scene light, up and to the left
const WALL_FLAT_DOT_RADIUS = 1.1; // below this a gradient is invisible, so fill flat
const WALL_LIGHT_OFFSETS = [
  { dx: -0.16, dy: -0.05 },
  { dx: 0.03, dy: -0.11 },
  { dx: 0.2, dy: -0.02 },
  { dx: 0.36, dy: -0.08 },
];

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
  | {
      kind: "bursting";
      fragments: Fragment[];
      age: number;
      origin: Vec;
      settledAt: number | null;
    };

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

// One photomultiplier: a half sphere bulging out of the wall toward the viewer.
// Straight ahead (tilt angle 0) we see the full circular bulge; further around
// the dome we see it edge-on, so it foreshortens into an ellipse squashed along
// the radial direction, and its highlight slides toward the vanishing point
// because the dome's axis still points back at us.
function drawDetectorDome(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  tilt: number, // radial direction of this dome, measured from the vanishing point
  foreshorten: number, // 1 = seen head-on, →0 = seen edge-on
  depthT: number,
  shade: number,
) {
  if (radius < WALL_FLAT_DOT_RADIUS) {
    ctx.fillStyle = `rgba(255,255,255,${shade * 0.75})`;
    ctx.beginPath();
    ctx.ellipse(x, y, radius * foreshorten, radius, tilt, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt); // local +x now points radially outward
  ctx.scale(foreshorten, 1); // squash along that radial axis

  // the scene light, expressed in this dome's own rotated frame
  const lx = WALL_LIGHT_DIR.x * Math.cos(tilt) + WALL_LIGHT_DIR.y * Math.sin(tilt);
  const ly = -WALL_LIGHT_DIR.x * Math.sin(tilt) + WALL_LIGHT_DIR.y * Math.cos(tilt);
  const hx = (lx * 0.38 - depthT * 0.3) * radius;
  const hy = ly * 0.38 * radius;

  const gradient = ctx.createRadialGradient(hx, hy, radius * 0.05, 0, 0, radius * 1.05);
  gradient.addColorStop(0, `rgba(255,255,255,${shade})`);
  gradient.addColorStop(0.45, `rgba(255,255,255,${shade * 0.5})`);
  gradient.addColorStop(1, `rgba(255,255,255,${shade * 0.12})`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// A lattice of half spheres arranged in concentric rings around a vanishing
// point, like looking up into the inside of a spherical neutrino detector tank:
// domes shrink and dim toward the center (far away) and grow toward the edges
// (close to the viewer), reading as a concave dome rather than a flat grid.
// The geometry only depends on the canvas size, so this renders once into an
// offscreen sprite that each frame blits at the current opacity.
function renderDetectorWall(width: number, height: number, dpr: number) {
  const sprite = document.createElement("canvas");
  sprite.width = Math.max(1, Math.round(width * dpr));
  sprite.height = Math.max(1, Math.round(height * dpr));
  const ctx = sprite.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const opacity = 1;
  const vp = { x: width * WALL_VP_X_RATIO, y: height * WALL_VP_Y_RATIO };
  const corners: Vec[] = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];
  const maxRadius = Math.max(...corners.map((c) => Math.hypot(c.x - vp.x, c.y - vp.y)));
  const ringCount = Math.max(1, Math.round(maxRadius / WALL_RING_SPACING));

  for (let i = 1; i <= ringCount; i++) {
    const radius = i * WALL_RING_SPACING;
    const dotsInRing = Math.max(6, Math.round((2 * Math.PI * radius) / WALL_ARC_DOT_SPACING));
    const depthT = i / ringCount; // 0 near the vanishing point, 1 near the edges
    const dotRadius =
      WALL_DOT_MIN_RADIUS + (WALL_DOT_MAX_RADIUS - WALL_DOT_MIN_RADIUS) * depthT;
    // how obliquely this ring is seen, and how much that squashes each dome
    const tiltAngle = depthT * WALL_MAX_TILT;
    const foreshorten = Math.max(WALL_MIN_FORESHORTEN, Math.cos(tiltAngle));
    for (let d = 0; d < dotsInRing; d++) {
      const angle = (d / dotsInRing) * Math.PI * 2;
      const x = vp.x + radius * Math.cos(angle);
      const y = vp.y + radius * Math.sin(angle);
      if (x < -20 || x > width + 20 || y < -20 || y > height + 20) continue;
      const shade =
        (0.16 + 0.18 * Math.abs(Math.sin(i * 12.9898 + d * 4.1414))) *
        (0.4 + 0.6 * depthT);
      drawDetectorDome(ctx, x, y, dotRadius, angle, foreshorten, depthT, opacity * shade);
    }
  }

  for (const light of WALL_LIGHT_OFFSETS) {
    const lx = vp.x + light.dx * maxRadius;
    const ly = vp.y + light.dy * maxRadius;
    const gradient = ctx.createRadialGradient(lx, ly, 0, lx, ly, 44);
    gradient.addColorStop(0, `rgba(255,255,255,${opacity * 0.55})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(lx, ly, 44, 0, Math.PI * 2);
    ctx.fill();
  }

  return sprite;
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
  return { kind: "bursting", fragments, age: 0, origin, settledAt: null };
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
    let wallSprite: HTMLCanvasElement | null = null;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      wallSprite = null; // the dome lattice depends on the canvas size
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

        const wallActive = phase.age >= WALL_DELAY_MS;

        // has every fragment either touched the wall or faded out on its own?
        if (wallActive && phase.settledAt === null) {
          const settled = phase.fragments.every((f) => f.stopped || f.age >= f.life);
          if (settled) phase.settledAt = phase.age;
        }

        let wallOpacity = 0;
        if (wallActive) {
          if (phase.settledAt === null) {
            wallOpacity = Math.min((phase.age - WALL_DELAY_MS) / WALL_FADE_IN_MS, 1);
          } else {
            wallOpacity = Math.max(
              0,
              1 - (phase.age - phase.settledAt) / WALL_FADE_OUT_MS,
            );
          }
        }
        if (wallOpacity > 0) {
          if (!wallSprite) {
            wallSprite = renderDetectorWall(width, height, window.devicePixelRatio || 1);
          }
          if (wallSprite) {
            ctx!.save();
            ctx!.globalAlpha = wallOpacity;
            ctx!.drawImage(wallSprite, 0, 0, width, height);
            ctx!.restore();
          }
        }

        let alive = false;
        for (const f of phase.fragments) {
          f.age += dt;
          if (f.age >= f.life) continue;
          alive = true;

          if (!f.stopped) {
            f.pos.x += f.vel.x * dt;
            f.pos.y += f.vel.y * dt;

            if (wallActive) {
              let touched = false;
              if (f.pos.x <= 0) {
                f.pos.x = 0;
                touched = true;
              } else if (f.pos.x >= width) {
                f.pos.x = width;
                touched = true;
              }
              if (f.pos.y <= 0) {
                f.pos.y = 0;
                touched = true;
              } else if (f.pos.y >= height) {
                f.pos.y = height;
                touched = true;
              }
              if (touched) {
                f.vel.x = 0;
                f.vel.y = 0;
                f.stopped = true;
                f.life = Math.min(f.life, f.age + QUICK_FADE_MS);
              }
            }
          }

          const lifeT = f.age / f.life;
          const opacity = 1 - lifeT;
          drawWireSphere(ctx!, f.pos.x, f.pos.y, f.size, opacity * 0.9, f.lines);
        }

        const wallDone = phase.settledAt !== null && wallOpacity <= 0;
        if (!alive && wallDone) phase = { kind: "waiting", until: now + CYCLE_PAUSE_MS };
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
