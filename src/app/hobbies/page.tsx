import PageShell from "../components/PageShell";
import SquareGrid from "../components/SquareGrid";

const HOBBIES = ["Hobby 1", "Hobby 2", "Hobby 3", "Hobby 4"];

export default function HobbiesPage() {
  return (
    <PageShell title="Hobbies">
      <SquareGrid items={HOBBIES} />
    </PageShell>
  );
}
