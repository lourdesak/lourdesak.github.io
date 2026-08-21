import css from "./sidePanes.module.css";

/**
 * How much shorter the inner edge is than the outer one, as a share of the
 * pane's height — half taken off the top, half off the bottom, so the pane
 * converges about its own centre line.
 *
 * This is what makes a pane read as a wall angled away from the viewer rather
 * than a flat strip: the edge nearest you stands full height, the edge toward
 * the photographs falls short, and the top and bottom run straight between.
 */
const TAPER = 0.26;

type Side = "left" | "right";

type Pane = {
  side: Side;
  /** how far outside the wall this pane stands */
  inset: number;
  width: number;
  /** share of the wall's height, centred — a shorter pane reads as further off */
  rise: number;
  /** 1 = nearest the viewer; lower sits further away and reads dimmer */
  depth: number;
  /** ms before it flies in, and how long it takes */
  delay: number;
  travel: number;
  sheen: string;
  glint: string;
  tint: string;
  breathe: string;
};

/**
 * Two panes on each side, arranged so the eye reads them as receding into the
 * picture rather than as four bars of differing size.
 *
 * The outer pair is nearest the viewer, so it is the widest, the tallest and
 * the brightest; the inner pair sits further off toward the photographs, so it
 * is narrower, shorter and dimmer. Getting this the wrong way round — with the
 * larger panes innermost — makes the set read as coming toward you out of the
 * wall, which is the opposite of standing inside the space looking in.
 *
 * Depth is carried by width, height and brightness alone. The lean angle stays
 * identical across all four (see LEAN): varying that too would buy a little
 * more perspective at the cost of the set looking out of square with itself.
 *
 * No two share a timing. Matched periods read as one mechanism moving, which
 * looks like an applied effect; deliberately mismatched ones read as four
 * separate surfaces each catching the light in their own time. The same goes
 * for the entrance — they arrive on staggered delays rather than in formation.
 */
const PANES: Pane[] = [
  {
    side: "left", inset: 158, width: 58, rise: 1, depth: 1,
    delay: 0, travel: 2700,
    sheen: "15s", glint: "10.5s", tint: "12s", breathe: "9s",
  },
  {
    side: "left", inset: 88, width: 40, rise: 0.84, depth: 0.62,
    delay: 260, travel: 2300,
    sheen: "13s", glint: "9s", tint: "11s", breathe: "8s",
  },
  {
    side: "right", inset: 158, width: 58, rise: 1, depth: 1,
    delay: 140, travel: 2850,
    sheen: "14s", glint: "12s", tint: "10s", breathe: "10.5s",
  },
  {
    side: "right", inset: 88, width: 40, rise: 0.84, depth: 0.62,
    delay: 400, travel: 2450,
    sheen: "16s", glint: "11.5s", tint: "13s", breathe: "9.5s",
  },
];

export default function SidePanes({
  height,
  className,
}: {
  /** matches the wall it flanks */
  height: number;
  className?: string;
}) {
  return (
    <div className={className} aria-hidden="true">
      {PANES.map((pane, i) => (
        <div
          key={i}
          className={css.slot}
          style={
            {
              [pane.side]: -pane.inset,
              width: pane.width,
              // shorter panes are centred on the wall, so the set converges on
              // a horizon line rather than all hanging from the top edge
              height: height * pane.rise,
              top: (height * (1 - pane.rise)) / 2,
              "--depth": pane.depth,
              "--taper": `${(height * pane.rise * TAPER) / 2}px`,
              "--travel": `${pane.travel}ms`,
              "--delay": `${pane.delay}ms`,
              "--sheen": pane.sheen,
              "--glint": pane.glint,
              "--tint": pane.tint,
              "--breathe": pane.breathe,
            } as React.CSSProperties
          }
        >
          <div
            className={`${css.slide} ${
              pane.side === "left" ? css.enterLeft : css.enterRight
            }`}
          >
            <div
              className={`${css.pane} ${pane.side === "left" ? css.left : css.right}`}
            >
              <div className={css.face} />
              <div className={css.tint} />
              <div className={css.glint} />
              <div
                className={`${css.edge} ${
                  pane.side === "left" ? css.edgeLeft : css.edgeRight
                }`}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
