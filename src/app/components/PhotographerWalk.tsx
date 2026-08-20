"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Figure from "./photographer/Figure";
import css from "./photographer/photographer.module.css";
import { FIGURE_H, FIGURE_W, VIEW_H, VIEW_W, palette } from "./photographer/design";
import { FLASH_MS, stage, useSequence } from "./photographer/sequence";

/**
 * A photographer walks in from the left along the bottom of the page, stops,
 * takes a picture, and runs back off. Plays once, after the page has settled.
 *
 * Portaled straight to `document.body` so `position: fixed` is always
 * relative to the viewport, not whichever ancestor it happens to render
 * under — a transformed ancestor (a full-bleed panel, say) would otherwise
 * turn "fixed" into "scrolls with that ancestor," letting her scroll out of
 * view instead of staying put.
 */
// Nothing to subscribe to — mount status only ever flips once — this just
// borrows useSyncExternalStore for its server/client snapshot split.
function subscribeNoop() {
  return () => {};
}

export default function PhotographerWalk() {
  const phase = useSequence();
  // True once hydrated on the client — false on the server, where
  // document.body isn't there yet to portal into.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

  if (phase === "done" || !mounted) return null;

  const staging = stage(phase);

  return createPortal(
    <div className="pointer-events-none fixed bottom-10 left-0 z-30" aria-hidden="true">
      <div
        style={{
          transform: staging.transform,
          transition: staging.transition,
          willChange: "transform",
        }}
      >
        <svg
          width={FIGURE_W}
          height={FIGURE_H}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          style={
            {
              // turning around to run flips body and face together
              transform: staging.running ? "scaleX(-1)" : undefined,
              "--cadence": staging.cadence,
              "--flash-ms": `${FLASH_MS}ms`,
            } as React.CSSProperties
          }
        >
          <Figure staging={staging} />

          {phase === "flash" && (
            <g className={css.flash} style={{ transformOrigin: "44px 30px" }}>
              <circle cx={44} cy={30} r={8} fill={palette.flash} opacity={0.9} />
              <circle
                cx={44} cy={30} r={12}
                fill="none" stroke={palette.lens} strokeWidth={1.5}
              />
            </g>
          )}
        </svg>
      </div>
    </div>,
    document.body
  );
}
