"use client";

import { useEffect, useRef } from "react";
import { onThemeChange, resolvedTheme } from "../lib/theme";

/**
 * One wire-sphere particle — the same tumbling wireframe the collision field on
 * this page is built from — that slides in from the left, hops, and lands as a
 * map pin struck in the site's gold. It runs on a slow, unhurried loop beside
 * the name, going dark for a beat between cycles so it never nags.
 *
 * While the journey panel is open (`active`) it holds on the struck-pin beat
 * instead of looping, so the mark and its panel read as one thing.
 */

const CSS_W = 34;
const CSS_H = 37;

// where the pin sits inside the box
const PIN_CX = CSS_W / 2;
const PIN_TIP_Y = CSS_H - 2.5;
const HEAD_CY = 15;
const HEAD_R = 8.5;
const HOLE_R = 3.4; // the punched-out centre the orb settles into
const GROUND_RX = 10;
const GROUND_RY = 3;

// the wire sphere doing the hopping
const ORB_R = 6.5;
const STAGE_X = PIN_CX - 14; // where the hop launches from
const HOP_H = 7; // small on purpose — the box is only so tall

// the gold, light theme then dark; matches the name's underline and the ovals
const GOLD_LIGHT = [138, 122, 0] as const;
const GOLD_DARK = [201, 162, 39] as const;

type Beat = "enter" | "hop" | "settle" | "form" | "hold" | "leave";
const ORDER: Beat[] = ["enter", "hop", "settle", "form", "hold", "leave"];
const MS: Record<Beat, number> = {
  enter: 640,
  hop: 540,
  settle: 320,
  form: 440,
  hold: 2600,
  leave: 560,
};
const GAP_MS = 1500; // blank beat before the cycle comes round again

// start of the "hold" beat within a cycle, and a point to park on while open
const HOLD_START = ORDER.slice(0, ORDER.indexOf("hold")).reduce(
  (s, b) => s + MS[b],
  0,
);
const HOLD_PARK = HOLD_START + MS.hold / 2;

type Line =
  | { kind: "chord"; a1: number; a2: number; w: number; alpha: number }
  | { kind: "arc"; rot: number; ry: number; w: number; alpha: number; phase: number };

// a fresh scribble of chords and latitude rings each cycle, so no two hops
// wear quite the same wireframe
function wireLines(): Line[] {
  const lines: Line[] = [];
  for (let i = 0; i < 9; i++) {
    lines.push({
      kind: "chord",
      a1: Math.random() * Math.PI * 2,
      a2: Math.random() * Math.PI * 2,
      w: 0.4 + Math.random() * 0.7,
      alpha: 0.3 + Math.random() * 0.4,
    });
  }
  for (let i = 0; i < 3; i++) {
    lines.push({
      kind: "arc",
      rot: Math.random() * Math.PI,
      ry: 0.2 + Math.random() * 0.7,
      w: 0.5 + Math.random() * 0.6,
      alpha: 0.25 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return lines;
}

const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

type Gold = readonly [number, number, number];

// lifted near-verbatim from ParticleCollision's drawWireSphere, only stroked in
// gold rather than white, so the texture reads as the same object
function drawWireSphere(
  ctx: CanvasRenderingContext2D,
  gold: Gold,
  x: number,
  y: number,
  r: number,
  opacity: number,
  lines: Line[],
  angle: number,
) {
  const [gr, gg, gb] = gold;
  const stroke = (a: number) => `rgba(${gr},${gg},${gb},${a})`;

  ctx.strokeStyle = stroke(opacity);
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  for (const line of lines) {
    ctx.strokeStyle = stroke(opacity * line.alpha);
    ctx.lineWidth = line.w;
    if (line.kind === "chord") {
      const a1 = line.a1 + angle;
      const a2 = line.a2 + angle;
      ctx.beginPath();
      ctx.moveTo(x + r * Math.cos(a1), y + r * Math.sin(a1));
      ctx.lineTo(x + r * Math.cos(a2), y + r * Math.sin(a2));
      ctx.stroke();
    } else {
      const openness = 0.18 + 0.82 * Math.abs(Math.cos(angle + line.phase));
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(line.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * line.ry * openness, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

// the map-pin outline: a ground ring, then a teardrop drawn as two tangents
// running from the tip up to the head and closed over the top
function drawPin(ctx: CanvasRenderingContext2D, gold: Gold, opacity: number, scale: number) {
  const [gr, gg, gb] = gold;
  ctx.save();
  ctx.translate(PIN_CX, HEAD_CY);
  ctx.scale(scale, scale);
  ctx.translate(-PIN_CX, -HEAD_CY);

  ctx.strokeStyle = `rgba(${gr},${gg},${gb},${opacity})`;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(PIN_CX, PIN_TIP_Y - 0.5, GROUND_RX, GROUND_RY, 0, 0, Math.PI * 2);
  ctx.stroke();

  const d = PIN_TIP_Y - HEAD_CY;
  const theta = Math.acos(Math.min(1, HEAD_R / d));
  const aR = Math.PI / 2 - theta;
  const aL = Math.PI / 2 + theta;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(PIN_CX, PIN_TIP_Y);
  ctx.lineTo(PIN_CX + HEAD_R * Math.cos(aR), HEAD_CY + HEAD_R * Math.sin(aR));
  ctx.arc(PIN_CX, HEAD_CY, HEAD_R, aR, aL, true);
  ctx.lineTo(PIN_CX, PIN_TIP_Y);
  ctx.stroke();

  ctx.restore();
}

export default function NamePin({ active = false }: { active?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = CSS_W * dpr;
    canvas.height = CSS_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Track the resolved theme (OS setting *and* the manual toggle), not just
    // prefers-color-scheme — otherwise the pin keeps its dark-mode gold after a
    // manual switch to light and sits too pale on the page.
    let gold: Gold = resolvedTheme() === "dark" ? GOLD_DARK : GOLD_LIGHT;
    const stopThemeWatch = onThemeChange(() => {
      gold = resolvedTheme() === "dark" ? GOLD_DARK : GOLD_LIGHT;
    });

    const total = ORDER.reduce((s, b) => s + MS[b], 0);
    let lines = wireLines();
    let cycleStart = performance.now();
    let angle = Math.random() * Math.PI * 2;
    let last = cycleStart;
    let raf = 0;

    const frame = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      ctx.clearRect(0, 0, CSS_W, CSS_H);

      let t = now - cycleStart;
      if (t >= total + GAP_MS) {
        cycleStart = now;
        lines = wireLines();
        angle = Math.random() * Math.PI * 2;
        t = 0;
      }

      // hold on the struck-pin beat for as long as the panel is open
      if (activeRef.current) t = HOLD_PARK;

      // which beat, and how far through it
      let acc = 0;
      let beat: Beat = "leave";
      let local = 0;
      for (const b of ORDER) {
        if (t < acc + MS[b]) {
          beat = b;
          local = clamp01((t - acc) / MS[b]);
          break;
        }
        acc += MS[b];
      }
      const inGap = t >= total;

      // spins fast while it travels, idles once it is the pin's centre
      const spin =
        inGap || beat === "hold" ? 0.0009 : beat === "form" ? 0.0022 : 0.006;
      angle += spin * dt;

      if (inGap) {
        raf = requestAnimationFrame(frame);
        return;
      }

      // the pin outline
      let pinOpacity = 0;
      let pinScale = 1;
      if (beat === "form") {
        pinOpacity = ease(local);
        pinScale = 1 + 0.08 * Math.sin(local * Math.PI);
      } else if (beat === "hold") {
        pinOpacity = 1;
      } else if (beat === "leave") {
        pinOpacity = 1 - ease(local);
      }
      if (pinOpacity > 0) drawPin(ctx, gold, pinOpacity, pinScale);

      // the orb
      let ox = PIN_CX;
      let oy = HEAD_CY;
      let orbR = ORB_R;
      let orbOpacity = 0.95;

      if (beat === "enter") {
        const e = ease(local);
        ox = -ORB_R + (STAGE_X + ORB_R) * e;
        orbOpacity = 0.35 + 0.6 * e;
      } else if (beat === "hop") {
        ox = STAGE_X + (PIN_CX - STAGE_X) * ease(local);
        oy = HEAD_CY - HOP_H * Math.sin(Math.PI * local);
      } else if (beat === "settle") {
        orbR = ORB_R + (HOLE_R - ORB_R) * ease(local);
        // a ring pulse kicking out from the landing
        const [gr, gg, gb] = gold;
        ctx.strokeStyle = `rgba(${gr},${gg},${gb},${0.55 * (1 - local)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(PIN_CX, HEAD_CY, 3 + local * 13, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // form / hold / leave — the orb has become the pin's centre
        orbR = HOLE_R;
        orbOpacity = beat === "leave" ? 1 - ease(local) : 0.95;
      }

      drawWireSphere(ctx, gold, ox, oy, orbR, orbOpacity, lines, angle);

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      stopThemeWatch();
    };
  }, []);

  return (
    <span aria-hidden="true" className="mt-[2px] block shrink-0">
      <canvas
        ref={canvasRef}
        width={CSS_W}
        height={CSS_H}
        style={{ width: CSS_W, height: CSS_H }}
        className="block"
      />
    </span>
  );
}
