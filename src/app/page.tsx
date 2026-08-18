import NameWave from "./components/NameWave";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-start justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-4xl flex-col gap-8 px-6 py-24">
        <div className="flex flex-col gap-4">
          <NameWave name="Lourdes Akirtha" />
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            22-year-old physics PhD student at the University of Hawaiʻi at
            Mānoa. My roots trace back to a coastal city in India called "Tuticorin"
            with recent years spent in Philadelphia and Honolulu.
            Reading is my shining hobby and passion, and I&apos;ve contributed
            primarily as a researcher and a mentor across multiple projects. May it be coding, 
            soldering or helping write grants, I try to mold for the situation.
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
    </div>
  );
}
