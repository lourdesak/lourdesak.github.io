import PageShell from "../components/PageShell";

const HOBBIES = ["Hobby 1", "Hobby 2", "Hobby 3", "Hobby 4"];

export default function HobbiesPage() {
  return (
    <PageShell title="Hobbies">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {HOBBIES.map((hobby) => (
          <div
            key={hobby}
            className="flex aspect-square items-center justify-center rounded-2xl border border-zinc-200 bg-white p-4 text-center text-sm text-zinc-500 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
          >
            {hobby}
          </div>
        ))}
      </div>
    </PageShell>
  );
}
