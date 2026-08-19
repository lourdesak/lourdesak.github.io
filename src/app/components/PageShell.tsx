export default function PageShell({
  title,
  header,
  children,
}: {
  title: string;
  header?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 items-start bg-zinc-50 pt-32 font-sans dark:bg-black">
      <div className="w-full max-w-4xl px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {title}
        </h1>
      </div>
      {header && <div className="w-full px-6">{header}</div>}
      <main className="flex w-full max-w-4xl flex-col gap-4 px-6">
        <div className="text-zinc-700 dark:text-zinc-300">
          {children ?? <p>Coming soon.</p>}
        </div>
      </main>
    </div>
  );
}
