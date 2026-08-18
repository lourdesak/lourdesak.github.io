export default function PageShell({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 items-start bg-zinc-50 pt-32 font-sans dark:bg-black">
      <main className="flex w-full max-w-4xl flex-col gap-4 px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {title}
        </h1>
        <div className="text-zinc-700 dark:text-zinc-300">
          {children ?? <p>Coming soon.</p>}
        </div>
      </main>
    </div>
  );
}
