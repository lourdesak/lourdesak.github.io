import { Playfair_Display } from "next/font/google";
import PageShell from "../components/PageShell";
import ImageCarousel from "../components/ImageCarousel";
import ProjectCard, { type Project } from "../components/ProjectCard";
import GappedRule from "../components/GappedRule";
import OysterIcon from "../components/OysterIcon";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["italic"],
});

const ASTRO_IMAGES = [
  { src: "/astro/HAB.jpg", alt: "High-altitude balloon" },
  { src: "/astro/Poilish.jpg", alt: "Polishing a scintillator" },
  { src: "/astro/ASURS.jpg", alt: "ASURS project" },
  { src: "/astro/DCBwithallsensors.jpg", alt: "Detector control board with all sensors" },
];

const FEATURED: Project[] = [
  {
    label: "Stopping-Muon Detector Simulation",
    tag: "Neutrino Physics",
    description:
      "Developed a Geant4 simulation of a stopping-muon (SM) detector. Designed an algorithm to identify SMs and analysed data for a specific initial detector configuration.",
  },
];

const RESEARCH: Project[] = [
  {
    label: "Cosmic Watches at 80,000 Feet",
    tag: "Astroparticle Physics",
    description:
      "Launched in-house built Cosmic Watches to heights of 80,000 ft in Dr. Christina Love's lab. Soldered and polished scintillators, and presented findings at APS Mid-Atlantic.",
    // `fill` because the card gives the media a fixed height to sit in
    content: <ImageCarousel images={ASTRO_IMAGES} fill />,
  },
  {
    label: "Faculty Data for the Moore Foundation",
    tag: "Physics Education Research",
    description:
      "Collected physics faculty data from the web, contributing to a Moore Foundation project.",
  },
  {
    label: "Enron Corpus and Model Lineage",
    tag: "Data Science",
    description:
      "Collected Enron data to study the lineage of general-purpose AI systems.",
  },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className={`${playfairDisplay.className} text-2xl italic tracking-wide text-zinc-800 dark:text-zinc-100`}
    >
      {children}
    </h2>
  );
}

export default function ProjectsPage() {
  return (
    <PageShell title="Projects">
      <div className="flex w-full flex-col gap-16 pb-24 pt-6">
        <section className="flex flex-col gap-6">
          <SectionHeading>Featured</SectionHeading>
          {/* The featured project runs the full width rather than sitting in a
              half-width cell — being featured should look like something. */}
          <div className="grid grid-cols-1 gap-8">
            {FEATURED.map((project, i) => (
              <ProjectCard
                key={project.label}
                project={project}
                index={i}
                mediaHeight={300}
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <SectionHeading>Research</SectionHeading>
          {/* Columns by breakpoint rather than fixed pixel widths, which used to
              push the page wider than the window on a narrow screen. */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {RESEARCH.map((project, i) => (
              <ProjectCard
                key={project.label}
                project={project}
                index={FEATURED.length + i}
              />
            ))}
          </div>
        </section>

        {/* Closes the page off, as on the hobbies and awards pages. */}
        <GappedRule gap={52}>
          <OysterIcon className="h-[34px] w-[42px]" />
        </GappedRule>
      </div>
    </PageShell>
  );
}
