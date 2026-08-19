"use client";

import { useEffect, useRef } from "react";

const SEED_SPEED = 0.22; // px/ms
const SEED_RADIUS = 28;
// Pointer proximity charges up the approach. The boost is deliberately spent
// on the run-in rather than the burst: the aftermath keeps roughly its usual
// pacing, so a hard hit reads as livelier without blowing the sequence past
// the viewer in under a second.
const POINTER_BOOST_MAX = 2; // approach multiplier with the pointer dead centre
const POINTER_BOOST_FALLOFF = 0.55; // fraction of the half-diagonal the boost reaches
const POINTER_BOOST_EASE_MS = 160; // how quickly the boost chases the pointer
const ENERGY_SPEED_GAIN = 0.25; // energy → fragment speed (kept low on purpose)
const ENERGY_COUNT_GAIN = 0.35; // energy → fragment count (free: costs no dwell time)
const ENERGY_WALL_GAIN = 0.15; // energy → how much sooner the wall arrives
const SEED_SPIN_MIN = 0.0016; // rad/ms
const SEED_SPIN_MAX = 0.0042;
const FRAGMENT_SPIN_MAX = 0.0022;
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
const WALL_RING_SPACING = 28; // px between concentric rings
const WALL_ARC_DOT_SPACING = 28; // approx px between dots along a ring
const WALL_DOT_MIN_RADIUS = 2.4; // near the vanishing point (far away)
const WALL_DOT_MAX_RADIUS = 12.8; // near the edges (close to the viewer)
const WALL_MAX_TILT = 1.15; // rad; how obliquely we see a dome out at the rim
const WALL_MIN_FORESHORTEN = 0.3; // domes never squash flatter than this
const WALL_LIGHT_DIR = { x: -0.55, y: -0.83 }; // scene light, up and to the left
const WALL_FLAT_DOT_RADIUS = 1.1; // below this a gradient is invisible, so fill flat
const WALL_LIT_TUBE_CHANCE = 0.05; // fraction of tubes glowing from the inside
const WALL_SPRITE_SCALE = 3; // supersample the wall so the domes stay crisp
const WALL_LIGHT_OFFSETS = [
  { dx: -0.16, dy: -0.05 },
  { dx: 0.03, dy: -0.11 },
  { dx: 0.2, dy: -0.02 },
  { dx: 0.36, dy: -0.08 },
];

type Vec = { x: number; y: number };

type SphereLine =
  | { kind: "chord"; a1: number; a2: number; width: number; alpha: number }
  | {
      kind: "arc";
      rotation: number;
      ry: number;
      width: number;
      alpha: number;
      phase: number;
    };

type Spinner = {
  spin: number; // rad/ms, signed
  angle: number; // accumulated rotation
};

type Seed = Spinner & {
  pos: Vec;
  vel: Vec;
  target: Vec;
  arrived: boolean;
  lines: SphereLine[];
};

type Fragment = Spinner & {
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
      energy: number; // 1 = a drifting collision, higher = a hard one
      wallDelay: number;
    };

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// stable pseudo-random in [0,1) so a tube looks the same every time it renders
function hash01(a: number, b: number) {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
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
      phase: rand(0, Math.PI * 2),
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
  // How far the sphere has turned about its own axis. Defaults to 0 so a call
  // site that doesn't spin still draws a complete wireframe.
  angle = 0,
) {
  // a sphere's silhouette doesn't change as it turns, so only the wireframe
  // inside it moves
  ctx.strokeStyle = `rgba(255,255,255,${opacity})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  for (const line of lines) {
    ctx.strokeStyle = `rgba(255,255,255,${opacity * line.alpha})`;
    ctx.lineWidth = line.width;
    if (line.kind === "chord") {
      // both endpoints ride around the surface as it rotates
      const a1 = line.a1 + angle;
      const a2 = line.a2 + angle;
      ctx.beginPath();
      ctx.moveTo(x + radius * Math.cos(a1), y + radius * Math.sin(a1));
      ctx.lineTo(x + radius * Math.cos(a2), y + radius * Math.sin(a2));
      ctx.stroke();
    } else {
      // a latitude ring turning in depth: it opens out to a full circle and
      // flattens to a line as it goes edge-on, which is what makes the spin
      // read as three-dimensional instead of a flat pinwheel. It never fully
      // collapses, so the wireframe keeps its density throughout.
      const openness = 0.18 + 0.82 * Math.abs(Math.cos(angle + line.phase));
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(line.rotation);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius, radius * line.ry * openness, 0, 0, Math.PI * 2);
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
  seed: number, // stable per-tube randomness in [0,1)
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

  // The scene light, expressed in this dome's own rotated frame. The dome's
  // axis still points back at the viewer, so the whole lobe also drifts toward
  // the vanishing point (local -x) the further out on the wall we are.
  const lx =
    WALL_LIGHT_DIR.x * Math.cos(tilt) + WALL_LIGHT_DIR.y * Math.sin(tilt) - depthT * 0.4;
  const ly = -WALL_LIGHT_DIR.x * Math.sin(tilt) + WALL_LIGHT_DIR.y * Math.cos(tilt);
  const len = Math.max(Math.hypot(lx, ly), 1e-4);
  const ux = lx / len;
  const uy = ly / len;
  const lobe = Math.min(len, 1); // how far off-axis the highlight sits

  // Everything below is layered inside the dome's silhouette.
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.save();
  ctx.clip();

  const box = radius * 2;

  // 1. body — ambient term with limb darkening, so the glass falls off toward
  // the silhouette instead of ending on a hard edge
  const body = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  body.addColorStop(0, `rgba(255,255,255,${shade * 0.34})`);
  body.addColorStop(0.62, `rgba(255,255,255,${shade * 0.25})`);
  body.addColorStop(0.88, `rgba(255,255,255,${shade * 0.12})`);
  body.addColorStop(1, `rgba(255,255,255,${shade * 0.04})`);
  ctx.fillStyle = body;
  ctx.fillRect(-radius, -radius, box, box);

  ctx.globalCompositeOperation = "lighter";

  // 2. diffuse lobe — broad, centered where the surface normal meets the light
  const dx = ux * radius * 0.5 * lobe;
  const dy = uy * radius * 0.5 * lobe;
  const diffuse = ctx.createRadialGradient(dx, dy, 0, dx, dy, radius * 1.45);
  diffuse.addColorStop(0, `rgba(255,255,255,${shade * 0.5})`);
  diffuse.addColorStop(0.45, `rgba(255,255,255,${shade * 0.2})`);
  diffuse.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = diffuse;
  ctx.fillRect(-radius, -radius, box, box);

  // 3. specular hot spot — tight, and the thing that actually reads as "glass"
  const sx = ux * radius * 0.6 * lobe;
  const sy = uy * radius * 0.6 * lobe;
  const spec = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius * 0.34);
  spec.addColorStop(0, `rgba(255,255,255,${Math.min(1, shade * 3.4)})`);
  spec.addColorStop(0.35, `rgba(255,255,255,${shade * 0.7})`);
  spec.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = spec;
  ctx.fillRect(-radius, -radius, box, box);

  // 4. fresnel rim on the shadow side — the grazing-angle catch that separates
  // one tube from the next
  const lightAngle = Math.atan2(uy, ux);
  ctx.strokeStyle = `rgba(255,255,255,${shade * 0.45})`;
  ctx.lineWidth = radius * 0.14;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.93, lightAngle + 0.75, lightAngle + Math.PI * 2 - 0.75);
  ctx.stroke();

  // 5. a few tubes are live, glowing from the inside
  if (seed < WALL_LIT_TUBE_CHANCE) {
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.1);
    glow.addColorStop(0, `rgba(255,255,255,${Math.min(1, shade * 4)})`);
    glow.addColorStop(0.5, `rgba(255,255,255,${shade * 1.1})`);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(-radius, -radius, box, box);
  }

  ctx.restore(); // drop the clip and the additive blending

  // 6. housing collar the tube is seated in
  ctx.strokeStyle = `rgba(255,255,255,${shade * 0.4})`;
  ctx.lineWidth = Math.max(0.4, radius * 0.08);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.04, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// A lattice of half spheres arranged in concentric rings around a vanishing
// point, like looking up into the inside of a spherical neutrino detector tank:
// domes shrink and dim toward the center (far away) and grow toward the edges
// (close to the viewer), reading as a concave dome rather than a flat grid.
// The geometry only depends on the canvas size, so this renders once into an
// offscreen sprite that each frame blits at the current opacity.
function renderDetectorWall(width: number, height: number, dpr: number) {
  const scale = Math.max(dpr, WALL_SPRITE_SCALE);
  const sprite = document.createElement("canvas");
  sprite.width = Math.max(1, Math.round(width * scale));
  sprite.height = Math.max(1, Math.round(height * scale));
  const ctx = sprite.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

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
      const seed = hash01(i, d);
      const shade =
        (0.16 + 0.18 * Math.abs(Math.sin(i * 12.9898 + d * 4.1414))) *
        (0.4 + 0.6 * depthT);
      // no two tubes are quite the same size
      const tubeRadius = dotRadius * (0.88 + 0.24 * hash01(d, i));
      drawDetectorDome(
        ctx,
        x,
        y,
        tubeRadius,
        angle,
        foreshorten,
        depthT,
        opacity * shade,
        seed,
      );
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
  // the two spheres counter-rotate at unrelated rates and start at unrelated
  // phases, so the pair never reads as one mirrored object
  const leftSeed: Seed = {
    pos: { x: -SEED_RADIUS - 10, y },
    vel: { x: SEED_SPEED, y: 0 },
    target,
    arrived: false,
    lines: generateWireSphereLines(),
    spin: rand(SEED_SPIN_MIN, SEED_SPIN_MAX),
    angle: rand(0, Math.PI * 2),
  };
  const rightSeed: Seed = {
    pos: { x: width + SEED_RADIUS + 10, y },
    vel: { x: -SEED_SPEED, y: 0 },
    target,
    arrived: false,
    lines: generateWireSphereLines(),
    spin: -rand(SEED_SPIN_MIN, SEED_SPIN_MAX),
    angle: rand(0, Math.PI * 2),
  };
  return { kind: "seeding", seeds: [leftSeed, rightSeed], target };
}

// `energy` is the approach multiplier the seeds carried into the collision. It
// mostly buys more fragments and a bigger shockwave rather than more speed:
// speed is what shortens the fragments' time on screen, so it stays gentle.
function burstAt(origin: Vec, energy: number): Phase {
  const speedScale = 1 + (energy - 1) * ENERGY_SPEED_GAIN;
  const countScale = 1 + (energy - 1) * ENERGY_COUNT_GAIN;
  const count = Math.floor(rand(BURST_MIN, BURST_MAX) * countScale);
  const fragments: Fragment[] = Array.from({ length: count }, () => {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(FRAGMENT_SPEED_MIN, FRAGMENT_SPEED_MAX) * speedScale;
    return {
      pos: { x: origin.x, y: origin.y },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      age: 0,
      life: rand(FRAGMENT_LIFE_MIN, FRAGMENT_LIFE_MAX),
      size: rand(FRAGMENT_SIZE_MIN, FRAGMENT_SIZE_MAX),
      lines: generateWireSphereLines(),
      stopped: false,
      // the collision's angular momentum has to go somewhere
      spin: rand(-FRAGMENT_SPIN_MAX, FRAGMENT_SPIN_MAX),
      angle: rand(0, Math.PI * 2),
    };
  });
  return {
    kind: "bursting",
    fragments,
    age: 0,
    origin,
    settledAt: null,
    energy,
    wallDelay: WALL_DELAY_MS / (1 + (energy - 1) * ENERGY_WALL_GAIN),
  };
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

    const pointer = { x: 0, y: 0, inside: false };
    function handlePointerMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.inside = true;
    }
    function handlePointerLeave() {
      pointer.inside = false;
    }
    window.addEventListener("mousemove", handlePointerMove);
    document.addEventListener("mouseleave", handlePointerLeave);

    // How hard the pointer is driving the approach: 1 when it's far away or off
    // screen, rising to POINTER_BOOST_MAX right on the collision point.
    function targetBoost() {
      if (!pointer.inside) return 1;
      const reach = (Math.hypot(width, height) / 2) * POINTER_BOOST_FALLOFF;
      if (reach <= 0) return 1;
      const dist = Math.hypot(pointer.x - width / 2, pointer.y - height / 2);
      const t = Math.min(dist / reach, 1);
      const nearness = 1 - t * t * (3 - 2 * t); // smoothstep, 1 at dead centre
      return 1 + (POINTER_BOOST_MAX - 1) * nearness;
    }

    let boost = 1; // eased, so the spheres accelerate instead of snapping
    let phase: Phase = { kind: "waiting", until: performance.now() + 500 };
    let lastTime = performance.now();
    let frameId: number;

    function step(now: number) {
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;
      ctx!.clearRect(0, 0, width, height);

      boost += (targetBoost() - boost) * Math.min(1, dt / POINTER_BOOST_EASE_MS);

      if (phase.kind === "waiting") {
        if (now >= phase.until) phase = makeSeeding(width, height);
      } else if (phase.kind === "seeding") {
        let allArrived = true;
        for (const seed of phase.seeds) {
          // a sphere driven harder also tumbles faster
          seed.angle += seed.spin * dt * (0.5 + 0.5 * boost);
          if (!seed.arrived) {
            const prevDx = seed.target.x - seed.pos.x;
            seed.pos.x += seed.vel.x * dt * boost;
            const newDx = seed.target.x - seed.pos.x;
            if (Math.sign(prevDx) !== Math.sign(newDx) || Math.abs(newDx) < 1) {
              seed.pos.x = seed.target.x;
              seed.arrived = true;
            }
          }
          if (!seed.arrived) allArrived = false;
        }
        for (const seed of phase.seeds) {
          drawWireSphere(
            ctx!,
            seed.pos.x,
            seed.pos.y,
            SEED_RADIUS,
            0.9,
            seed.lines,
            seed.angle,
          );
        }
        // whatever speed they were carrying at impact becomes the burst energy
        if (allArrived) phase = burstAt(phase.target, boost);
      } else if (phase.kind === "bursting") {
        phase.age += dt;
        const ringT = Math.min(phase.age / RING_LIFE_MS, 1);
        if (ringT < 1) {
          // a harder hit throws a brighter, wider shockwave — this is where the
          // extra energy mostly shows, since it costs no dwell time
          const ringAlpha = Math.min(0.75, 0.5 * phase.energy);
          const ringSpread = 90 * (1 + (phase.energy - 1) * 0.45);
          ctx!.strokeStyle = `rgba(255,255,255,${ringAlpha * (1 - ringT)})`;
          ctx!.lineWidth = 1.5;
          ctx!.beginPath();
          ctx!.arc(phase.origin.x, phase.origin.y, 6 + ringT * ringSpread, 0, Math.PI * 2);
          ctx!.stroke();
        }

        const wallActive = phase.age >= phase.wallDelay;

        // has every fragment either touched the wall or faded out on its own?
        if (wallActive && phase.settledAt === null) {
          const settled = phase.fragments.every((f) => f.stopped || f.age >= f.life);
          if (settled) phase.settledAt = phase.age;
        }

        let wallOpacity = 0;
        if (wallActive) {
          if (phase.settledAt === null) {
            wallOpacity = Math.min((phase.age - phase.wallDelay) / WALL_FADE_IN_MS, 1);
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
            ctx!.imageSmoothingQuality = "high"; // the sprite is supersampled
            ctx!.drawImage(wallSprite, 0, 0, width, height);
            ctx!.restore();
          }
        }

        let alive = false;
        for (const f of phase.fragments) {
          f.age += dt;
          if (f.age >= f.life) continue;
          alive = true;

          f.angle += f.spin * dt;

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
          drawWireSphere(ctx!, f.pos.x, f.pos.y, f.size, opacity * 0.9, f.lines, f.angle);
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
      window.removeEventListener("mousemove", handlePointerMove);
      document.removeEventListener("mouseleave", handlePointerLeave);
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
