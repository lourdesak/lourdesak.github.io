import HoverPhoto from "./components/HoverPhoto";
import NameWave from "./components/NameWave";
import ParticleCollision from "./components/ParticleCollision";

export default function Home() {
  return (
    <div className="relative flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <ParticleCollision />
      <main className="relative z-10 flex w-full max-w-2xl flex-col gap-8 px-6 py-24">
        <div className="flex flex-col gap-4">
          <NameWave name="Lourdes Akirtha" />
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            22-year-old physics PhD student at the University of Hawaiʻi at
            Mānoa. My roots trace back to a coastal city in India called{" "}
            <HoverPhoto
              src="/tuticorin.jpg"
              alt="Fishing boats in shallow turquoise water off the coast of Thoothukudi (Tuticorin), India"
              width={636}
              height={800}
            >
              <span className="text-sky-300">Tuticorin</span>
            </HoverPhoto>{" "}
            with recent years spent in{" "}
            <HoverPhoto
              src="/philadelphia.jpg"
              alt="The Philadelphia skyline seen across a park lawn on a clear spring day"
              width={800}
              height={533}
              panelWidth="w-72"
            >
              <span className="text-sky-300">Philadelphia</span>
            </HoverPhoto>{" "}
            and{" "}
            <HoverPhoto
              src="/honolulu.jpg"
              alt="Aerial view of Honolulu with Diamond Head rising behind the city"
              width={750}
              height={494}
              panelWidth="w-72"
            >
              <span className="text-sky-300">Honolulu</span>
            </HoverPhoto>
            . Reading is my shining hobby and passion, and I&apos;ve contributed
            primarily as a researcher and a mentor across multiple projects. May it be coding, 
            soldering or helping write grants, I try to be adaptable.
          </p>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
            Links
          </h2>
          <ul className="flex flex-col gap-1 text-zinc-700 dark:text-zinc-300">
            <li>
              <a
                className="underline underline-offset-4 hover:text-black dark:hover:text-white"
                href="https://github.com/lourdesak"
              >
                GitHub
              </a>
            </li>
            <li>
              <a
                className="underline underline-offset-4 hover:text-black dark:hover:text-white"
                href="mailto:lourdes2@hawaii.edu"
                            >
                Email
                            </a>
            </li>
            <li>
              <a
                className="underline underline-offset-4 hover:text-black dark:hover:text-white"
                href="https://www.linkedin.com/in/lourdes-raj/"
              >
                LinkedIn
              </a>
            </li>
            <li>
              <a
                className="underline underline-offset-4 hover:text-black dark:hover:text-white"
                href="https://badgelist.com/u/lourdesakirtha"
              >
                BadgeList
              </a>
            </li>
          </ul>
        </section>
      </main>

      <footer className="absolute bottom-3 right-4 z-10 max-w-[90vw] text-right text-[10px] leading-relaxed text-zinc-400 dark:text-zinc-600">
        <p>Tuticorin &mdash; visualsbysaud &middot; tntourismoffcl</p>
        <p>Philadelphia &mdash; Guide to Philly</p>
        <p>Honolulu &mdash; TripSavvy, part of the People Inc. publishing family</p>
      </footer>
    </div>
  );
}
