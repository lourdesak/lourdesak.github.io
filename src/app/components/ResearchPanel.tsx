/**
 * Fills a research card's media area with a line about the work instead of a
 * photograph. Static and non-interactive: nothing to click, no pop-up, and no
 * silver sheen behind it, so it reads flatter than the featured cards.
 */
export default function ResearchPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 flex items-center">
      <p className="relative mx-7 border-l-2 border-[#8a7a00]/60 pl-4 text-[14.5px] leading-relaxed text-zinc-600 dark:text-zinc-300">
        {children}
      </p>
    </div>
  );
}
