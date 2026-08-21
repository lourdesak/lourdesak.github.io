/**
 * A hairline rule with a gap held open in the middle, sized to take an icon.
 *
 * The two halves fade out toward the outer ends rather than stopping dead, so
 * the rule reads as a piece of trim rather than a hard divider — and the gap
 * stays empty and correctly sized whether or not anything is dropped into it.
 */
export default function GappedRule({
  children,
  gap = 28,
  className,
}: {
  /** the icon, if there is one yet */
  children?: React.ReactNode;
  /** width and height of the space held open, in px */
  gap?: number;
  className?: string;
}) {
  return (
    <div className={`flex w-full items-center ${className ?? ""}`} role="presentation">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-300 dark:to-zinc-700" />
      <span
        className="flex flex-none items-center justify-center text-zinc-400 dark:text-zinc-600"
        style={{ width: gap, height: gap }}
      >
        {children}
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-300 dark:to-zinc-700" />
    </div>
  );
}
