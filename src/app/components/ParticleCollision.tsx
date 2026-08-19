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

// The wall runs deep amber in the distance to bright gold at the rim, so the
// depth cue is carried by hue as well as by size and brightness.
const GOLD_FAR = [132, 71, 14] as const;
const GOLD_NEAR = [255, 205, 82] as const;
const GOLD_SPECULAR = [255, 247, 216] as const;
const GOLD_HUE_JITTER = 0.16; // per-tube drift along the amber→gold ramp

const STRIKE_LIFE_MS = 900; // how long a struck tube keeps glowing
const STRIKE_CORE = [255, 250, 226] as const;
const STRIKE_GLOW = [255, 184, 54] as const;

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
      strikes: Strike[]; // tubes lit by a fragment landing on them
    };

type Strike = { tube: Tube; age: number };

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// stable pseudo-random in [0,1) so a tube looks the same every time it renders
function hash01(a: number, b: number) {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

type RGB = readonly [number, number, number];

function mixRGB(a: RGB, b: RGB, t: number): RGB {
  const k = Math.min(1, Math.max(0, t));
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

function rgba(c: RGB, alpha: number) {
  return `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${alpha})`;
}

// ---------------------------------------------------------------------------
// Detector wall lattice
//
// Concentric rings of photomultiplier tubes around a vanishing point, like
// looking into the inside of a spherical detector tank. Every property of a
// tube is derived from its ring index and its position within that ring, so
// the sprite renderer and the hit test can't disagree about where a tube is.
// ---------------------------------------------------------------------------

type WallGeometry = {
  vp: Vec;
  maxRadius: number;
  ringCount: number;
  width: number;
  height: number;
};

type Tube = {
  x: number;
  y: number;
  radius: number;
  tilt: number; // radial direction out from the vanishing point
  foreshorten: number; // 1 = seen head-on, →0 = seen edge-on
  depthT: number; // 0 at the vanishing point, 1 out at the rim
  shade: number;
  seed: number;
};

function wallGeometry(width: number, height: number): WallGeometry {
  const vp = { x: width * WALL_VP_X_RATIO, y: height * WALL_VP_Y_RATIO };
  const corners: Vec[] = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];
  const maxRadius = Math.max(...corners.map((c) => Math.hypot(c.x - vp.x, c.y - vp.y)));
  return {
    vp,
    maxRadius,
    ringCount: Math.max(1, Math.round(maxRadius / WALL_RING_SPACING)),
    width,
    height,
  };
}

function tubesInRing(ringRadius: number) {
  return Math.max(6, Math.round((2 * Math.PI * ringRadius) / WALL_ARC_DOT_SPACING));
}

function tubeAt(geo: WallGeometry, ring: number, index: number): Tube {
  const ringRadius = ring * WALL_RING_SPACING;
  const angle = (index / tubesInRing(ringRadius)) * Math.PI * 2;
  const depthT = ring / geo.ringCount;
  const size = WALL_DOT_MIN_RADIUS + (WALL_DOT_MAX_RADIUS - WALL_DOT_MIN_RADIUS) * depthT;
  return {
    x: geo.vp.x + ringRadius * Math.cos(angle),
    y: geo.vp.y + ringRadius * Math.sin(angle),
    // no two tubes are quite the same size
    radius: size * (0.88 + 0.24 * hash01(index, ring)),
    tilt: angle,
    foreshorten: Math.max(WALL_MIN_FORESHORTEN, Math.cos(depthT * WALL_MAX_TILT)),
    depthT,
    shade:
      (0.16 + 0.18 * Math.abs(Math.sin(ring * 12.9898 + index * 4.1414))) *
      (0.4 + 0.6 * depthT),
    seed: hash01(ring, index),
  };
}

function forEachTube(geo: WallGeometry, visit: (tube: Tube) => void) {
  for (let ring = 1; ring <= geo.ringCount; ring++) {
    const count = tubesInRing(ring * WALL_RING_SPACING);
    for (let index = 0; index < count; index++) {
      const tube = tubeAt(geo, ring, index);
      const off =
        tube.x < -20 || tube.x > geo.width + 20 || tube.y < -20 || tube.y > geo.height + 20;
      if (!off) visit(tube);
    }
  }
}

// Which tube caught a particle that landed here: snap onto the nearest ring,
// then onto the nearest tube around that ring.
function nearestTube(geo: WallGeometry, x: number, y: number): Tube {
  const dx = x - geo.vp.x;
  const dy = y - geo.vp.y;
  const ring = Math.min(
    geo.ringCount,
    Math.max(1, Math.round(Math.hypot(dx, dy) / WALL_RING_SPACING)),
  );
  const count = tubesInRing(ring * WALL_RING_SPACING);
  const turns = Math.atan2(dy, dx) / (Math.PI * 2);
  const index = ((Math.round(turns * count) % count) + count) % count;
  return tubeAt(geo, ring, index);
}

// the tube's own place on the amber→gold ramp
function tubeColor(tube: Tube): RGB {
  return mixRGB(
    GOLD_FAR,
    GOLD_NEAR,
    tube.depthT + (tube.seed - 0.5) * GOLD_HUE_JITTER,
  );
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
function drawDetectorDome(ctx: CanvasRenderingContext2D, tube: Tube) {
  const { radius, tilt, foreshorten, depthT, shade, seed } = tube;
  const gold = tubeColor(tube);

  if (radius < WALL_FLAT_DOT_RADIUS) {
    ctx.fillStyle = rgba(gold, shade * 0.75);
    ctx.beginPath();
    ctx.ellipse(tube.x, tube.y, radius * foreshorten, radius, tilt, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.save();
  ctx.translate(tube.x, tube.y);
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
  body.addColorStop(0, rgba(gold, shade * 0.42));
  body.addColorStop(0.62, rgba(gold, shade * 0.3));
  body.addColorStop(0.88, rgba(mixRGB(gold, GOLD_FAR, 0.5), shade * 0.15));
  body.addColorStop(1, rgba(GOLD_FAR, shade * 0.05));
  ctx.fillStyle = body;
  ctx.fillRect(-radius, -radius, box, box);

  ctx.globalCompositeOperation = "lighter";

  // 2. diffuse lobe — broad, centered where the surface normal meets the light
  const dx = ux * radius * 0.5 * lobe;
  const dy = uy * radius * 0.5 * lobe;
  const warm = mixRGB(gold, GOLD_NEAR, 0.45);
  const diffuse = ctx.createRadialGradient(dx, dy, 0, dx, dy, radius * 1.45);
  diffuse.addColorStop(0, rgba(warm, shade * 0.55));
  diffuse.addColorStop(0.45, rgba(warm, shade * 0.22));
  diffuse.addColorStop(1, rgba(warm, 0));
  ctx.fillStyle = diffuse;
  ctx.fillRect(-radius, -radius, box, box);

  // 3. specular hot spot — tight, and the thing that actually reads as "glass"
  const sx = ux * radius * 0.6 * lobe;
  const sy = uy * radius * 0.6 * lobe;
  const spec = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius * 0.34);
  spec.addColorStop(0, rgba(GOLD_SPECULAR, Math.min(1, shade * 3.4)));
  spec.addColorStop(0.35, rgba(mixRGB(GOLD_SPECULAR, GOLD_NEAR, 0.6), shade * 0.75));
  spec.addColorStop(1, rgba(GOLD_NEAR, 0));
  ctx.fillStyle = spec;
  ctx.fillRect(-radius, -radius, box, box);

  // 4. fresnel rim on the shadow side — the grazing-angle catch that separates
  // one tube from the next
  const lightAngle = Math.atan2(uy, ux);
  ctx.strokeStyle = rgba(mixRGB(GOLD_NEAR, GOLD_SPECULAR, 0.35), shade * 0.5);
  ctx.lineWidth = radius * 0.14;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.93, lightAngle + 0.75, lightAngle + Math.PI * 2 - 0.75);
  ctx.stroke();

  // 5. a few tubes are live, glowing from the inside
  if (seed < WALL_LIT_TUBE_CHANCE) {
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.1);
    glow.addColorStop(0, rgba(GOLD_SPECULAR, Math.min(1, shade * 4)));
    glow.addColorStop(0.5, rgba(STRIKE_GLOW, shade * 1.2));
    glow.addColorStop(1, rgba(STRIKE_GLOW, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(-radius, -radius, box, box);
  }

  ctx.restore(); // drop the clip and the additive blending

  // 6. housing collar the tube is seated in
  ctx.strokeStyle = rgba(mixRGB(gold, GOLD_FAR, 0.35), shade * 0.45);
  ctx.lineWidth = Math.max(0.4, radius * 0.08);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.04, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// A tube that just caught a particle: it floods white-hot, cools back down
// through gold, spills light onto its neighbours and rings once.
function drawTubeStrike(
  ctx: CanvasRenderingContext2D,
  tube: Tube,
  t: number, // 0 at impact → 1 when spent
  opacity: number,
) {
  const fade = 1 - t;
  const core = fade * fade; // the tube itself cools faster than its halo
  const r = tube.radius;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(tube.x, tube.y);
  ctx.rotate(tube.tilt);
  ctx.scale(tube.foreshorten, 1); // the flash lies on the wall, so it tilts with it

  // bloom spilling out across the surrounding tubes
  const bloomR = r * (2.2 + 3.6 * t);
  const bloom = ctx.createRadialGradient(0, 0, 0, 0, 0, bloomR);
  bloom.addColorStop(0, rgba(STRIKE_GLOW, 0.5 * fade * opacity));
  bloom.addColorStop(0.45, rgba(STRIKE_GLOW, 0.16 * fade * opacity));
  bloom.addColorStop(1, rgba(STRIKE_GLOW, 0));
  ctx.fillStyle = bloom;
  ctx.beginPath();
  ctx.arc(0, 0, bloomR, 0, Math.PI * 2);
  ctx.fill();

  // the flooded tube
  const flood = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  flood.addColorStop(0, rgba(STRIKE_CORE, Math.min(1, 0.95 * core) * opacity));
  flood.addColorStop(0.6, rgba(mixRGB(STRIKE_CORE, STRIKE_GLOW, 0.7), 0.6 * core * opacity));
  flood.addColorStop(1, rgba(STRIKE_GLOW, 0.12 * core * opacity));
  ctx.fillStyle = flood;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // a single ring pushing outward from the point of impact
  ctx.strokeStyle = rgba(STRIKE_CORE, 0.5 * core * opacity);
  ctx.lineWidth = Math.max(0.4, r * 0.16 * fade);
  ctx.beginPath();
  ctx.arc(0, 0, r * (1 + 2.6 * t), 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// The wall's geometry only depends on the canvas size, so it renders once into
// an offscreen sprite that each frame blits at the current opacity. Strikes are
// drawn live on top of it.
function renderDetectorWall(geo: WallGeometry, dpr: number) {
  const scale = Math.max(dpr, WALL_SPRITE_SCALE);
  const sprite = document.createElement("canvas");
  sprite.width = Math.max(1, Math.round(geo.width * scale));
  sprite.height = Math.max(1, Math.round(geo.height * scale));
  const ctx = sprite.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  forEachTube(geo, (tube) => drawDetectorDome(ctx, tube));

  // warm pools of light washing across the wall
  for (const light of WALL_LIGHT_OFFSETS) {
    const lx = geo.vp.x + light.dx * geo.maxRadius;
    const ly = geo.vp.y + light.dy * geo.maxRadius;
    const gradient = ctx.createRadialGradient(lx, ly, 0, lx, ly, 44);
    gradient.addColorStop(0, rgba(GOLD_SPECULAR, 0.5));
    gradient.addColorStop(0.5, rgba(GOLD_NEAR, 0.18));
    gradient.addColorStop(1, rgba(GOLD_NEAR, 0));
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
    strikes: [],
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
    let wall: { sprite: HTMLCanvasElement; geo: WallGeometry } | null = null;

    // built on first use and kept until the canvas changes size
    function ensureWall() {
      if (!wall) {
        const geo = wallGeometry(width, height);
        const sprite = renderDetectorWall(geo, window.devicePixelRatio || 1);
        if (sprite) wall = { sprite, geo };
      }
      return wall;
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      wall = null; // the tube lattice depends on the canvas size
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
        const activeWall = wallActive ? ensureWall() : null;
        if (activeWall && wallOpacity > 0) {
          ctx!.save();
          ctx!.globalAlpha = wallOpacity;
          ctx!.imageSmoothingQuality = "high"; // the sprite is supersampled
          ctx!.drawImage(activeWall.sprite, 0, 0, width, height);
          ctx!.restore();
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
                // light up whichever tube caught it
                if (activeWall) {
                  phase.strikes.push({
                    tube: nearestTube(activeWall.geo, f.pos.x, f.pos.y),
                    age: 0,
                  });
                }
              }
            }
          }

          const lifeT = f.age / f.life;
          const opacity = 1 - lifeT;
          drawWireSphere(ctx!, f.pos.x, f.pos.y, f.size, opacity * 0.9, f.lines, f.angle);
        }

        // struck tubes glow on above the wall, and outlive the fragment that
        // lit them
        for (let i = phase.strikes.length - 1; i >= 0; i--) {
          const strike = phase.strikes[i];
          strike.age += dt;
          if (strike.age >= STRIKE_LIFE_MS) {
            phase.strikes.splice(i, 1);
            continue;
          }
          drawTubeStrike(ctx!, strike.tube, strike.age / STRIKE_LIFE_MS, wallOpacity);
        }

        const wallDone = phase.settledAt !== null && wallOpacity <= 0;
        if (!alive && wallDone && phase.strikes.length === 0) {
          phase = { kind: "waiting", until: now + CYCLE_PAUSE_MS };
        }
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
