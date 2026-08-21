import PageShell from "../components/PageShell";
import AwardsList, { type Award } from "../components/AwardsList";

/**
 * Taken from the CV, in the same order.
 *
 * `href` is left off every entry deliberately: the row only becomes a link once
 * there is a real page to send people to, and guessing at institutional URLs
 * would mean shipping links that may well 404. Fill one in and that row starts
 * behaving as a link on its own.
 */
const AWARDS: Award[] = [
  {
    title: "Drexel Grant",
    amount: 23600,
    fund: "scholarship",
    period: "Sep. 2022 – Jun. 2026",
    kind: "grant",
  },
  {
    title: "Founder's Scholarship",
    amount: 26000,
    fund: "scholarship",
    period: "Sep. 2022 – Jun. 2026",
    kind: "grant",
  },
  {
    title: "Research Fellowship Supplement Program",
    amount: 4000,
    fund: "research",
    period: "Jun. 2025 – Sep. 2025",
    kind: "grant",
  },
  {
    title: "Arts & Sciences Undergraduate Research Fund",
    note: "ASURS",
    amount: 1500,
    fund: "research",
    period: "Oct. 2024",
    kind: "grant",
  },
  {
    title: "The Susan and Donald Larson Endowed Scholarship Fund",
    amount: 335,
    fund: "research",
    period: "May 2023",
    kind: "grant",
  },
  {
    title: "Students Tackling Advanced Research Program",
    note: "STAR",
    amount: 3500,
    fund: "research",
    period: "Jun. 2023 – Sep. 2023",
    kind: "grant",
  },
  {
    title: "SuperNova Undergraduate Research Fellow",
    note: "Academic Distinction noted on transcript at graduation",
    period: "Aug. 2025",
    kind: "honour",
  },
  {
    title: "Best Poster by an Undergraduate Student",
    note: "CoAS Research Day",
    period: "May 2025",
    kind: "honour",
  },
  {
    title: "Build Relationships in Diverse Group Experiences Scholar",
    note: "BRIDGE",
    period: "Sep. 2022 – Jun. 2026",
    kind: "honour",
  },
];

const total = (fund: "research" | "scholarship") =>
  AWARDS.filter((a) => a.fund === fund).reduce((sum, a) => sum + (a.amount ?? 0), 0);

const cash = (n: number) => `$${n.toLocaleString("en-US")}`;

export default function AwardsPage() {
  const research = total("research");
  const scholarship = total("scholarship");

  return (
    <PageShell title="Awards">
      <div className="flex w-full flex-col gap-8 pb-24">
        <p className="mt-6 whitespace-nowrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Research funding and honours, {AWARDS.length} in all — including{" "}
          <span className="tabular-nums text-[#8a7a00]">{cash(research)}</span>{" "}
          in awarded research support
          {scholarship > 0 && (
            <>
              {" "}and{" "}
              <span className="tabular-nums text-[#8a7a00]">{cash(scholarship)}</span>{" "}
              in scholarship
            </>
          )}
          .
        </p>
        <AwardsList awards={AWARDS} />
      </div>
    </PageShell>
  );
}
