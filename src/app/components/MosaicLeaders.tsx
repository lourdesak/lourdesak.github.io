"use client";

import { useMemo, useSyncExternalStore } from "react";

export type MosaicTile = { x: number; y: number; w: number; h: number };

// 45° is the default look; the rest are fallback escape angles for a frame
// boxed in tightly enough that no length along 45° clears its neighbours —
// tried in order, so the line only strays from the clean default when it
// truly has to.
// Steep angles matter more than they look: a frame ringed on all four sides by
// ~16px gaps can only get out through the narrow corridor between two
// neighbours, which needs a near-vertical climb before the flat run has
// anywhere clear to go.
const ANGLES_DEG = [45, 30, 60, 20, 70, 15, 75, 80, 85];
const DIAG_LENGTHS = [22, 35, 50, 70, 95, 125, 160, 200, 240, 280]; // px reach tried at each angle
const HORIZONTAL = 64; // shortest the flat segment is allowed to be — long
// enough that the wording stands clear of the frame rather than crowding it
const GAP = 18; // clearance kept past a frame the line or label routes around,
// so wording that has to squeeze by a neighbour still stands clear of it
const TEXT_HALF = 9; // half-height of the label/line's collision band
const LABEL_CLEAR = 12; // air kept between the wording and any photo
const LABEL_GAP = 8; // breathing room between the line's end and the text
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

// Where the flat run can stop, given it must reach the outside world without
// touching anything.
//
// A horizontal line cannot step over a frame: if one sits between the knee and
// the label, the run crosses it however long it is made. So rather than
// extending outward to "get past" an obstruction, this looks outward from the
// knee for the nearest thing in the way — a frame whose body straddles this
// height, or the edge of the drawable area — and asks whether the run plus the
// label fit in the clear space before it. If they don't, this knee is unusable
// and the caller tries another angle, length or corner, which is what makes the
// line route around a photo instead of over it.
function computeEndX(
  kneeX: number,
  kneeY: number,
  sx: number,
  others: MosaicTile[],
  labelReach: number,
  boundX: number
) {
  let limit = boundX;

  for (const tile of others) {
    // only frames tall enough to foul the run at this height matter
    if (kneeY + TEXT_HALF <= tile.y || kneeY - TEXT_HALF >= tile.y + tile.h) continue;

    const near = sx > 0 ? tile.x : tile.x + tile.w;
    const far = sx > 0 ? tile.x + tile.w : tile.x;
    // already behind the knee, so the outward run never reaches it
    if (sx > 0 ? far <= kneeX : far >= kneeX) continue;

    const stop = near - sx * GAP;
    if (sx > 0 ? stop < limit : stop > limit) limit = stop;
  }

  const room = sx > 0 ? limit - kneeX : kneeX - limit;
  if (room < HORIZONTAL + labelReach) return null;

  // there is space, so keep the run at its shortest — the label sits close to
  // the frame it belongs to rather than trailing off across the page
  const endX = kneeX + sx * HORIZONTAL;

  // Finally, check where the wording actually lands. The scan above only
  // considers frames the run travels through, so one sitting just above, below
  // or behind the label is never looked at — and that is exactly how a label
  // ends up a hair away from a photo it never crossed. Reject the candidate and
  // let the caller try another angle, length or corner.
  const labelX0 = sx > 0 ? endX + LABEL_GAP : endX - labelReach;
  const labelX1 = sx > 0 ? endX + labelReach : endX - LABEL_GAP;
  const crowded = others.some(
    (t) =>
      labelX0 - LABEL_CLEAR < t.x + t.w &&
      t.x < labelX1 + LABEL_CLEAR &&
      kneeY - TEXT_HALF - LABEL_CLEAR < t.y + t.h &&
      t.y < kneeY + TEXT_HALF + LABEL_CLEAR
  );
  if (crowded) return null;

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
  labelReach: number,
  bounds: { width: number; height: number }
) {
  // how far out the label may go before it leaves the drawable area
  const boundX = sx > 0 ? bounds.width + PAD - 4 : -PAD + 4;

  for (const angleDeg of ANGLES_DEG) {
    const rad = (angleDeg * Math.PI) / 180;
    const dirX = sx * Math.cos(rad);
    const dirY = sy * Math.sin(rad);
    for (const d of DIAG_LENGTHS) {
      const kneeX = cornerX + dirX * d;
      const kneeY = cornerY + dirY * d;
      // the label has height, so keep the knee off the top and bottom edges too
      if (kneeY < -PAD + TEXT_HALF || kneeY > bounds.height + PAD - TEXT_HALF) continue;
      if (others.some((t) => segCrossesTile(cornerX, cornerY, kneeX, kneeY, t))) continue;
      const endX = computeEndX(kneeX, kneeY, sx, others, labelReach, boundX);
      if (endX === null) continue;
      return { kneeX, kneeY, endX, angleDeg, d };
    }
  }
  return null;
}

/**
 * A dead-straight leader out of the right-hand edge: no slant, just a flat run
 * to the label. Tried at a few heights down the edge, nearest the middle first,
 * so it comes out of the side of the frame rather than clipping a corner.
 * Returns null when nothing to the right is clear, in which case the caller
 * keeps the routed line it already had.
 */
function horizontalRoute(
  tile: MosaicTile,
  others: MosaicTile[],
  place: string,
  precise: boolean,
  bounds: { width: number; height: number }
): Leader | null {
  const labelReach = LABEL_GAP + textWidth(place, precise);
  const boundX = bounds.width + PAD - 4;
  const edgeX = tile.x + tile.w;

  // Every pixel down the edge is worth trying, closest to the middle first. The
  // way out can be a corridor barely wider than the label itself — a couple of
  // sampled heights step straight over a gap like that and wrongly conclude the
  // right-hand side is blocked.
  const middle = tile.y + tile.h / 2;
  const candidates: number[] = [];
  for (let y = Math.round(tile.y + 6); y <= tile.y + tile.h - 6; y++) candidates.push(y);
  candidates.sort((a, b) => Math.abs(a - middle) - Math.abs(b - middle));

  for (const y of candidates) {
    const endX = computeEndX(edgeX, y, 1, others, labelReach, boundX);
    if (endX === null) continue;
    // corner and knee coincide, so the whole leader draws as one flat line
    return { cornerX: edgeX, cornerY: y, kneeX: edgeX, kneeY: y, endX, towardLeft: false };
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
  precise: boolean,
  bounds: { width: number; height: number }
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
      const route = computeRoute(cornerX, cornerY, sx, sy, others, labelReach, bounds);
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

  const leaders = useMemo(() => {
    const built = tiles.map((tile, i) => {
      if (!places[i]) return null;
      const others = tiles.filter((_, j) => j !== i);
      return computeLeader(tile, others, places[i], mounted, { width, height });
    });

    // One frame usually ends up with a noticeably longer, more wandering line
    // than the rest, which is the one that draws the eye. Straighten just that
    // one: a flat run out of the right-hand edge, no slant at all, if the room
    // is there. The others are already short and are left alone.
    let longest = -1;
    let longestLen = -Infinity;
    built.forEach((leader, i) => {
      if (!leader) return;
      const len =
        Math.hypot(leader.kneeX - leader.cornerX, leader.kneeY - leader.cornerY) +
        Math.abs(leader.endX - leader.kneeX);
      if (len > longestLen) {
        longestLen = len;
        longest = i;
      }
    });

    if (longest >= 0) {
      const others = tiles.filter((_, j) => j !== longest);
      const straight = horizontalRoute(
        tiles[longest],
        others,
        places[longest],
        mounted,
        { width, height }
      );
      if (straight) built[longest] = straight;
    }

    return built;
  }, [tiles, places, mounted, width, height]);

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
