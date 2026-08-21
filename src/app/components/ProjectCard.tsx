import css from "./projectCard.module.css";

export type Project = {
  label: string;
  /** the field it sits in, set as a small pill — as the books panel does */
  tag?: string;
  description?: string;
  /** photographs or similar; a card without any gets a quiet silver panel */
  content?: React.ReactNode;
};

/** ms between one card landing and the next setting off */
const STAGGER = 110;

/**
 * One project.
 *
 * The description is always visible. It used to appear only on hover, which
 * hides the substance of the page from anyone reading rather than pointing,
 * and leaves nothing at all on a touchscreen — the media is the decoration
 * here, the words are the content.
 */
export default function ProjectCard({
  project,
  index,
  mediaHeight = 260,
}: {
  project: Project;
  index: number;
  mediaHeight?: number;
}) {
  return (
    <article
      className={`${css.card} group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1.5 hover:shadow-xl dark:bg-zinc-900 dark:ring-zinc-800`}
      style={{ "--delay": `${index * STAGGER}ms` } as React.CSSProperties}
    >
      <div
        className="relative w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950"
        style={{ height: mediaHeight }}
      >
        {project.content ?? (
          <>
            <span className={`absolute inset-0 ${css.blank}`} />
            {/* the numeral stands in for artwork, rather than an empty box */}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="text-[76px] font-semibold leading-none tabular-nums text-zinc-300/70 dark:text-zinc-700/60">
                {String(index + 1).padStart(2, "0")}
              </span>
            </span>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="text-[17px] font-medium leading-snug text-zinc-900 dark:text-zinc-50">
            {project.label}
          </h3>
          {project.tag && (
            // The ring picks up the gold the name's underline uses on the home
            // page, and the awards figures use for their totals — one accent
            // across the site rather than a new colour per page.
            <span className="rounded-full border border-[#8a7a00] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
              {project.tag}
            </span>
          )}
        </div>

        {project.description && (
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {project.description}
          </p>
        )}
      </div>

      <span className={css.sheen} aria-hidden="true" />
    </article>
  );
}
