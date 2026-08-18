import PageShell from "../components/PageShell";
import SquareGrid from "../components/SquareGrid";

const PROJECTS = [
  {
    label: "Neutrino Physics",
    description: "A short description of this project goes here.",
  },
  {
    label: "Astroparticle Physics",
    description: "A short description of this project goes here.",
  },
  {
    label: "Physics Education Research",
    description: "A short description of this project goes here.",
  },
  {
    label: "Data Science",
    description: "A short description of this project goes here.",
  },
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
