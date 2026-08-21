import { Playfair_Display } from "next/font/google";
import PageShell from "../components/PageShell";
import ScrollPastTitle from "../components/ScrollPastTitle";
import MosaicGallery from "../components/MosaicGallery";
import PhotographerWalk from "../components/PhotographerWalk";
import BooksPanel from "../components/BooksPanel";
import BookRecommendationsLabel from "../components/BookRecommendationsLabel";
import ScrollHandoff from "../components/ScrollHandoff";
import GappedRule from "../components/GappedRule";
import OysterIcon from "../components/OysterIcon";
import SidePanes from "../components/SidePanes";
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
// Arranged by hand. Each slot is exactly the frame it holds, so nothing has to
// be centred inside it and these numbers are the positions you see.
const MOSAIC_SLOTS = [
  { x: 424, y: 471, w: 141, h: 188 },
  { x: 574, y: 469, w: 114, h: 152 },
  { x: 877, y: 485, w: 87, h: 155 },
  { x: 698, y: 428, w: 160, h: 213 },
  { x: 330, y: 465, w: 83, h: 102 },
  { x: 91, y: 212, w: 229, h: 305 },
  { x: 334, y: 28, w: 320, h: 427 },
  { x: 873, y: 346, w: 91, h: 121 },
  { x: 673, y: 0, w: 145, h: 193 },
  { x: 671, y: 209, w: 152, h: 203 },
  { x: 72, y: 48, w: 85, h: 152 },
  { x: 173, y: 1, w: 148, h: 197 },
  { x: 840, y: 54, w: 205, h: 273 },
];

// One photo per frame, in slot order, with its intrinsic pixel size — that size
// is what reshapes the frame to hug the photo. The three portrait shots are
// placed in the slots that are already taller than they are wide, so no frame
// has to shrink much to take its photo.
const PHOTOS = [
  { src: "philadelphia.jpg", place: "Philadelphia, Pennsylvania", w: 750, h: 1000 },
  { src: "san-francisco.jpg", place: "San Francisco, California", w: 750, h: 1000 },
  { src: "lake-tahoe.jpg", place: "Lake Tahoe, California", w: 562, h: 1000 },
  { src: "philadelphia-2.jpg", place: "Philadelphia, Pennsylvania", w: 750, h: 1000 },
  { src: "catalina-island.jpg", place: "Catalina Island, California", w: 814, h: 1000 },
  { src: "san-juan.jpg", place: "San Juan, Puerto Rico", w: 750, h: 1000 },
  { src: "philadelphia-3.jpg", place: "Philadelphia, Pennsylvania", w: 750, h: 1000 },
  { src: "amathur.jpg", place: "Amathur, Tamilnadu", w: 750, h: 1000 },
  { src: "catalina-island-2.jpg", place: "Catalina Island, California", w: 750, h: 1000 },
  { src: "philadelphia-4.jpg", place: "Philadelphia, Pennsylvania", w: 750, h: 1000 },
  { src: "san-francisco-2.jpg", place: "San Francisco, California", w: 562, h: 1000 },
  { src: "san-francisco-3.jpg", place: "San Francisco, California", w: 750, h: 1000 },
  { src: "philadelphia-5.jpg", place: "Philadelphia, Pennsylvania", w: 750, h: 1000 },
];

const MOSAIC_TILES = hugPhotos(MOSAIC_SLOTS, PHOTOS);

// One photo per frame, so each frame can match that photo's shape exactly.
const MOSAIC_IMAGES = PHOTOS.map((photo) => [
  { src: `/photography/${photo.src}`, alt: photo.place, w: photo.w, h: photo.h },
]);

const MOSAIC_PLACES = PHOTOS.map((photo) => photo.place);

const BOOKS = [
  {
    title: "The Future of Humanity",
    author: "Michio Kaku",
    field: "Science",
    description:
      "A physicist's tour of humanity's next frontiers — terraforming Mars, interstellar travel, and the long odds of immortality.",
    cover: "/books/future-of-humanity.jpg",
  },
  {
    title: "Young Man Luther",
    author: "Erik H. Erikson",
    field: "Psychology",
    description:
      "A psychoanalytic biography of Martin Luther, tracing his identity crisis as the seed of the Reformation.",
    cover: "/books/young-man-luther.jpg",
  },
  {
    title: "The Universe in a Nutshell",
    author: "Stephen Hawking",
    field: "Physics",
    description:
      "Hawking's illustrated guide to relativity, quantum gravity, and the search for a unified theory of everything.",
    cover: "/books/universe-in-a-nutshell.jpg",
  },
  {
    title: "The Gentle Art of Swedish Death Cleaning",
    author: "Margareta Magnusson",
    field: "Lifestyle",
    description:
      "A wry, practical guide to decluttering your life for the people you'll one day leave behind.",
    cover: "/books/swedish-death-cleaning.jpg",
  },
  {
    title: "The Vegetarian",
    author: "Han Kang",
    field: "Fiction",
    description:
      "A woman's decision to stop eating meat unravels her family and her own sense of self, in three unsettling parts.",
    cover: "/books/the-vegetarian.jpg",
  },
  {
    title: "The Myth of Sisyphus",
    author: "Albert Camus",
    field: "Philosophy",
    description:
      "Camus's essay on the absurd — why life's lack of inherent meaning isn't a reason for despair, but for defiance.",
    cover: "/books/myth-of-sisyphus.jpg",
  },
  {
    title: "Zero: The Biography of a Dangerous Idea",
    author: "Charles Seife",
    field: "Science",
    description:
      "A history of the number zero and the void it stands for — the idea philosophers feared and mathematicians needed.",
    cover: "/books/zero.jpg",
  },
];

export default function HobbiesPage() {
  return (
    <>
      {/* First screen: the photographs, and nothing to do with books. */}
      <div id="photography">
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
              {/* relative so the flanking panes can be placed against the wall */}
              <div className="relative mt-12">
                <SidePanes height={MOSAIC_HEIGHT} />
                <MosaicGallery
                  tiles={MOSAIC_TILES}
                  images={MOSAIC_IMAGES}
                  places={MOSAIC_PLACES}
                  width={MOSAIC_WIDTH}
                  height={MOSAIC_HEIGHT}
                />
              </div>
            </div>
          }
        >
          {/* Nothing below the wall on this screen. An empty fragment rather
              than nothing at all, since PageShell falls back to a
              "Coming soon." placeholder when given no children. */}
          <></>
        </PageShell>
      </div>

      {/*
        Second screen: the books, alone and centred. A full viewport tall so
        that arriving here leaves the photographs above the fold entirely —
        this screen holds nothing but the books, and reads as its own page
        rather than a panel tacked onto the bottom of the last one.
      */}
      <section
        id="reading"
        className="relative flex min-h-screen w-full items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black"
      >
        <BookRecommendationsLabel fontClassName={playfairDisplay.className} />
        <BooksPanel books={BOOKS} />
      </section>

      {/* A closing note rather than a third screen of its own: the rest of the
          hobbies get a line and a sentence, not tiles. */}
      <section className="w-full bg-zinc-50 px-6 pb-28 pt-4 dark:bg-black">
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
            Other hobbies
          </p>
          <p className="text-center text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Running, crocheting, table tennis, tennis and snorkelling.
          </p>
          {/* Last thing on the page: the rule closes the section off rather
              than introducing it, so it sits below the text. */}
          <GappedRule gap={52} className="mt-3">
            <OysterIcon className="h-[34px] w-[42px]" />
          </GappedRule>
        </div>
      </section>

      <ScrollHandoff toId="reading" />
    </>
  );
}
