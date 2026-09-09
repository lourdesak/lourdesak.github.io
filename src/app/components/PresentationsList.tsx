import css from "./presentationsList.module.css";

/** ms between one row landing and the next setting off */
const STAGGER = 130;

export type Presentation = {
  /** as it reads on the CV, e.g. "Nov. 2024" */
  date: string;
  /** talk, poster, or — for ASURS — both */
  format: "Talk" | "Poster" | "Talk & poster";
  /** the meeting or event */
  venue: string;
  /**
   * Host institution and city, set apart in gold — this list is meant to be
   * read down the places as much as down the dates.
   */
  location: string;
  /**
   * The heading for the row — a talk title (quote it in the string), or a
   * project name. Falls back to the venue when there isn't a distinct one.
   */
  title?: string;
};

function TalkMark() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 4.5h13v9h-8l-3.5 3v-3h-1.5z" />
      <path d="M6.5 8h7M6.5 10.5h4.5" strokeLinecap="round" />
    </svg>
  );
}

function PosterMark() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="3" width="12" height="14" rx="1" />
      <path d="M7 6.5h6M7 9.5h6M7 12.5h3.5" strokeLinecap="round" />
    </svg>
  );
}

function PinMark() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      className="h-3 w-3 flex-none"
      aria-hidden="true"
    >
      <path d="M8 1.8c-2.4 0-4.3 1.9-4.3 4.3 0 3 4.3 7.6 4.3 7.6s4.3-4.6 4.3-7.6C12.3 3.7 10.4 1.8 8 1.8z" />
      <circle cx="8" cy="6" r="1.5" />
    </svg>
  );
}

/**
 * Talks and posters, newest first, in the same row idiom as the awards list.
 * The location sits on its own line in gold so the list can be scanned by
 * where the work was shown, not only by when.
 */
export default function PresentationsList({
  items,
}: {
  items: Presentation[];
}) {
  return (
    <ul className="flex w-full flex-col">
      {items.map((p, i) => {
        const primary = p.title ?? p.venue;
        const secondary = p.title ? p.venue : null;

        return (
          <li
            key={i}
            className={`${css.row}${
              i > 0 ? " border-t border-zinc-200/80 dark:border-zinc-800/80" : ""
            }`}
            style={{ "--delay": `${i * STAGGER}ms` } as React.CSSProperties}
          >
            <div className="group -mx-4 flex gap-4 rounded-lg px-4 py-5 transition-colors hover:bg-zinc-100/60 dark:hover:bg-zinc-900/50">
              {/* format mark: speech panel for a talk, board for a poster */}
              <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full border border-zinc-300 text-zinc-500 transition-colors group-hover:border-zinc-400 group-hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:group-hover:border-zinc-500 dark:group-hover:text-zinc-200">
                <span className="h-[18px] w-[18px]">
                  {p.format === "Poster" ? <PosterMark /> : <TalkMark />}
                </span>
              </span>

              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="text-[15px] font-medium leading-snug text-zinc-800 dark:text-zinc-100">
                    {primary}
                  </span>
                  <span className="rounded-full border border-[#8a7a00] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                    {p.format}
                  </span>
                  <span className="text-[12px] tabular-nums tracking-wide text-zinc-500 dark:text-zinc-500">
                    {p.date}
                  </span>
                </span>

                {secondary && (
                  <span className="text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">
                    {secondary}
                  </span>
                )}

                <span className="flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-[0.12em] text-[#8a7a00] dark:text-[#c9a227]">
                  <PinMark />
                  {p.location}
                </span>
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
