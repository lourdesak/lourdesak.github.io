"use client";

/**
 * The location mark beside the name.
 *
 * At rest it is a quiet gold outline — a map pin whose head holds a tiny wire
 * globe, the same wireframe the collision field on this page is drawn from, so
 * it belongs to the scene rather than sitting on top of it. Nothing moves and
 * nothing loops; it just waits to be pressed.
 *
 * When the journey is opened (`active`) the mark strikes: it drops onto its
 * point with a small squash, the head fills with a wash of gold, the globe
 * brightens and a single ring pings outward. Closing it settles everything
 * back to the resting outline.
 */
export default function NamePin({ active = false }: { active?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-[3px] block shrink-0 text-[#8a7a00] transition-opacity duration-300 dark:text-[#c9a227] ${
        active ? "opacity-100" : "opacity-60 group-hover:opacity-90"
      }`}
    >
      <svg width="22" height="27" viewBox="0 0 24 30" fill="none">
        <g
          className={
            active
              ? "[animation:journey-pin-drop_560ms_cubic-bezier(.2,.8,.3,1.25)_both]"
              : ""
          }
          style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
        >
          {/* wash of gold behind the head, only once it is struck */}
          <circle
            cx="12"
            cy="10"
            r="8.5"
            className={`fill-current transition-opacity duration-500 ${
              active ? "opacity-[0.14]" : "opacity-0"
            }`}
          />

          {/* the ground it stands on */}
          <ellipse
            cx="12"
            cy="27.4"
            rx={active ? 5 : 3.8}
            ry="1.5"
            className="fill-current opacity-20 transition-all duration-300"
          />

          {/* the teardrop */}
          <path
            d="M12 27C9.1 20 5 15.6 5 10a7 7 0 0 1 14 0c0 5.6-4.1 10-7 17Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
            className={`transition-[fill-opacity] duration-500 ${
              active ? "fill-current [fill-opacity:0.16]" : "fill-transparent [fill-opacity:0]"
            }`}
          />

          {/* the wire globe held in the head */}
          <g
            stroke="currentColor"
            strokeLinecap="round"
            className={`transition-opacity duration-500 ${active ? "opacity-100" : "opacity-75"}`}
          >
            <circle cx="12" cy="10" r="3.4" strokeWidth="1.1" />
            <ellipse cx="12" cy="10" rx="3.4" ry="1.35" strokeWidth="0.85" className="opacity-70" />
            <ellipse cx="12" cy="10" rx="1.35" ry="3.4" strokeWidth="0.85" className="opacity-70" />
          </g>

          {/* one-shot ring the moment it lands */}
          {active && (
            <circle cx="12" cy="10" r="4" fill="none" stroke="currentColor" strokeWidth="1">
              <animate attributeName="r" from="4" to="14" dur="640ms" fill="freeze" />
              <animate attributeName="opacity" from="0.6" to="0" dur="640ms" fill="freeze" />
            </circle>
          )}
        </g>
      </svg>
    </span>
  );
}
