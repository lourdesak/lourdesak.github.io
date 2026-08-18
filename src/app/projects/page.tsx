import PageShell from "../components/PageShell";
import SquareGrid from "../components/SquareGrid";

const PROJECTS = [
  {
    label: "Neutrino Physics",
    description: "Developed a Geant4 simulation of a stopping-muon detector in Dr. Michell Dolinski’s lab. Designed an algorithm to identify and capture stopping muons, then analyzed the resulting data for a specific initial detector configuration.",
  },
  {
    label: "Astroparticle Physics",
    description: "Launched (in-house built) Cosmic Watches to heights of 80,000 ft in Dr. Christina Love's lab. Soldered, polished scintillatos and eventually presented finding at APS Mid-Atlantic",
  },
  {
    label: "Physics Education Research",
    description: "Scrapped huge amounts of physics faculty data off the web for the Moore foundation",
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
        <SquareGrid items={PROJECTS} cardWidth={404} cardHeight={202} columns={1} />
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
          Featured Projects
        </h2>
      </div>
    </PageShell>
  );
}
