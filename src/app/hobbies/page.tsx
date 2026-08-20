import { Playfair_Display } from "next/font/google";
import PageShell from "../components/PageShell";
import SquareGrid from "../components/SquareGrid";
import ScrollPastTitle from "../components/ScrollPastTitle";
import MosaicGallery from "../components/MosaicGallery";
import PhotographerWalk from "../components/PhotographerWalk";
import BooksPanel from "../components/BooksPanel";
import { hugPhotos } from "../components/mosaicLayout";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["italic"],
});

const MOSAIC_WIDTH = 1050;
const MOSAIC_HEIGHT = 709;

// Gallery-wall arrangement of varied-size frames, modeled on a scattered
// picture-frame layout: a mix of small, medium, and large tiles staggered
// across the canvas rather than aligned to a strict grid. These are the slots;
// each frame is then reshaped to its photo inside its slot.
//
// Arranged by hand. A slot may sit slightly above the canvas because the frame
// is centred inside it and is shorter than the slot — what matters is where the
// frame lands, and every one of these sits fully on the wall.
const MOSAIC_SLOTS = [
  { x: 424, y: 456, w: 141, h: 136 },
  { x: 574, y: 463, w: 114, h: 98 },
  { x: 850, y: 485, w: 141, h: 155 },
  { x: 698, y: 413, w: 160, h: 150 },
  { x: 327, y: 465, w: 89, h: 102 },
  { x: 91, y: 192, w: 229, h: 212 },
  { x: 334, y: 2, w: 320, h: 291 },
  { x: 873, y: 329, w: 91, h: 102 },
  { x: 673, y: -23, w: 145, h: 155 },
  { x: 671, y: 200, w: 152, h: 131 },
  { x: 45, y: 48, w: 139, h: 152 },
  { x: 173, y: -11, w: 148, h: 134 },
  { x: 840, y: 30, w: 205, h: 202 },
];

// One photo per frame, in slot order, with its intrinsic pixel size — that size
// is what reshapes the frame to hug the photo. The three portrait shots are
// placed in the slots that are already taller than they are wide, so no frame
// has to shrink much to take its photo.
const PHOTOS = [
  { src: "philadelphia.jpg", place: "Philadelphia, Pennsylvania", w: 1000, h: 750 },
  { src: "san-francisco.jpg", place: "San Francisco, California", w: 1000, h: 750 },
  { src: "lake-tahoe.jpg", place: "Lake Tahoe, California", w: 562, h: 1000 },
  { src: "philadelphia-2.jpg", place: "Philadelphia, Pennsylvania", w: 1000, h: 750 },
  { src: "catalina-island.jpg", place: "Catalina Island, California", w: 814, h: 1000 },
  { src: "san-juan.jpg", place: "San Juan, Puerto Rico", w: 1000, h: 750 },
  { src: "philadelphia-3.jpg", place: "Philadelphia, Pennsylvania", w: 1000, h: 750 },
  { src: "amathur.jpg", place: "Amathur, Tamilnadu", w: 1000, h: 750 },
  { src: "catalina-island-2.jpg", place: "Catalina Island, California", w: 1000, h: 750 },
  { src: "philadelphia-4.jpg", place: "Philadelphia, Pennsylvania", w: 1000, h: 750 },
  { src: "san-francisco-2.jpg", place: "San Francisco, California", w: 562, h: 1000 },
  { src: "san-francisco-3.jpg", place: "San Francisco, California", w: 1000, h: 750 },
  { src: "philadelphia-5.jpg", place: "Philadelphia, Pennsylvania", w: 1000, h: 750 },
];

const MOSAIC_TILES = hugPhotos(MOSAIC_SLOTS, PHOTOS);

// One photo per frame, so each frame can match that photo's shape exactly.
const MOSAIC_IMAGES = PHOTOS.map((photo) => [
  { src: `/photography/${photo.src}`, alt: photo.place, w: photo.w, h: photo.h },
]);

const MOSAIC_PLACES = PHOTOS.map((photo) => photo.place);

// Placeholders — swap in real titles, authors, and blurbs as books go in.
const BOOKS = [
  {
    title: "Book Title One",
    author: "Author Name",
    description:
      "A short description of this book goes here — what it's about, and why it's worth a mention.",
  },
  {
    title: "Book Title Two",
    author: "Author Name",
    description:
      "A short description of this book goes here — what it's about, and why it's worth a mention.",
  },
  {
    title: "Book Title Three",
    author: "Author Name",
    description:
      "A short description of this book goes here — what it's about, and why it's worth a mention.",
  },
];

const HOBBIES = [
  { label: "Hobby 2", offsetTop: 84 },
  { label: "Hobby 3", offsetTop: 84 },
  { label: "Hobby 4", offsetTop: 84 },
];

export default function HobbiesPage() {
  return (
    <PageShell
      title="Hobbies"
      header={
        <div className="flex flex-col items-center gap-8">
          <ScrollPastTitle targetId="crossroads" />
          <PhotographerWalk />
          <h2
            id="crossroads"
            className={`${playfairDisplay.className} animate-[fade-in_2s_ease-out] text-center text-3xl italic tracking-wide text-zinc-800 dark:text-zinc-100`}
          >
            Crossroads of Travelling & Photography
          </h2>
          <div className="mt-12">
            <MosaicGallery
              tiles={MOSAIC_TILES}
              images={MOSAIC_IMAGES}
              places={MOSAIC_PLACES}
              width={MOSAIC_WIDTH}
              height={MOSAIC_HEIGHT}
            />
          </div>
          <BooksPanel books={BOOKS} />
        </div>
      }
    >
      <SquareGrid items={HOBBIES} />
    </PageShell>
  );
}
