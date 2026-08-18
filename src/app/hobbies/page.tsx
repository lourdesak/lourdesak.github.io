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
      <SquareGrid items={HOBBIES} />
    </PageShell>
  );
}
