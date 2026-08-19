import { Josefin_Sans } from "next/font/google";
import PageShell from "../components/PageShell";
import SquareGrid from "../components/SquareGrid";
import ImageCarousel from "../components/ImageCarousel";

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["italic"],
});

const MOSAIC_SIZE = 720;

const MOSAIC_TILES = [
  { x: 0, y: 0, w: 460, h: 220 },
  { x: 472, y: 0, w: 248, h: 220 },
  { x: 0, y: 232, w: 248, h: 220 },
  { x: 260, y: 232, w: 460, h: 220 },
  { x: 0, y: 464, w: 340, h: 256 },
  { x: 352, y: 464, w: 368, h: 256 },
];

const MOSAIC_IMAGES: { src: string; alt: string }[][] = [[], [], [], [], [], []];

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
            style={{ width: MOSAIC_SIZE, height: MOSAIC_SIZE }}
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
