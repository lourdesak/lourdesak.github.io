/**
 * A scallop shell: seven wedges fanning from a hinge at the base, under a
 * scalloped outer edge, in one uniform bold stroke.
 *
 * Drawn from geometry rather than traced, so the fan is exact — every rib
 * radiates from the same point and every lobe subtends the same angle, which
 * is the whole of what this shape depends on. Eyeballed ribs end up very
 * slightly off-radial, and at any size that reads as wonky.
 *
 * Strokes use currentColor, so it takes the colour of whatever it sits in.
 */

const HX = 32; // the hinge, where every rib converges
const HY = 48;
const RX = 29.5;
const RY = 34;

const SEGMENTS = 7;
const FROM = 194; // degrees; past horizontal, so the outer lobes curl under
const TO = -14;
const BULGE = 1.08; // how far each lobe swells past the base ellipse

const rad = (deg: number) => (deg * Math.PI) / 180;
const round = (n: number) => Math.round(n * 100) / 100;

/**
 * A point on the fan's outer edge, in the direction of a given angle.
 *
 * The radius is solved for that true direction rather than taken as an ellipse
 * parameter. Those are not the same thing away from the axes: parameter
 * spacing crowds the middle wedges and stretches the outer ones — measurably,
 * 20° against 30° across the same fan — and the shell comes out lopsided.
 */
function rim(deg: number, scale = 1) {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  const r = scale / Math.hypot(c / RX, s / RY);
  return { x: HX + r * c, y: HY - r * s };
}

/** The boundary angles between each pair of wedges. */
const bounds = Array.from(
  { length: SEGMENTS + 1 },
  (_, i) => FROM + ((TO - FROM) * i) / SEGMENTS,
);

/**
 * The outline: out from the hinge to the left edge, across the scalloped rim,
 * and back down to the hinge. Each lobe is a quadratic whose control point is
 * solved so the curve passes *through* the swollen midpoint — putting the
 * control point on that midpoint instead would only bulge half as far.
 */
function outline() {
  const start = rim(bounds[0]);
  // the base bows gently out to the first lobe instead of running dead straight
  const lead = { x: HX + (start.x - HX) * 0.55, y: HY + (start.y - HY) * 0.82 };
  let d =
    `M${round(HX)} ${round(HY)}` +
    `Q${round(lead.x)} ${round(lead.y)} ${round(start.x)} ${round(start.y)}`;

  for (let i = 0; i < SEGMENTS; i++) {
    const a = rim(bounds[i]);
    const b = rim(bounds[i + 1]);
    const mid = rim((bounds[i] + bounds[i + 1]) / 2, BULGE);
    const cx = (4 * mid.x - a.x - b.x) / 2;
    const cy = (4 * mid.y - a.y - b.y) / 2;
    d += `Q${round(cx)} ${round(cy)} ${round(b.x)} ${round(b.y)}`;
  }

  // and back the same way on the other side
  const end = rim(bounds[SEGMENTS]);
  const tail = { x: HX + (end.x - HX) * 0.55, y: HY + (end.y - HY) * 0.82 };
  return `${d}Q${round(tail.x)} ${round(tail.y)} ${round(HX)} ${round(HY)}Z`;
}

const OUTLINE = outline();

/** One rib per interior boundary, hinge out to the rim. */
const RIBS = bounds.slice(1, -1).map((deg) => {
  const p = rim(deg);
  return `M${round(HX)} ${round(HY)}L${round(p.x)} ${round(p.y)}`;
});

export default function OysterIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 56"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={OUTLINE} />
      {RIBS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
