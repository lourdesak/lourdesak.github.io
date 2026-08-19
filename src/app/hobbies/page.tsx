import { Josefin_Sans } from "next/font/google";
import PageShell from "../components/PageShell";
import SquareGrid from "../components/SquareGrid";
import ImageCarousel from "../components/ImageCarousel";

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["italic"],
});

const HOBBY_IMAGES: { src: string; alt: string }[] = [];

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
            className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            style={{ width: 360, height: 720 }}
          >
            <ImageCarousel images={HOBBY_IMAGES} />
          </div>
        </div>
      }
    >
      <SquareGrid items={HOBBIES} />
    </PageShell>
  );
}
