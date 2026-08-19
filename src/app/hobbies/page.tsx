import PageShell from "../components/PageShell";
import SquareGrid from "../components/SquareGrid";

const HOBBIES = [
  { label: "Hobby 1" },
  { label: "Hobby 2" },
  { label: "Hobby 3" },
  { label: "Hobby 4" },
];

export default function HobbiesPage() {
  return (
    <PageShell title="Hobbies">
      <div className="flex flex-col gap-12">
        <h2 className="text-center text-2xl font-medium text-zinc-800 dark:text-zinc-100">
          Crossroads of Travelling & Photography
        </h2>
        <SquareGrid items={HOBBIES} />
      </div>
    </PageShell>
  );
}
