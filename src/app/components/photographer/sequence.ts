"use client";

import { useEffect, useState } from "react";
import { SCROLL_SETTLED_EVENT } from "../ScrollPastTitle";

export type Phase = "waiting" | "walk" | "aim" | "flash" | "lower" | "run" | "done";

export const FLASH_MS = 450;
const BEAT_MS = 500; // pause after the page settles, before she sets off
const WALK_MS = 3000;
const RUN_MS = 1600;

/** Each phase names the one that follows it and how long it lasts. */
const NEXT: Partial<Record<Phase, { after: number; then: Phase }>> = {
  walk: { after: WALK_MS, then: "aim" },
  aim: { after: 650, then: "flash" },
  flash: { after: FLASH_MS, then: "lower" },
  lower: { after: 400, then: "run" },
  run: { after: RUN_MS, then: "done" },
};

/** How the figure should be posed and moved in a given phase. */
export type Staging = {
  /** legs and arms are cycling */
  moving: boolean;
  /** camera is up at her eye */
  aiming: boolean;
  /**
   * Standing at the mark. She travels looking the way she is going, and only
   * turns her head to the viewer once she has stopped to take the picture.
   */
  stopped: boolean;
  /** turned around, so both body and face point the way she is going */
  running: boolean;
  /** stride length, as a CSS duration */
  cadence: string;
  transform: string;
  transition: string | undefined;
};

const OFFSCREEN = "translateX(-80px)";
const SHOT_MARK = "translateX(55vw)"; // where she stops to take the picture

export function stage(phase: Phase): Staging {
  const waiting = phase === "waiting";
  const running = phase === "run";

  return {
    moving: phase === "walk" || running,
    aiming: phase === "aim" || phase === "flash",
    stopped: phase === "aim" || phase === "flash" || phase === "lower",
    running,
    cadence: running ? "0.5s" : "0.9s",
    // She sits at the offscreen mark while waiting so that when she sets off
    // there is a previous position for the transition to run from.
    transform: waiting || running ? OFFSCREEN : SHOT_MARK,
    transition: waiting
      ? undefined
      : running
        ? `transform ${RUN_MS}ms cubic-bezier(0.35, 0, 0.7, 1)`
        : `transform ${WALK_MS}ms linear`,
  };
}

/**
 * Runs the walk-shoot-run sequence once, starting only after the page has
 * finished gliding down. Stays in "waiting" forever if the visitor asked for
 * reduced motion.
 */
export function useSequence(): Phase {
  const [phase, setPhase] = useState<Phase>("waiting");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let beat: ReturnType<typeof setTimeout>;
    const begin = () => {
      beat = setTimeout(() => setPhase("walk"), BEAT_MS);
    };

    window.addEventListener(SCROLL_SETTLED_EVENT, begin, { once: true });
    return () => {
      window.removeEventListener(SCROLL_SETTLED_EVENT, begin);
      clearTimeout(beat);
    };
  }, []);

  useEffect(() => {
    const step = NEXT[phase];
    if (!step) return;
    const timer = setTimeout(() => setPhase(step.then), step.after);
    return () => clearTimeout(timer);
  }, [phase]);

  return phase;
}
