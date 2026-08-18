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
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
          Crossroads of Travelling & Photography
        </h2>
        <SquareGrid items={HOBBIES} />
      </div>
    </PageShell>
  );
}
