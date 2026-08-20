import PageShell from "../components/PageShell";
import SquareGrid from "../components/SquareGrid";
import ImageCarousel from "../components/ImageCarousel";

const ASTRO_IMAGES = [
  { src: "/astro/HAB.jpg", alt: "High-altitude balloon" },
  { src: "/astro/Poilish.jpg", alt: "Polishing a scintillator" },
  { src: "/astro/ASURS.jpg", alt: "ASURS project" },
  { src: "/astro/DCBwithallsensors.jpg", alt: "Detector control board with all sensors" },
];

const PROJECTS = [
  {
    label: "Neutrino Physics",
    description: "Developed a Geant4 simulation of a stopping-muon (SM) detector. Designed an algorithm to identify SMs & analyzed data for a specific initial detector configuration.",
  },
  {
    label: "Astroparticle Physics",
    description: "Launched (in-house built) Cosmic Watches to heights of 80,000 ft in Dr. Christina Love's lab. Soldered, polished scintillators and eventually presented findings at APS Mid-Atlantic.",
    content: <ImageCarousel images={ASTRO_IMAGES} />,
  },
  {
    label: "Physics Education Research",
    description: "Collected physics faculty data off the web to contribute for a Moore foundation project",
  },
  {
    label: "Data Science",
    description: "Collected Enron data to study general purpose AI lineage.",
  },
];

export default function ProjectsPage() {
  return (
    <PageShell title="Projects">
      <div className="mt-6 flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
          Research Projects
        </h2>
        <SquareGrid items={PROJECTS} cardWidth={600} cardHeight={300} columns={2} />
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
          Featured Projects
        </h2>
      </div>
    </PageShell>
  );
}
