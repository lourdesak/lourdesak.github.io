export type Photo = {
  /** file under /public/photography */
  src: string;
  place: string;
  /** intrinsic pixel size, which fixes the frame's shape */
  w: number;
  h: number;
};

export type Frame = { x: number; y: number; w: number; h: number };

/**
 * Fits each photo's shape to its slot on a hand-placed gallery wall.
 *
 * The scattered arrangement is authored by hand and stays that way — the
 * irregular sizes and staggered placement are the whole point, and a tidy
 * justified grid loses it. What this does is reshape each frame: it takes the
 * largest rectangle of the photo's own aspect ratio that fits inside the
 * authored slot, and centres it there.
 *
 * So the frame hugs its photo exactly — nothing is cropped and no black bars
 * appear — while never growing outside its slot, which is what guarantees the
 * wall keeps its spacing and no two frames collide.
 */
export function hugPhotos(slots: Frame[], photos: Photo[]): Frame[] {
  return slots.map((slot, i) => {
    const photo = photos[i];
    const aspect = photo.w / photo.h;
    // Wider than its slot, so width is the limit; otherwise height is.
    const widthLed = aspect >= slot.w / slot.h;
    const w = widthLed ? slot.w : slot.h * aspect;
    const h = widthLed ? slot.w / aspect : slot.h;

    return {
      x: slot.x + (slot.w - w) / 2,
      y: slot.y + (slot.h - h) / 2,
      w,
      h,
    };
  });
}
