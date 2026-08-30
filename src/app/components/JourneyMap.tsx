"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import NamePin from "./NamePin";

/**
 * The map pin beside the name is a button now. Pressing it unrolls a
 * hand-plotted migration route: the line leaves the pin, sweeps out to the
 * right, then coils back around the paragraph below. Every stop is somewhere
 * Lourdes has lived, walked newest-first back to her birthplace. The run of
 * line *leaving* a stop is scaled to how long she stayed there — one month in
 * Honolulu barely registers, eleven years in Tirunelveli draws the long tail.
 *
 *   22 years old.  Philadelphia 4 + Sivakasi 1 + Bangalore 5 + Sivakasi 1 = 11.
 *   Honolulu is ~1 month so far. Tuticorin is the point she was born at.
 *   22 - 11 - ~0 (Honolulu) => ~11 years in Tirunelveli before that.
 */

type Stop = {
  name: string;
  note: string;
  // years lived here; drives the length of the leg leaving this stop
  years: number;
};

// newest first — the route is walked backwards in time from where she is now
const STOPS: Stop[] = [
  { name: "Honolulu", note: "now · ~1 mo", years: 1 / 12 },
  { name: "Philadelphia", note: "4 years", years: 4 },
  { name: "Sivakasi", note: "1 year", years: 1 },
  { name: "Bangalore", note: "5 years", years: 5 },
  { name: "Sivakasi", note: "1 year", years: 1 },
  { name: "Tirunelveli", note: "11 years", years: 11 },
  { name: "Tuticorin", note: "born here", years: 0 },
];

const DRAW_MS = 1800;
const MIN_LEG = 0.14; // smallest share of the route any one leg may take
const PAD_R = 120; // room the coil is allowed past the text column, right…
const PAD_B = 60; // …and below it, so the line wraps around the writing

// a smooth open spline through the guide points (Catmull-Rom -> cubic Béziers)
function catmullRom(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d +=
      ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)},` +
      ` ${c2x.toFixed(1)} ${c2y.toFixed(1)},` +
      ` ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

// cumulative 0..1 position of each stop along the route. Legs are floored so
// the first two stops don't land on top of each other, then renormalised to 1.
function stopFractions() {
  const legs = STOPS.slice(0, -1).map((s) => s.years);
  const total = legs.reduce((a, b) => a + b, 0);
  const floored = legs.map((y) => Math.max(y / total, MIN_LEG));
  const sum = floored.reduce((a, b) => a + b, 0);
  const out = [0];
  let acc = 0;
  for (const f of floored) {
    acc += f / sum;
    out.push(acc);
  }
  out[out.length - 1] = 1;
  return out;
}

type Mark = { x: number; y: number; f: number; lx: number; ly: number; anchor: "start" | "middle" | "end" };

export default function JourneyMap() {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [len, setLen] = useState(0);
  const [marks, setMarks] = useState<Mark[]>([]);

  const anchorRef = useRef<HTMLSpanElement>(null); // spans the intro block
  const pinRef = useRef<HTMLButtonElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const measure = useCallback(() => {
    const a = anchorRef.current;
    const p = pinRef.current;
    if (!a || !p) return;
    const ar = a.getBoundingClientRect();
    const pr = p.getBoundingClientRect();
    setBox({ w: ar.width, h: ar.height });
    setStart({
      x: pr.left + pr.width / 2 - ar.left,
      y: pr.top + pr.height / 2 - ar.top,
    });
  }, []);

  // measure on open + keep in step with layout changes
  useLayoutEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open, measure]);

  // close on Escape / outside press
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!anchorRef.current?.contains(t) && !pinRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const w = box?.w ?? 0;
  const h = box?.h ?? 0;
  const W = w + PAD_R; // full drawing width, text column + right margin
  const H = h + PAD_B; // full drawing height, block + margin below

  // guide points: dip off the pin into the gap under the name, sweep right
  // clear of the text, bulge down the right margin, run along below the
  // paragraph and climb the left edge — a loose coil *around* the writing
  const guides: [number, number][] = box
    ? [
        [start.x, start.y],
        [start.x + 34, start.y + 4],
        [w * 0.54, h * 0.03],
        [w * 0.9, h * 0.02],
        [W - 8, h * 0.4],
        [W - 26, h * 0.72],
        [w * 0.8, H - 10],
        [w * 0.36, H - 2],
        [-10, h * 0.9],
        [4, h * 0.52],
      ]
    : [];
  const d = catmullRom(guides);

  // once the path is in the DOM, walk it to place every stop + its label
  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path || !d || !box) return;
    const total = path.getTotalLength();
    setLen(Math.round(total));

    // labels are pushed away from the centre of the *text* column so they land
    // in the margin the coil is bowing through
    const cx = w / 2;
    const cy = h / 2;
    const clamp = (v: number, lo: number, hi: number) =>
      Math.min(Math.max(v, lo), hi);
    const fr = stopFractions();
    const next: Mark[] = fr.map((f, i) => {
      const pt = path.getPointAtLength(f * total);
      let lx: number;
      let ly: number;
      let anchor: Mark["anchor"];
      if (i === 0) {
        // Honolulu sits on the pin — label to its right, at name height
        lx = pt.x + 14;
        ly = pt.y - 3;
        anchor = "start";
      } else if (pt.y < h * 0.18) {
        // along the top arc — labels sit just above the line, right of the name
        lx = pt.x;
        ly = pt.y - 8;
        anchor = "middle";
      } else {
        let dx = pt.x - cx;
        let dy = pt.y - cy;
        const m = Math.hypot(dx, dy) || 1;
        dx /= m;
        dy /= m;
        lx = pt.x + dx * 18;
        ly = pt.y + dy * 18;
        anchor = dx > 0.25 ? "start" : dx < -0.25 ? "end" : "middle";
      }
      return {
        x: pt.x,
        y: pt.y,
        f,
        lx: clamp(lx, -46, W - 4),
        ly: clamp(ly, -6, H - 6),
        anchor,
      };
    });
    setMarks(next);
  }, [d, w, h, W, H, box]);

  // the route draws + the stops appear as soon as the path's length is known
  // (a render or two after opening, once the block has been measured)
  const playing = open && len > 0;

  return (
    <span className="contents">
      <button
        ref={pinRef}
        type="button"
        aria-expanded={open}
        aria-label={
          open ? "Hide the places I've lived" : "Show the places I've lived"
        }
        onClick={() => setOpen((v) => !v)}
        className="group mt-[2px] block shrink-0 cursor-pointer rounded-sm p-0.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a227]"
      >
        <NamePin active={open} />
      </button>

      <span
        ref={anchorRef}
        aria-hidden={!open}
        className="pointer-events-none absolute inset-0 z-20 overflow-visible"
      >
        {box && (
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
            className={`text-[#8a7a00] transition-opacity duration-500 dark:text-[#c9a227] ${
              open ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* faint graticule over the text column, so the panel reads as a map */}
            <g
              stroke="currentColor"
              strokeWidth={0.75}
              style={{
                opacity: open ? 0.08 : 0,
                transition: "opacity 500ms ease-out",
              }}
            >
              {Array.from({ length: 7 }, (_, i) => (
                <line
                  key={`v${i}`}
                  x1={(w * (i + 1)) / 8}
                  y1={0}
                  x2={(w * (i + 1)) / 8}
                  y2={h}
                />
              ))}
              {Array.from({ length: 5 }, (_, i) => (
                <line
                  key={`h${i}`}
                  x1={0}
                  y1={(h * (i + 1)) / 6}
                  x2={w}
                  y2={(h * (i + 1)) / 6}
                />
              ))}
            </g>

            {/* the route */}
            <path
              ref={pathRef}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeOpacity={0.9}
              style={
                {
                  visibility: len > 0 ? "visible" : "hidden",
                  strokeDasharray: len || 1,
                  strokeDashoffset: playing ? 0 : len || 1,
                  "--journey-len": `${len || 1}`,
                  animation: playing
                    ? `journey-draw ${DRAW_MS}ms ease-out both`
                    : "none",
                } as CSSProperties
              }
            />

            {/* stops */}
            {marks.map((mk, i) => {
              const s = STOPS[i];
              const delay = playing ? Math.round(mk.f * DRAW_MS * 0.85) : 0;
              const first = i === 0;
              return (
                <g
                  key={i}
                  style={{
                    opacity: playing ? 1 : 0,
                    transformBox: "fill-box",
                    transformOrigin: "center",
                    transform: playing ? "scale(1)" : "scale(0.6)",
                    transition: `opacity 320ms ease-out ${delay}ms, transform 340ms cubic-bezier(.2,.7,.3,1.35) ${delay}ms`,
                  }}
                >
                  {first && (
                    <circle
                      cx={mk.x}
                      cy={mk.y}
                      r={8}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1}
                      strokeOpacity={0.4}
                    >
                      <animate
                        attributeName="r"
                        values="4;10;4"
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="stroke-opacity"
                        values="0.5;0;0.5"
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  <circle
                    cx={mk.x}
                    cy={mk.y}
                    r={first ? 4 : 3}
                    fill="currentColor"
                  />
                  <circle
                    cx={mk.x}
                    cy={mk.y}
                    r={first ? 4 : 3}
                    fill="none"
                    stroke="var(--background, #fff)"
                    strokeWidth={1.3}
                  />
                  <text
                    x={mk.lx}
                    y={mk.ly}
                    textAnchor={mk.anchor}
                    dominantBaseline="middle"
                    className="fill-zinc-700 dark:fill-zinc-200"
                    style={{ fontSize: 11, fontWeight: 600 }}
                  >
                    {s.name}
                  </text>
                  <text
                    x={mk.lx}
                    y={mk.ly + 11}
                    textAnchor={mk.anchor}
                    dominantBaseline="middle"
                    className="fill-zinc-400 dark:fill-zinc-500"
                    style={{ fontSize: 9, letterSpacing: 0.3 }}
                  >
                    {s.note}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* the same route, read out for assistive tech */}
        <ul className="sr-only">
          {STOPS.map((s, i) => (
            <li key={i}>
              {s.name} — {s.note}
            </li>
          ))}
        </ul>
      </span>
    </span>
  );
}
