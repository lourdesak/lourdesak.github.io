import css from "./awardsList.module.css";

/** ms between one row landing and the next setting off */
const STAGGER = 140;

export type Award = {
  title: string;
  /** the acronym or qualifier that trails the title, set quieter than it */
  note?: string;
  /** dollar figure, for the funded ones */
  amount?: number;
  /** as it reads on the CV */
  period: string;
  /** funding won, or an honour conferred — they get different marks */
  kind: "grant" | "honour";
  /**
   * Which pot the money came from. Research support and scholarship are
   * totalled separately in the summary line, so an entry carrying an `amount`
   * needs to say which it is.
   */
  fund?: "research" | "scholarship";
  /** where to read more; the row only becomes a link once this is set */
  href?: string;
};

function GrantMark() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden="true">
      <circle cx="10" cy="7.6" r="4.6" />
      <path d="M7.2 11.4 5.9 17l4.1-2 4.1 2-1.3-5.6" strokeLinejoin="round" />
      <path d="M10 5.6v4M8.7 6.6h2.6" strokeLinecap="round" />
    </svg>
  );
}

function HonourMark() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden="true">
      <path
        d="M10 2.6l2.1 4.3 4.7.7-3.4 3.3.8 4.7-4.2-2.2-4.2 2.2.8-4.7L3.2 7.6l4.7-.7z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowMark() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10" />
    </svg>
  );
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * The awards and grants, as a list rather than a table.
 *
 * A CV sets these in two hard columns, which works on paper because the eye
 * scans down a fixed page. On screen the column widths fight the longest title
 * and the shortest date, so this keeps the title and its mark on the left and
 * lets the money and the date sit as their own small marks — readable at a
 * glance, and it reflows on a narrow window instead of squashing.
 *
 * A row is only a link when it has somewhere to go. Rows without an `href`
 * render as plain list items, with no hover affordance promising a page that
 * isn't there.
 */
export default function AwardsList({ awards }: { awards: Award[] }) {
  return (
    <ul className="flex w-full flex-col">
      {awards.map((award, i) => {
        const body = (
          <>
            {/* the mark: filled for funding, outlined for an honour */}
            <span
              className={`mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full border transition-colors ${
                award.kind === "grant"
                  ? "border-zinc-300 text-zinc-500 group-hover:border-zinc-400 group-hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:group-hover:border-zinc-500 dark:group-hover:text-zinc-200"
                  : "border-amber-300/70 text-amber-600/80 group-hover:border-amber-400 group-hover:text-amber-600 dark:border-amber-500/40 dark:text-amber-400/80 dark:group-hover:border-amber-400/70 dark:group-hover:text-amber-300"
              }`}
            >
              <span className="h-[18px] w-[18px]">
                {award.kind === "grant" ? <GrantMark /> : <HonourMark />}
              </span>
            </span>

            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="text-[15px] font-medium leading-snug text-zinc-800 dark:text-zinc-100">
                  {award.title}
                </span>
                {award.note && (
                  <span className="text-[13px] leading-snug text-zinc-500 dark:text-zinc-500">
                    {award.note}
                  </span>
                )}
                {award.href && (
                  <span className="text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-500">
                    <ArrowMark />
                  </span>
                )}
              </span>

              <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                {award.amount !== undefined && (
                  <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-[11px] font-medium tabular-nums tracking-wide text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                    {money.format(award.amount)}
                  </span>
                )}
                <span className="text-[12px] tabular-nums tracking-wide text-zinc-500 dark:text-zinc-500">
                  {award.period}
                </span>
              </span>
            </span>
          </>
        );

        const shared =
          "group flex gap-4 py-5 transition-colors hover:bg-zinc-100/60 dark:hover:bg-zinc-900/50 -mx-4 px-4 rounded-lg";

        return (
          <li
            key={i}
            className={`${css.row}${
              i > 0 ? " border-t border-zinc-200/80 dark:border-zinc-800/80" : ""
            }`}
            style={{ "--delay": `${i * STAGGER}ms` } as React.CSSProperties}
          >
            {award.href ? (
              <a
                href={award.href}
                target="_blank"
                rel="noreferrer noopener"
                className={shared}
              >
                {body}
              </a>
            ) : (
              <div className={shared}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
