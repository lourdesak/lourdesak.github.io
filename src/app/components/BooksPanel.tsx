"use client";

import { useState } from "react";

export type Book = {
  title: string;
  author: string;
  description: string;
};

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// A book cover placeholder: soft gradient slab with a spine edge and the
// title set into it, standing in until real cover art is dropped in.
function BookCover({ title }: { title: string }) {
  return (
    <div className="relative h-56 w-40 flex-none overflow-hidden rounded-md border border-zinc-300/70 shadow-lg dark:border-zinc-700/60">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-400 dark:from-zinc-700 dark:via-zinc-800 dark:to-zinc-950" />
      <div className="absolute inset-y-0 left-0 w-2 bg-black/10 dark:bg-black/30" />
      <div className="absolute inset-y-0 left-2 w-px bg-white/40 dark:bg-white/10" />
      <div className="absolute inset-0 flex items-center justify-center p-5">
        <p className="text-center text-sm font-medium leading-snug text-zinc-700 dark:text-zinc-200">
          {title}
        </p>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10" />
    </div>
  );
}

// Full-bleed shelf panel beneath the mosaic: one book at a time, its
// description alongside, cycled with the prev/next controls. Breaks out of
// the page's max-w-4xl column with the left-1/2 + -50vw trick so it always
// spans edge to edge, regardless of ancestor padding.
export default function BooksPanel({ books }: { books: Book[] }) {
  const [index, setIndex] = useState(0);
  if (books.length === 0) return null;
  const book = books[index];

  const go = (delta: number) =>
    setIndex((i) => (i + delta + books.length) % books.length);

  return (
    <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2">
      <div className="relative overflow-hidden border-y border-zinc-200/70 bg-gradient-to-r from-zinc-100/80 via-white/70 to-zinc-100/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)] backdrop-blur-md dark:border-zinc-800/70 dark:from-zinc-900/70 dark:via-zinc-950/60 dark:to-zinc-900/70 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="mx-auto flex max-w-4xl items-center gap-6 px-6 py-12">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous book"
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-zinc-300 text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
          >
            <ChevronIcon direction="left" />
          </button>

          <div key={index} className="flex flex-1 animate-[fade-in_400ms_ease-out] items-center gap-8">
            <BookCover title={book.title} />
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                  {index + 1} of {books.length}
                </p>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {book.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{book.author}</p>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {book.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next book"
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-zinc-300 text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
          >
            <ChevronIcon direction="right" />
          </button>
        </div>
      </div>
    </div>
  );
}
