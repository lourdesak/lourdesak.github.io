import { Josefin_Sans } from "next/font/google";
import PageShell from "../components/PageShell";
import SquareGrid from "../components/SquareGrid";
import ImageCarousel from "../components/ImageCarousel";

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["italic"],
});

const MOSAIC_WIDTH = 840;
const MOSAIC_HEIGHT = 567;

// Gallery-wall arrangement of varied-size frames, modeled on a scattered
// picture-frame layout: a mix of small, medium, and large tiles staggered
// across the canvas rather than aligned to a strict grid.
const MOSAIC_TILES = [
  { x: 418, y: 12, w: 113, h: 109 },
  { x: 546, y: 40, w: 91, h: 78 },
  { x: 292, y: 96, w: 113, h: 124 },
  { x: 103, y: 164, w: 174, h: 164 },
  { x: 17, y: 246, w: 71, h: 82 },
  { x: 290, y: 231, w: 183, h: 170 },
  { x: 481, y: 126, w: 256, h: 233 },
  { x: 754, y: 273, w: 73, h: 82 },
  { x: 63, y: 344, w: 76, h: 82 },
  { x: 155, y: 344, w: 122, h: 105 },
  { x: 355, y: 409, w: 111, h: 122 },
  { x: 479, y: 374, w: 118, h: 107 },
  { x: 613, y: 380, w: 164, h: 162 },
];

const MOSAIC_IMAGES: { src: string; alt: string }[][] = MOSAIC_TILES.map(() => []);

const HOBBIES = [
  { label: "Hobby 1" },
  { label: "Hobby 2" },
  { label: "Hobby 3" },
  { label: "Hobby 4" },
];

export default function HobbiesPage() {
  return (
    <PageShell
      title="Hobbies"
      header={
        <div className="flex flex-col items-center gap-8">
          <h2
            className={`${josefinSans.className} animate-[fade-in_2s_ease-out] text-center text-2xl italic text-zinc-800 dark:text-zinc-100`}
          >
            Crossroads of Travelling & Photography
          </h2>
          <div
            className="relative"
            style={{ width: MOSAIC_WIDTH, height: MOSAIC_HEIGHT }}
          >
            {MOSAIC_TILES.map((tile, i) => (
              <div
                key={i}
                className="absolute overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                style={{ left: tile.x, top: tile.y, width: tile.w, height: tile.h }}
              >
                <ImageCarousel images={MOSAIC_IMAGES[i]} />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <SquareGrid items={HOBBIES} />
    </PageShell>
  );
}
