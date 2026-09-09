import css from "./projectCard.module.css";

/**
 * Fills a research card's media area with a line about the work instead of a
 * photograph. Static and non-interactive — unlike the featured cards, there is
 * nothing to click and no pop-up to open.
 */
export default function ResearchPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 flex items-center">
      {/* the same held-down silver a card with no media would show */}
      <span className={`absolute inset-0 ${css.blank}`} aria-hidden="true" />
      <p className="relative mx-7 border-l-2 border-[#8a7a00]/60 pl-4 text-[14.5px] leading-relaxed text-zinc-600 dark:text-zinc-300">
        {children}
      </p>
    </div>
  );
}
