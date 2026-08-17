export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8 px-6 py-24">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Lourdes Akirtha
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            A short tagline about who you are and what you do goes here.
          </p>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
            About
          </h2>
          <p className="text-zinc-700 dark:text-zinc-300">
            Write a couple of sentences about your background, interests, and
            what you&apos;re currently working on.
          </p>
        </section>

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
                href="https://badgelist.com/u/lourdesakirtha"
              >
                BadgeList
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
          </ul>
        </section>
      </main>
    </div>
  );
}
