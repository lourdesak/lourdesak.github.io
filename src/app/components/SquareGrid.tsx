export default function SquareGrid({ items }: { items: string[] }) {
  return (
    <div className="grid w-fit grid-cols-2 gap-6">
      {items.map((label) => (
        <div key={label} className="flex flex-col gap-3">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {label}
          </p>
          <div className="h-[202px] w-[202px] rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900" />
        </div>
      ))}
    </div>
  );
}
