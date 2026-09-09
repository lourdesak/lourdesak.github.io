import { Playfair_Display } from "next/font/google";
import PageShell from "../components/PageShell";
import SimulationDetail from "../components/SimulationDetail";
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

const NEUTRINO_MEDIA = [
  {
    type: "video" as const,
    src: "/neutrino/simulation.mp4",
    poster: "/neutrino/simulation-poster.jpg",
    alt: "Geant4 simulation of a stopping-muon detector",
    w: 1280,
    h: 530,
  },
];

// Recolours a skill or tool name in place — no background, just the word.
function Hl({ children }: { children: React.ReactNode }) {
  return <span className="text-yellow-300">{children}</span>;
}

// The bullet list that fills each section panel in the Stopping-Muon detail.
function DetailPoints({ children }: { children: React.ReactNode }) {
  return (
    <ul className="flex flex-col gap-3 text-left text-[13px] leading-relaxed text-zinc-300 marker:text-[#8a7a00]/70">
      {children}
    </ul>
  );
}

const FEATURED: Project[] = [
  {
    label: "Stopping-Muon Detector Simulation",
    tag: "Neutrino Physics",
    duration: "2 years 4 months",
    description:
      "Developed a Geant4 simulation of a stopping-muon (SM) detector. Designed an algorithm to identify SMs and analysed data for a specific initial detector configuration.",
    // Clicking the media opens the three-section detail pop-up.
    content: (
      <SimulationDetail
        media={NEUTRINO_MEDIA}
        title="Stopping-Muon Detector Simulation"
        tag="Neutrino Physics"
        sections={[
          {
            heading: "DUNE",
            poster: {
              src: "/posters/dune.jpg",
              alt: "Conference poster: Neutrino Physics with the Deep Underground Neutrino Experiment",
            },
            body: (
              <DetailPoints>
                <li>
                  Conducted a literature review of long-baseline oscillation
                  physics and LBNF beamline design to ground subsequent analysis
                  work.
                </li>
                <li>
                  Configured Fermilab computing accounts and operated in a{" "}
                  <Hl>Linux</Hl>/<Hl>bash</Hl> environment for remote job
                  submission and data access.
                </li>
                <li>
                  Learned the collaboration&apos;s simulation and validation
                  workflow end to end.
                </li>
              </DetailPoints>
            ),
          },
          {
            heading: "Muon Monitors",
            body: (
              <DetailPoints>
                <li>
                  Analyzed simulated muon flux across three downstream monitors
                  using <Hl>C++</Hl> and <Hl>ROOT</Hl>.
                </li>
                <li>
                  Generated 2D flux heatmaps to characterize beam profiles, then
                  applied z cuts to isolate contributions by depth.
                </li>
                <li>
                  Produced histograms and flux distributions that identified a
                  beam misalignment relative to the monitor axis.
                </li>
                <li>
                  Drove a correction propagated through the full simulation
                  chain, improving beam modeling fidelity.
                </li>
              </DetailPoints>
            ),
          },
          {
            heading: "Geant-4 Simulation",
            body: (
              <DetailPoints>
                <li>
                  Integrated simplified detector geometry into <Hl>g4lbnf</Hl>,
                  the <Hl>Geant4</Hl> simulation of the LBNF beamline.
                </li>
                <li>
                  Built a stopping-muon detector simulation from scratch,
                  defining geometry, materials, physics lists, and sensitive
                  detector readout.
                </li>
                <li>
                  Developed the simulation into <Hl>MARGARITA</Hl>, the basis of
                  an undergraduate senior thesis.
                </li>
              </DetailPoints>
            ),
          },
        ]}
      />
    ),
  },
  {
    label: "Cosmic Watches at ~90,000 Feet",
    tag: "Astroparticle Physics",
    // Sep. 2024 – Jun. 2025, inclusive
    duration: "10 months",
    description:
      "Launched in-house built Cosmic Watches to heights of ~90,000 ft in Dr. Christina Love's lab. Soldered and polished scintillators, and presented findings at APS Mid-Atlantic.",
    // Clicking the media opens the three-section detail pop-up.
    content: (
      <SimulationDetail
        media={ASTRO_IMAGES}
        title="Cosmic Watches at ~90,000 Feet"
        tag="Astroparticle Physics"
        sections={[
          {
            heading: "Mentoring",
            poster: {
              src: "/posters/cosmic-watches.jpg",
              alt: "Conference poster: Cosmic Ray Detection with High-Altitude Balloon Launches",
            },
          },
          { heading: "Software" },
          { heading: "Hardware" },
        ]}
      />
    ),
  },
];

const RESEARCH: Project[] = [
  {
    label: "Data Acquisition for Moore Foundation",
    tag: "Physics Education",
    duration: "3 months",
    description:
      "Collected physics faculty data from the web, contributing to a Moore Foundation project.",
  },
  {
    label: "Enron Corpus and Model Lineage",
    tag: "Data Science",
    duration: "3 months",
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
