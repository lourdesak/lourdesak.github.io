"use client";

import css from "./photographer.module.css";
import {
  ANKLE_Y,
  CAMERA_LIFT,
  CAMERA_X,
  CAMERA_Y,
  ELBOW_Y,
  FAR_ARM_X,
  FAR_LEG_X,
  HEAD_CX,
  HEAD_CY,
  HEAD_R,
  HIP_Y,
  KNEE_Y,
  NEAR_ARM_X,
  NEAR_LEG_X,
  NECK_Y,
  PACK_H,
  PACK_W,
  PACK_X,
  PACK_Y,
  SHOULDER_Y,
  TORSO_W,
  TORSO_X,
  VIEW_H,
  VIEW_W,
  WRIST_Y,
  palette as c,
} from "./design";
import type { Staging } from "./sequence";

const cx = (...names: (string | false | undefined)[]) =>
  names.filter(Boolean).join(" ");

const pivot = (x: number, y: number) => ({ transformOrigin: `${x}px ${y}px` });

/** near = the side of the body facing the viewer; far = the other one. */
type Side = "near" | "far";

function Leg({ side, moving }: { side: Side; moving: boolean }) {
  const near = side === "near";
  const x = near ? NEAR_LEG_X : FAR_LEG_X;
  const skin = near ? c.skin : c.skinFar;

  return (
    <g
      className={cx(css.pivot, moving && css.thigh, !near && css.offbeat)}
      style={pivot(x, HIP_Y)}
    >
      <line
        x1={x} y1={HIP_Y} x2={x} y2={KNEE_Y}
        stroke={skin} strokeWidth={near ? 6 : 5.4} strokeLinecap="round"
      />
      <g
        className={cx(css.pivot, moving && css.shin, !near && css.offbeat)}
        style={pivot(x, KNEE_Y)}
      >
        <line
          x1={x} y1={KNEE_Y} x2={x} y2={ANKLE_Y}
          stroke={skin} strokeWidth={near ? 5 : 4.6} strokeLinecap="round"
        />
        <path
          d={`M${x - 2.8} ${ANKLE_Y - 0.5} h5 a2.6 2.6 0 0 1 2.6 2.6 v1
              a1.2 1.2 0 0 1 -1.2 1.2 h-6.4 a1.4 1.4 0 0 1 -1.4 -1.4 z`}
          fill={near ? c.shoe : c.shoeFar}
        />
      </g>
    </g>
  );
}

function SwingingArm({ side, moving }: { side: Side; moving: boolean }) {
  const near = side === "near";
  const x = near ? NEAR_ARM_X : FAR_ARM_X;
  const sleeve = near ? c.shirt : c.shirtFar;
  const skin = near ? c.skin : c.skinFar;

  return (
    <g
      className={cx(css.pivot, moving && css.arm, near && css.offbeat)}
      style={pivot(x, SHOULDER_Y)}
    >
      <line
        x1={x} y1={SHOULDER_Y} x2={x} y2={ELBOW_Y}
        stroke={sleeve} strokeWidth={near ? 4.6 : 4.4} strokeLinecap="round"
      />
      {near && (
        <line
          x1={x} y1={SHOULDER_Y} x2={x} y2={ELBOW_Y}
          stroke={c.shirtEdge} strokeWidth={4.6} strokeLinecap="round" opacity={0.3}
        />
      )}
      <g
        className={cx(css.pivot, moving && css.forearm, near && css.offbeat)}
        style={pivot(x, ELBOW_Y)}
      >
        <line
          x1={x} y1={ELBOW_Y} x2={x} y2={WRIST_Y}
          stroke={skin} strokeWidth={near ? 3.8 : 3.6} strokeLinecap="round"
        />
        <circle cx={x} cy={WRIST_Y + 1} r={near ? 2.1 : 2} fill={skin} />
      </g>
    </g>
  );
}

/** Elbow tucked in, forearm angled up to hold the camera at her eye. */
function AimingArm() {
  return (
    <g className={css.settle}>
      <line
        x1={NEAR_ARM_X} y1={SHOULDER_Y} x2={NEAR_ARM_X - 1} y2={ELBOW_Y - 1}
        stroke={c.shirt} strokeWidth={4.6} strokeLinecap="round"
      />
      <line
        x1={NEAR_ARM_X - 1} y1={ELBOW_Y - 1} x2={34.4} y2={33}
        stroke={c.skin} strokeWidth={3.8} strokeLinecap="round"
      />
      <circle cx={34.8} cy={32} r={2.2} fill={c.skin} />
    </g>
  );
}

function Sway({
  moving,
  children,
}: {
  moving: boolean;
  children: React.ReactNode;
}) {
  return (
    <g
      className={cx(css.pivot, moving && css.sway)}
      style={pivot(HEAD_CX, HEAD_CY - 8)}
    >
      {children}
    </g>
  );
}

/**
 * Hair seen from the side: a cap over the skull and a wavy fall down the back
 * only, leaving the whole leading edge of the face bare. Wrapping the hair
 * around both sides is what made the head read as front-on before.
 */
function ProfileHair({ moving }: { moving: boolean }) {
  return (
    <Sway moving={moving}>
      <path
        d="M30 4 C39.5 4 43.4 10.4 43.2 18.6
           C40.8 17 38 12.6 34.4 12.8
           C30.6 13.8 27.6 12.8 25.4 14.8
           C23.4 16.6 22.6 19.8 22.8 23.8
           C23 27.2 23.6 30.2 23 33.6
           C22.4 37 23.2 39.8 22 42.6
           C20.8 45.6 16.4 44.8 15.6 41.6
           C14.8 38.2 16.4 35.6 15.6 32.2
           C14.8 28.6 14.2 25.2 14.6 20.2
           C15 11.8 20.6 4 30 4 Z"
        fill="url(#pw-hair)"
      />
      <path
        d="M18.6 20 C20.3 25 18.3 29 19.7 33 C20.6 36.4 18.4 38 19 40.6"
        stroke={c.hairLit} strokeWidth={1.1} fill="none"
        strokeLinecap="round" opacity={0.7}
      />
    </Sway>
  );
}

/**
 * Hair seen head-on, for the moment she turns to the viewer: one solid mass
 * with the face over it, bulging in and out down the sides and scalloped along
 * the bottom. Leaving the middle hollow instead would read as two pigtails.
 */
function FrontHair({ moving }: { moving: boolean }) {
  return (
    <Sway moving={moving}>
      <path
        d="M30 3 C43 3 48 12 48 25
           C48 29.5 46.6 32.6 47.1 36.4
           C47.5 40.2 44.3 45.4 42.4 41.6
           C40.5 38.6 38.6 44 36 41.6
           C33.5 39.2 31.6 44.4 29 42
           C26.4 39.6 24.6 44.4 22 41.6
           C19.9 39.3 19.2 38.8 17.6 41.6
           C15.7 45.4 12.5 40.2 12.9 36.4
           C13.4 32.6 12 29.5 12 25
           C12 12 17 3 30 3 Z"
        fill="url(#pw-hair)"
      />
      {[16.6, 43.4].map((x, i) => {
        const d = i ? -1 : 1;
        return (
          <path
            key={x}
            d={`M${x} 20 C${x + 1.7 * d} 25 ${x - 0.3 * d} 29 ${x + 1.1 * d} 33
                C${x + 2 * d} 36.4 ${x - 0.2 * d} 38 ${x + 0.4 * d} 40`}
            stroke={c.hairLit}
            strokeWidth={1.1}
            fill="none"
            strokeLinecap="round"
            opacity={0.7}
          />
        );
      })}
    </Sway>
  );
}

/** Front-facing and cheerful while she is working. */
function FaceToViewer({ aiming }: { aiming: boolean }) {
  return (
    <>
      <ellipse cx={22.8} cy={24.4} rx={2.2} ry={1.3} fill={c.blush} opacity={0.4} />
      <ellipse cx={37.2} cy={24.4} rx={2.2} ry={1.3} fill={c.blush} opacity={0.4} />

      {aiming ? (
        // squeezed shut behind the viewfinder
        [25.4, 34.6].map((x) => (
          <path
            key={x}
            d={`M${x - 2.1} 21.4 q2.1 1.9 4.2 0`}
            fill="none" stroke={c.hair} strokeWidth={1.3} strokeLinecap="round"
          />
        ))
      ) : (
        [25.6, 34.4].map((x, i) => (
          <g key={x}>
            <ellipse cx={x} cy={21.4} rx={1.9} ry={2.4} fill={c.hair} />
            <circle cx={x + 0.7} cy={20.5} r={0.75} fill="#FFFFFF" opacity={0.9} />
            <path
              d={`M${x - 2} 17.3 q2 -1.1 3.9 ${i ? 0.2 : -0.2}`}
              fill="none" stroke={c.hair} strokeWidth={1} strokeLinecap="round"
            />
          </g>
        ))
      )}

      <path
        d="M27.8 26.6 q2.2 2.1 4.4 0"
        fill="none" stroke={c.skinShade} strokeWidth={1.2} strokeLinecap="round"
      />
    </>
  );
}

/**
 * The head turned fully side-on, looking the way she is travelling. The skull
 * is a circle but the leading edge is its own path, so the profile carries a
 * brow, a nose, a lip and a chin rather than ending on a plain arc.
 */
function ProfileHead({ moving }: { moving: boolean }) {
  return (
    <>
      <circle cx={HEAD_CX} cy={HEAD_CY} r={HEAD_R} fill={c.skin} />
      <path
        d={`M${HEAD_CX + 9.6} 14.6
            C${HEAD_CX + 11.4} 16.4 ${HEAD_CX + 11.6} 18.4 ${HEAD_CX + 11.4} 19.8
            C${HEAD_CX + 12.8} 21 ${HEAD_CX + 13.6} 22.6 ${HEAD_CX + 13.1} 23.5
            C${HEAD_CX + 12.6} 24.3 ${HEAD_CX + 11.4} 24.2 ${HEAD_CX + 10.6} 24.2
            C${HEAD_CX + 10.8} 25.4 ${HEAD_CX + 10.2} 26 ${HEAD_CX + 9.4} 26.4
            C${HEAD_CX + 10.1} 27 ${HEAD_CX + 9.9} 28 ${HEAD_CX + 9} 28.8
            C${HEAD_CX + 7.4} 30.4 ${HEAD_CX + 4} 31.4 ${HEAD_CX + 1} 31.4
            L${HEAD_CX + 1} 14.6 Z`}
        fill={c.skin}
      />
      <ProfileHair moving={moving} />
      {/* ear sits just in front of the hairline, not out on the cheek */}
      <ellipse cx={HEAD_CX - 4.6} cy={21.6} rx={1.7} ry={2.2} fill={c.skinShade} />
      <ellipse cx={HEAD_CX + 4.2} cy={24.6} rx={2.1} ry={1.3} fill={c.blush} opacity={0.4} />
      <ellipse cx={HEAD_CX + 6.4} cy={20.8} rx={1.6} ry={2.2} fill={c.hair} />
      <circle cx={HEAD_CX + 6.9} cy={20} r={0.65} fill="#FFFFFF" opacity={0.9} />
      <path
        d={`M${HEAD_CX + 4.6} 16.9 q1.9 -1.1 3.6 -0.1`}
        fill="none" stroke={c.hair} strokeWidth={1} strokeLinecap="round"
      />
    </>
  );
}

/** Turned to the viewer for the shot itself. */
function FrontHead({ moving, aiming }: { moving: boolean; aiming: boolean }) {
  return (
    <>
      <FrontHair moving={moving} />
      <circle cx={HEAD_CX} cy={HEAD_CY} r={HEAD_R} fill={c.skin} />
      {/* fringe sweeping back from the forehead */}
      <path
        d="M19.4 18.4 C19.8 9.4 24.4 4.4 30 4.4 C35.8 4.4 40.2 8.4 40.6 16.4
           C39.2 12.4 36 11 32.6 12.4 C29 13.8 24.8 12.2 22.4 13.8
           C20.8 15 19.9 16.2 19.4 18.4 Z"
        fill="url(#pw-hair)"
      />
      <FaceToViewer aiming={aiming} />
    </>
  );
}

function Camera({ aiming }: { aiming: boolean }) {
  const w = 10.5;
  const h = 8.6;

  return (
    <g
      className={css.settle}
      style={{ transform: aiming ? `translateY(${CAMERA_LIFT}px)` : undefined }}
    >
      <rect x={CAMERA_X} y={CAMERA_Y} width={w} height={h} rx={1.8} fill={c.camera} />
      <rect x={CAMERA_X} y={CAMERA_Y} width={w} height={2.1} rx={1} fill={c.cameraPlate} />
      {/* viewfinder hump and shutter release */}
      <rect
        x={CAMERA_X + 2.6} y={CAMERA_Y - 2.1} width={4} height={2.2} rx={0.7}
        fill={c.cameraPlate}
      />
      <circle cx={CAMERA_X + 8.4} cy={CAMERA_Y - 1} r={0.9} fill={c.shoe} />
      {/* the barrel points the way she is looking */}
      <rect
        x={CAMERA_X + w - 0.2} y={CAMERA_Y + 1.8} width={4.6} height={5} rx={1.3}
        fill={c.cameraDark}
      />
      <rect
        x={CAMERA_X + w + 3.8} y={CAMERA_Y + 1.8} width={1.4} height={5} rx={0.6}
        fill={c.lens}
      />
    </g>
  );
}

/** Rides on her back, so in profile it sits on the trailing side. */
function Backpack() {
  return (
    <>
      <rect
        x={PACK_X} y={PACK_Y} width={PACK_W} height={PACK_H} rx={3.4}
        fill={c.pack}
      />
      <rect
        x={PACK_X + 1.8} y={PACK_Y + 4} width={PACK_W - 3.6} height={5} rx={1.4}
        fill={c.packLit}
      />
      {/* strap over the shoulder */}
      <path
        d={`M${PACK_X + PACK_W - 0.6} ${PACK_Y + 1.5}
            Q${TORSO_X + 4} ${PACK_Y - 1.5} ${TORSO_X + 4.4} ${PACK_Y + 7}`}
        stroke={c.pack} strokeWidth={1.8} fill="none" strokeLinecap="round"
      />
    </>
  );
}

function Torso() {
  return (
    <>
      {/* far leg of the shorts, then the shirt, then the near leg */}
      <path
        d={`M${TORSO_X + 1} 54 h${TORSO_W - 2} v9 a2 2 0 0 1 -2 2 h-2.4
            l-1 -4.6 -1.2 4.6 h-1.4 a2 2 0 0 1 -2 -2 z`}
        fill={c.shortsFar}
      />
      {/* shoulders slope out of the neck rather than starting as a flat box */}
      <path
        d={`M${TORSO_X + 3.5} 36.6 h5 a4.5 4.5 0 0 1 4.5 4.5 v12
            a2 2 0 0 1 -2 2 h-10 a2 2 0 0 1 -2 -2 v-12
            a4.5 4.5 0 0 1 4.5 -4.5 z`}
        fill={c.shirt}
        stroke={c.shirtEdge}
        strokeWidth={0.9}
      />
      <path
        d={`M${TORSO_X + 1.4} 53 h${TORSO_W - 2.4} v10 a2 2 0 0 1 -2 2 h-5.6
            a2 2 0 0 1 -2 -2 z`}
        fill={c.shorts}
      />
    </>
  );
}

/**
 * The figure, drawn in profile so she travels across the page sideways. She
 * looks the way she is going while moving, and turns her head to the viewer
 * only once she has stopped to take the picture.
 */
export default function Figure({ staging }: { staging: Staging }) {
  const { moving, aiming, stopped } = staging;

  return (
    <>
      <defs>
        <linearGradient id="pw-hair" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor={c.hairLit} />
          <stop offset="45%" stopColor={c.hair} />
          <stop offset="100%" stopColor={c.hair} />
        </linearGradient>
      </defs>

      <Leg side="far" moving={moving} />
      <SwingingArm side="far" moving={moving} />

      <g className={cx(moving && css.bob)}>
        <rect x={27.2} y={NECK_Y} width={6} height={11} rx={2.8} fill={c.skinShade} />

        {stopped ? (
          <FrontHead moving={moving} aiming={aiming} />
        ) : (
          <ProfileHead moving={moving} />
        )}

        <Backpack />
        <Torso />

        {!aiming && (
          <path
            d={`M${TORSO_X + 10} 39 L${CAMERA_X + 1.6} ${CAMERA_Y}`}
            stroke={c.camera} strokeWidth={1.4} fill="none"
          />
        )}
        <Camera aiming={aiming} />

        {aiming ? <AimingArm /> : <SwingingArm side="near" moving={moving} />}
      </g>

      <Leg side="near" moving={moving} />
    </>
  );
}

export { VIEW_W, VIEW_H };
