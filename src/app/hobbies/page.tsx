import { Poppins } from "next/font/google";
import PageShell from "../components/PageShell";
import SquareGrid from "../components/SquareGrid";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600"],
});

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
        <h2
          className={`${poppins.className} animate-[fade-in_2s_ease-out] mb-8 text-center text-2xl font-light text-zinc-800 dark:text-zinc-100`}
        >
          Crossroads of Travelling & Photography
        </h2>
      }
    >
      <SquareGrid items={HOBBIES} />
    </PageShell>
  );
}
