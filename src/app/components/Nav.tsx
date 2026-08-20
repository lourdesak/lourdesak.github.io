"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Lourdes", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Writing", href: "/writing" },
  { label: "Funding", href: "/funding" },
  { label: "Hobbies", href: "/hobbies" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <>
      {/* Full-width mask so scrolling content is entirely hidden once it
          reaches the tab bar's row, not just clipped by the pill's own
          bounds. Background matches every page's own bg-zinc-50/black. */}
      <div className="fixed inset-x-0 top-0 z-40 h-20 bg-zinc-50/95 backdrop-blur dark:bg-black/95" />
      <nav className="fixed left-6 top-6 z-50">
        <ul className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white/90 px-1.5 py-1.5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
          {TABS.map((tab) => {
            const isActive =
              tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={`block rounded-full px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "bg-white text-zinc-900 ring-2 ring-blue-300 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-blue-500/60"
                      : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  }`}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
