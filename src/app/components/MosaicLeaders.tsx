"use client";

import { useMemo, useSyncExternalStore } from "react";

export type MosaicTile = { x: number; y: number; w: number; h: number };

// 45° is the default look; the rest are fallback escape angles for a frame
// boxed in tightly enough that no length along 45° clears its neighbours —
// tried in order, so the line only strays from the clean default when it
// truly has to.
const ANGLES_DEG = [45, 30, 60, 20, 70, 15, 75];
const DIAG_LENGTHS = [22, 35, 50, 70, 95, 125, 160, 200]; // px reach tried at each angle
const HORIZONTAL = 44; // shortest the flat segment is allowed to be
const GAP = 8; // clearance kept past a frame the line has to route around
const TEXT_HALF = 9; // half-height of the label/line's collision band
const LABEL_GAP = 5; // breathing room between the line's end and the text
const FONT_SIZE = 12;
const LETTER_SPACING = 0.4;
const OFF_ANGLE_PENALTY = 20; // tie-breaker bias back toward the default 45°
const PAD = 180; // room around the mosaic for the lines and their labels
const FADE_MS = 200;

// Offscreen canvas reused for measuring label width — real glyph widths,
// not a guess, so a long "City, State" label reserves exactly the room it
// needs when routing around neighbouring frames. Canvas only exists in the
// browser, so the very first render (server, and the client's matching
// hydration pass) falls back to a character-count estimate; `precise`
// switches on only once mounted, when a mismatched estimate can no longer
// trip a hydration warning — see the `mounted` flag below.
let measureCtx: CanvasRenderingContext2D | null | undefined;
function textWidth(text: string, precise: boolean) {
  if (precise && measureCtx === undefined) {
    measureCtx = document.createElement("canvas").getContext("2d");
    if (measureCtx) measureCtx.font = `${FONT_SIZE}px sans-serif`;
  }
  const base = precise && measureCtx ? measureCtx.measureText(text).width : text.length * FONT_SIZE * 0.55;
  return base + LETTER_SPACING * text.length;
}

type Leader = {
  cornerX: number;
  cornerY: number;
  kneeX: number;
  kneeY: number;
  endX: number;
  towardLeft: boolean;
};

function rectsOverlap(
  ax0: number,
  ay0: number,
  ax1: number,
  ay1: number,
  bx0: number,
  by0: number,
  bx1: number,
  by1: number
) {
  return ax0 < bx1 && ax1 > bx0 && ay0 < by1 && ay1 > by0;
}

// Does a horizontal run at y=segY, from x0 to x1, cross this frame? Padded
// vertically so the label's own text height counts, not just the 1px line.
function runCrossesTile(x0: number, x1: number, segY: number, tile: MosaicTile) {
  return rectsOverlap(
    x0,
    segY - TEXT_HALF,
    x1,
    segY + TEXT_HALF,
    tile.x,
    tile.y,
    tile.x + tile.w,
    tile.y + tile.h
  );
}

// Exact line-segment-vs-rectangle intersection (parametric clip), not a
// bounding-box approximation. A bounding box only ever grows as a segment
// lengthens, so once it snags a frame it can never "extend past" it —
// exactly wrong for finding how far a diagonal has to reach to clear one.
function segCrossesTile(x0: number, y0: number, x1: number, y1: number, tile: MosaicTile, pad = 1) {
  const tx0 = tile.x - pad;
  const ty0 = tile.y - pad;
  const tx1 = tile.x + tile.w + pad;
  const ty1 = tile.y + tile.h + pad;
  const dx = x1 - x0;
  const dy = y1 - y0;

  let tMinX = 0;
  let tMaxX = 1;
  if (dx === 0) {
    if (x0 < tx0 || x0 > tx1) return false;
  } else {
    const a = (tx0 - x0) / dx;
    const b = (tx1 - x0) / dx;
    tMinX = Math.min(a, b);
    tMaxX = Math.max(a, b);
  }

  let tMinY = 0;
  let tMaxY = 1;
  if (dy === 0) {
    if (y0 < ty0 || y0 > ty1) return false;
  } else {
    const a = (ty0 - y0) / dy;
    const b = (ty1 - y0) / dy;
    tMinY = Math.min(a, b);
    tMaxY = Math.max(a, b);
  }

  const lo = Math.max(0, tMinX, tMinY);
  const hi = Math.min(1, tMaxX, tMaxY);
  return lo <= hi;
}

// Extends the flat run outward, corner by corner, until both it and the
// label sitting past its end clear every frame they'd otherwise cross —
// routing past whichever frame is furthest out, then rechecking, so a chain
// of neighbours (line or label alike) is cleared in one pass.
//
// Returns null when a frame can't be cleared this way at all — which happens
// when the corner itself sits inside another frame's span at this height, so
// the run is embedded in it from the very first pixel. No amount of
// extending helps then (the candidate stop point ends up back past the
// corner, the wrong side of where it started): that corner has to be
// rejected outright, not accepted with a short but still-overlapping run.
function computeEndX(
  kneeX: number,
  kneeY: number,
  sx: number,
  others: MosaicTile[],
  labelReach: number
) {
  let endX = kneeX + sx * HORIZONTAL;
  for (let iter = 0; iter < 20; iter++) {
    let extended = false;
    // the label sits past endX, so the occupied span for collision purposes
    // runs all the way out to the far edge of the label text
    const labelEdge = endX + sx * labelReach;
    const segX0 = sx > 0 ? kneeX : labelEdge;
    const segX1 = sx > 0 ? labelEdge : kneeX;
    for (const tile of others) {
      if (!runCrossesTile(segX0, segX1, kneeY, tile)) continue;
      const candidate =
        sx > 0 ? tile.x + tile.w + GAP - labelReach : tile.x - GAP + labelReach;
      const clearsIt = sx > 0 ? candidate > endX : candidate < endX;
      if (!clearsIt) return null;
      endX = candidate;
      extended = true;
    }
    if (!extended) break;
  }
  return endX;
}

// From one corner, tries the default 45° slant at increasing lengths, then —
// only if nothing along 45° ever clears — the fallback angles, each at
// increasing lengths too. First (angle, length) whose slanted segment misses
// every frame, and whose subsequent flat run also clears, wins.
function computeRoute(
  cornerX: number,
  cornerY: number,
  sx: number,
  sy: number,
  others: MosaicTile[],
  labelReach: number
) {
  for (const angleDeg of ANGLES_DEG) {
    const rad = (angleDeg * Math.PI) / 180;
    const dirX = sx * Math.cos(rad);
    const dirY = sy * Math.sin(rad);
    for (const d of DIAG_LENGTHS) {
      const kneeX = cornerX + dirX * d;
      const kneeY = cornerY + dirY * d;
      if (others.some((t) => segCrossesTile(cornerX, cornerY, kneeX, kneeY, t))) continue;
      const endX = computeEndX(kneeX, kneeY, sx, others, labelReach);
      if (endX === null) continue;
      return { kneeX, kneeY, endX, angleDeg, d };
    }
  }
  return null;
}

// A frame can send its leader out through any of its 4 corners. Try all of
// them and keep whichever needs the shortest, closest-to-45° route to clear
// its neighbours — so a frame boxed in on one side routes around the other
// way instead of drawing straight across a photo next to it. The label's own
// width counts too, so a long "City, State" name doesn't land on a frame the
// bare line would have cleared.
function computeLeader(
  tile: MosaicTile,
  others: MosaicTile[],
  place: string,
  precise: boolean
): Leader | null {
  const labelReach = LABEL_GAP + textWidth(place, precise);
  let best: Leader | null = null;
  let bestCost = Infinity;

  for (const towardLeft of [true, false]) {
    for (const towardTop of [true, false]) {
      const sx = towardLeft ? -1 : 1;
      const sy = towardTop ? -1 : 1;
      const cornerX = towardLeft ? tile.x : tile.x + tile.w;
      const cornerY = towardTop ? tile.y : tile.y + tile.h;
      const route = computeRoute(cornerX, cornerY, sx, sy, others, labelReach);
      if (!route) continue;
      const { kneeX, kneeY, endX, angleDeg, d } = route;
      const cost = d + Math.abs(endX - kneeX) + (angleDeg === 45 ? 0 : OFF_ANGLE_PENALTY);
      if (cost < bestCost) {
        bestCost = cost;
        best = { cornerX, cornerY, kneeX, kneeY, endX, towardLeft };
      }
    }
  }

  // With 7 angles and 8 lengths tried per corner — including some that reach
  // well past any frame's own footprint — a frame with no clear route at all
  // would have to be boxed in on all 4 corners simultaneously, which the
  // hand-placed wall's spacing doesn't do. If it ever happens (null here),
  // the label simply doesn't render (see the `!leader` guard below) rather
  // than showing something that overlaps.
  return best;
}

// Leader line for a place name: from a frame's least-obstructed corner, a
// slant out — 45° by default, another angle only if that's the sole way to
// clear tightly-packed neighbours — then a flat run that routes around any
// frame it would otherwise cross. Only the hovered frame's line is shown.
export default function MosaicLeaders({
  tiles,
  places,
  width,
  height,
  hoveredIndex,
}: {
  tiles: MosaicTile[];
  places: string[];
  width: number;
  height: number;
  hoveredIndex: number | null;
}) {
  // False on the server and on the client's matching hydration pass, then
  // true from then on — see the note on `textWidth` above.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const leaders = useMemo(
    () =>
      tiles.map((tile, i) => {
        if (!places[i]) return null;
        const others = tiles.filter((_, j) => j !== i);
        return computeLeader(tile, others, places[i], mounted);
      }),
    [tiles, places, mounted]
  );

  return (
    <svg
      className="pointer-events-none absolute text-zinc-500 dark:text-zinc-400"
      style={{
        left: -PAD,
        top: -PAD,
        width: width + PAD * 2,
        height: height + PAD * 2,
      }}
      viewBox={`${-PAD} ${-PAD} ${width + PAD * 2} ${height + PAD * 2}`}
      aria-hidden="true"
    >
      {leaders.map((leader, i) => {
        const place = places[i];
        if (!place || !leader) return null;
        const { cornerX, cornerY, kneeX, kneeY, endX, towardLeft } = leader;
        const sx = towardLeft ? -1 : 1;

        return (
          <g
            key={i}
            style={{
              opacity: hoveredIndex === i ? 1 : 0,
              transition: `opacity ${FADE_MS}ms ease-out`,
            }}
          >
            <circle cx={cornerX} cy={cornerY} r={2.5} fill="currentColor" />
            <polyline
              points={`${cornerX},${cornerY} ${kneeX},${kneeY} ${endX},${kneeY}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x={endX + sx * LABEL_GAP}
              y={kneeY}
              fill="currentColor"
              fontSize={FONT_SIZE}
              letterSpacing={LETTER_SPACING}
              textAnchor={towardLeft ? "end" : "start"}
              dominantBaseline="middle"
            >
              {place}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
