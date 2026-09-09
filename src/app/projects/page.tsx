import { Playfair_Display } from "next/font/google";
import PageShell from "../components/PageShell";
import SimulationDetail from "../components/SimulationDetail";
import ProjectCard, { type Project } from "../components/ProjectCard";
import ResearchPanel from "../components/ResearchPanel";
import PresentationsList, {
  type Presentation,
} from "../components/PresentationsList";
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

// The titled-bullet list that fills each section panel of a project detail.
// `detail-points` drives the open-time intro animation (see globals.css).
function DetailPoints({ children }: { children: React.ReactNode }) {
  return (
    <ul className="detail-points flex flex-col gap-4 text-left text-[13px] text-zinc-300">
      {children}
    </ul>
  );
}

// One accomplishment: a short bold lead, then the detail beneath it, marked
// with the same gold hairline the section headings use.
function Point({
  lead,
  children,
}: {
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <li className="grid grid-cols-[auto_1fr] gap-x-3">
      <span
        aria-hidden
        className="mt-[9px] h-px w-3 shrink-0 bg-[#8a7a00]/80"
      />
      <div>
        <p className="detail-lead font-bold tracking-tight text-zinc-100">
          {lead}
        </p>
        {/* Grid wrapper collapses to zero height during the intro so the
            subheadings start evenly spaced, then opens to push them apart. */}
        <div className="detail-body-wrap grid">
          <div className="overflow-hidden">
            <p className="detail-body pt-1 text-[13.5px] leading-relaxed text-zinc-400">
              {children}
            </p>
          </div>
        </div>
      </div>
    </li>
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
              alt: "Conference poster: Studying Neutrinos with the Deep Underground Neutrino Experiment",
            },
            body: (
              <DetailPoints>
                <Point lead="Literature review">
                  Surveyed long-baseline oscillation physics and LBNF beamline
                  design to ground the analysis work that followed.
                </Point>
                <Point lead="Computing environment">
                  Set up Fermilab computing accounts and worked in a{" "}
                  <Hl>Linux</Hl>/<Hl>bash</Hl> environment for remote job
                  submission and data access.
                </Point>
                <Point lead="Workflow onboarding">
                  Learned the collaboration&apos;s simulation and validation
                  workflow end to end.
                </Point>
              </DetailPoints>
            ),
          },
          {
            heading: "Muon Monitors (MuMs)",
            body: (
              <DetailPoints>
                <Point lead="Detector context">
                  Worked with the three Muon Monitors (<Hl>MuMs</Hl>, Alcoves
                  1&ndash;3) sitting downstream of the decay pipe and hadron
                  absorber, where the muon beam is measured as a proxy for the
                  harder-to-detect neutrino beam.
                </Point>
                <Point lead="Flux analysis">
                  Analyzed simulated muon flux and energy distributions across
                  the three monitors at 100M protons-on-target (PoT) using{" "}
                  <Hl>C++</Hl> and <Hl>ROOT</Hl>.
                </Point>
                <Point lead="Beam monitoring">
                  Generated 2D X&ndash;Y flux heatmaps per alcove to
                  characterize the beam profile, then applied z cuts along the
                  beamline to isolate contributions by depth and track how beam
                  properties evolve between alcoves.
                </Point>
                <Point lead="Horn-current modes">
                  Compared Forward (<Hl>FHC</Hl>) and Reverse (<Hl>RHC</Hl>)
                  magnetic-horn current settings, which switch the focused beam
                  between neutrino (antimuon-rich) and antineutrino (muon-rich)
                  running.
                </Point>
                <Point lead="Misalignment finding">
                  Produced histograms and flux distributions (including total
                  muon flux versus z along the beamline) that revealed a beam
                  misalignment relative to the monitor axis.
                </Point>
                <Point lead="Correction and impact">
                  Drove a correction through the full simulation chain,
                  improving beam-modeling fidelity.
                </Point>
              </DetailPoints>
            ),
          },
          {
            heading: "Geant-4 Simulation",
            body: (
              <DetailPoints>
                <Point lead="Geometry integration">
                  Integrated a simplified detector geometry into{" "}
                  <Hl>g4lbnf</Hl>, the <Hl>Geant4</Hl> simulation of the LBNF
                  beamline, and built a standalone detector construction
                  defining sensitive and non-sensitive volumes, material
                  assignments, and world-volume placement.
                </Point>
                <Point lead="Beam configuration">
                  Implemented a configurable primary generator around the{" "}
                  <Hl>Geant4 General Particle Source</Hl>, exposing particle
                  type, planar source geometry, propagation direction, and a
                  linear energy spectrum through run macros so beam conditions
                  could be varied without recompiling.
                </Point>
                <Point lead="Physics modeling">
                  Applied the <Hl>QGSP_BERT</Hl> reference physics list to model
                  hadronic interactions and electromagnetic energy loss for
                  low-energy muons traversing the detector medium.
                </Point>
                <Point lead="Identification algorithm">
                  Optimized the stopping-muon identification logic in{" "}
                  <Hl>C++</Hl> using tracking-level stepping actions, and
                  validated the algorithm in consultation with <Hl>Geant4</Hl>{" "}
                  experts.
                </Point>
                <Point lead="Analysis framework">
                  Built a histogram manager on <Hl>G4AnalysisManager</Hl>{" "}
                  producing 1D and 2D distributions of energy spectra, radial
                  vertex density, and angular distributions in theta and phi,
                  plus an ntuple recording particle ID, incident position,
                  incident angle, and event weight. Output format and binning
                  were runtime-configurable via messenger commands, with{" "}
                  <Hl>ROOT</Hl> as the default backend.
                </Point>
                <Point lead="MARGARITA and thesis">
                  Developed the full simulation into <Hl>MARGARITA</Hl>, a
                  modular <Hl>Geant4</Hl> stopping-muon detector framework and
                  the basis of an undergraduate senior thesis.
                </Point>
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
            body: (
              <DetailPoints>
                <Point lead="HERA collaboration">
                  Contributed to the <Hl>HERA</Hl> collaboration between Drexel
                  University and Springside Chestnut Hill Academy, pairing
                  university researchers with secondary-school students on live
                  flight campaigns.
                </Point>
                <Point lead="Student training">
                  Trained student team members on payload assembly, sensor
                  integration, and launch-day procedure through Drexel&apos;s
                  Vertically Integrated Projects (<Hl>VIP</Hl>) program.
                </Point>
                <Point lead="Multi-site coordination">
                  Supported coordinated multi-site launches under the NASA
                  Nationwide Eclipse Ballooning Project, including preparation
                  for joint flights with collaborators across several U.S.
                  states and Australia.
                </Point>
                <Point lead="Grant support">
                  Helped refine NSF grant submissions for the ballooning
                  project.
                </Point>
                <Point lead="Outreach">
                  Communicated results through a poster presentation and
                  hands-on demonstrations of detector operation to student and
                  public audiences.
                </Point>
              </DetailPoints>
            ),
          },
          {
            heading: "Software",
            body: (
              <DetailPoints>
                <Point lead="Flight firmware">
                  Programmed <Hl>Adafruit CLUE</Hl> flight firmware to log{" "}
                  <Hl>CosmicWatch</Hl> pulse counts alongside onboard sensor
                  data at fixed sampling intervals.
                </Point>
                <Point lead="DAQ platform">
                  Built data acquisition on <Hl>Raspberry Pi</Hl>, then migrated
                  the stack to <Hl>ESP32</Hl> for lower power draw and reduced
                  payload mass.
                </Point>
                <Point lead="Clock synchronization">
                  Implemented real-time clock synchronization across data
                  collection boxes, yielding time-aligned particle-count and
                  atmospheric records for cross-instrument comparison.
                </Point>
                <Point lead="Sensor integration">
                  Interfaced <Hl>BME280</Hl> (temperature, humidity, pressure),{" "}
                  <Hl>MPU6050</Hl> (accelerometer/gyroscope), and{" "}
                  <Hl>GT-U7 NEO-6M GPS</Hl> over <Hl>I2C</Hl> and <Hl>UART</Hl>,
                  with buffered writes to onboard storage for flight-duration
                  logging.
                </Point>
                <Point lead="Telemetry and tracking">
                  Used <Hl>APRS</Hl> telemetry (<Hl>MicroTrak 1000</Hl>,{" "}
                  <Hl>LightAPRS 1.0</Hl>) and <Hl>SPOT</Hl> satellite tracking
                  data for live position tracking, payload recovery, and
                  post-flight analysis.
                </Point>
                <Point lead="Flight prediction">
                  Ran pre-launch flight-path predictions to select launch sites
                  and forecast landing zones within FAA constraints.
                </Point>
                <Point lead="Data analysis">
                  Processed multi-launch datasets in <Hl>Python</Hl>, converting
                  raw counts to count rate versus altitude and resolving the
                  Regener-Pfotzer maximum near 67,000 ft, with a secondary
                  maximum near 74,000 ft and a sharp decline after burst at
                  roughly 98,000 ft.
                </Point>
                <Point lead="Angular-dependence study">
                  Compared Geiger-counter channels across launches to test
                  angular dependence (GC1 and GC3 mounted vertically, GC2 at 60
                  degrees from vertical), finding count rates consistent with a
                  vertical-orientation enhancement.
                </Point>
              </DetailPoints>
            ),
          },
          {
            heading: "Hardware",
            body: (
              <DetailPoints>
                <Point lead="Payload boxes">
                  Designed and fabricated data-collection boxes housing
                  rechargeable <Hl>Li-ion</Hl> packs, sensor stacks, and{" "}
                  <Hl>CosmicWatch</Hl> detectors, with wiring harnesses
                  optimized for minimal mass and modular sensor expansion.
                </Point>
                <Point lead="Thermal enclosure">
                  Engineered closed-cell foam enclosures for passive thermal
                  insulation against stratospheric temperatures near minus 60 C,
                  doubling as buoyant flotation for water landings and as impact
                  absorption on descent.
                </Point>
                <Point lead="Detector integration">
                  Integrated <Hl>CosmicWatch</Hl> detectors (5&times;5&times;1
                  cm plastic scintillator coupled to a <Hl>SiPM</Hl>) and{" "}
                  <Hl>GMC-500</Hl> Geiger counters into the payload train.
                </Point>
                <Point lead="Flight-train assembly">
                  Assembled and balanced the flight train (latex weather
                  balloon, inline parachute, and secured payload boxes) rigged
                  to FAA guidelines.
                </Point>
                <Point lead="Launch and recovery">
                  Ran early-morning launch operations to maximize daylight
                  recovery, and recovered payloads in the field across
                  Pennsylvania launch sites (Hershey and Newville).
                </Point>
              </DetailPoints>
            ),
          },
        ]}
      />
    ),
  },
];

const RESEARCH: Project[] = [
  {
    label: "Data Acquisition for Moore Foundation",
    tag: "Physics Education",
    // Jun. 2024 – Sep. 2024, inclusive
    duration: "4 months",
    description:
      "Data acquisition for a Moore Foundation project, advised by Dr. Eric Brewe.",
    content: (
      <ResearchPanel>
        Built Python web scrapers with Beautiful Soup to collect physics-faculty
        research interests across Ph.D.-granting U.S. universities.
      </ResearchPanel>
    ),
  },
  {
    label: "Enron Corpus and Model Lineage",
    tag: "Data Science",
    duration: "3 months",
    description:
      "Studying the lineage of general-purpose AI systems through the Enron corpus.",
    content: (
      <ResearchPanel>
        Developed and customized GPT models to navigate large-scale Enron email
        datasets, enabling targeted information extraction.
      </ResearchPanel>
    ),
  },
];

// Talks and posters, newest first. Titles quoted verbatim from the CV.
const PRESENTATIONS: Presentation[] = [
  {
    date: "May 2025",
    format: "Talk",
    venue: "2025 Scientific Ballooning Technologies Workshop",
    location: "University of Minnesota, MN, USA",
    title:
      "“Mapping the Regener-Pfotzer Maximum: A Global Collaboration in Cosmic-Ray Astrophysics”",
  },
  {
    date: "Apr. 2025",
    format: "Talk & poster",
    venue: "ASURS: A Symposium for Undergraduate Research & Scholarship",
    location: "Drexel University, Philadelphia, PA, USA",
    title: "HERA: High-altitude Research in Astrophysics",
  },
  {
    date: "Nov. 2024",
    format: "Talk",
    venue: "American Physical Society Mid-Atlantic Section Annual Meeting",
    location: "Temple University, Philadelphia, PA, USA",
    title:
      "“Preliminary Results for the High-altitude Research in Astrophysics Project”",
  },
  {
    date: "Sep. 2024",
    format: "Talk",
    venue: "Nerd Night, Undergraduate Research & Enrichment Programs (UREP)",
    location: "Drexel University, Philadelphia, PA, USA",
    title: "“Neutrino Science with the Deep Underground Neutrino Experiment”",
  },
  {
    date: "Sep. 2024",
    format: "Poster",
    venue: "STAR Poster Presentation",
    location: "Drexel University, Philadelphia, PA, USA",
    title: "“Studying neutrinos with the Deep Underground Neutrino Experiment”",
  },
  {
    date: "Nov. 2023",
    format: "Poster",
    venue: "Start Talking Science",
    location: "Science History Institute, Philadelphia, PA, USA",
    title: "“Neutrino Science with the Deep Underground Neutrino Experiment”",
  },
  {
    date: "Sep. 2023",
    format: "Talk",
    venue: "Drexel Particle Group Meeting",
    location: "Drexel University, Philadelphia, PA, USA",
    title:
      "“Understanding neutrino activity through Muon histogram analysis with the Deep Underground Neutrino Experiment”",
  },
];

function SectionHeading({
  children,
  pill = false,
}: {
  children: React.ReactNode;
  /** wrap the heading text in the same gold oval the tag pills use */
  pill?: boolean;
}) {
  return (
    <h2
      className={`${playfairDisplay.className} text-2xl italic tracking-wide text-zinc-800 dark:text-zinc-100 ${
        pill
          ? "inline-flex self-start rounded-full border border-[#8a7a00] px-5 py-1.5"
          : ""
      }`}
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
          <SectionHeading pill>Featured Research Projects</SectionHeading>
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
          <SectionHeading pill>Other Research</SectionHeading>
          {/* Columns by breakpoint rather than fixed pixel widths, which used to
              push the page wider than the window on a narrow screen. */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {RESEARCH.map((project, i) => (
              <ProjectCard
                key={project.label}
                project={project}
                index={FEATURED.length + i}
                sheen={false}
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading>Presentations</SectionHeading>
          <PresentationsList items={PRESENTATIONS} />
        </section>

        {/* Closes the page off, as on the hobbies and awards pages. */}
        <GappedRule gap={52}>
          <OysterIcon className="h-[34px] w-[42px]" />
        </GappedRule>
      </div>
    </PageShell>
  );
}
