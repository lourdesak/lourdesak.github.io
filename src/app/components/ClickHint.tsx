/**
 * A brief "click here" nudge: a hand tapping over a soft gold ring, the same
 * kind of gesture hint mobile onboarding flows use to teach a tap before the
 * user has to guess it. See SimulationDetail for when this is shown — once,
 * the first time anyone hovers the site's very first project.
 */
export default function ClickHint() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
    >
      <span className="relative flex h-14 w-14 items-center justify-center">
        <span
          className="absolute h-9 w-9 rounded-full bg-[#c9b100]/50"
          style={{ animation: "hand-hint-ripple 1.6s ease-out infinite" }}
        />
        <span
          className="text-[30px] leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
          style={{ animation: "hand-hint-tap 1.6s ease-in-out infinite" }}
        >
          👆
        </span>
      </span>
    </div>
  );
}
