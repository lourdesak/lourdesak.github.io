import PageShell from "../components/PageShell";
import SquareGrid from "../components/SquareGrid";

const PROJECTS = [
  "Neutrino Physics",
  "Astroparticle Physics",
  "Physics Education Research",
  "Data Science",
];

export default function ProjectsPage() {
  return (
    <PageShell title="Research">
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
          Research Projects
        </h2>
        <SquareGrid items={PROJECTS} />
      </div>
    </PageShell>
  );
}
