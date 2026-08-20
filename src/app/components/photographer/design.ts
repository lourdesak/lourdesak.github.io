// Shared vocabulary for the figure: every coordinate the parts use is named
// here, so the drawing code carries no loose numbers and the pieces stay
// joined when a proportion is retuned.

export const VIEW_W = 60;
export const VIEW_H = 96;

/** Rendered size on the page. */
export const FIGURE_W = 31;
export const FIGURE_H = 50;

// vertical landmarks, head down to floor
export const HEAD_CX = 30;
export const HEAD_CY = 20;
export const HEAD_R = 11.5;
export const NECK_Y = 29;
export const SHOULDER_Y = 42;
export const ELBOW_Y = 50;
export const WRIST_Y = 57;
export const HIP_Y = 62;
export const KNEE_Y = 75;
export const ANKLE_Y = 86;

// She is drawn in profile, so each limb pair sits on a near and a far track
// rather than left and right.
export const NEAR_LEG_X = 31.5;
export const FAR_LEG_X = 28.5;
export const NEAR_ARM_X = 32;
export const FAR_ARM_X = 28;

export const TORSO_X = 24;
export const TORSO_W = 12;

/** Backpack, riding on her back — the trailing side in profile. */
export const PACK_X = 17.6;
export const PACK_Y = 39.5;
export const PACK_W = 8.6;
export const PACK_H = 16;

/** Camera at rest on its strap, and how far it lifts to her eye. */
export const CAMERA_X = 33.5;
export const CAMERA_Y = 44;
export const CAMERA_LIFT = -20;

export const palette = {
  skin: "#B0784E",
  skinFar: "#8C5F39", // limbs on the far side of the body
  skinShade: "#946139",
  hair: "#2B1B14",
  hairLit: "#553425", // sheen along the waves
  shirt: "#FFFFFF",
  shirtFar: "#DCE0E5",
  shirtEdge: "#CBD1D8", // keeps the white shirt readable on a light page
  pack: "#15171A", // black backpack
  packLit: "#2C3037",
  shorts: "#16181C",
  shortsFar: "#0D0F12",
  shoe: "#E0653F",
  shoeFar: "#B84E2E",
  camera: "#23262B",
  cameraPlate: "#3A4048",
  cameraDark: "#15181C",
  lens: "#E8B84B", // gold, echoing the detector wall on the home page
  blush: "#D9705C",
  flash: "#FFF8E4",
} as const;
