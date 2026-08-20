type SquareItem = {
  label: string;
  description?: string;
  content?: React.ReactNode;
  offsetTop?: number;
};

type SquareGridProps = {
  items: SquareItem[];
  cardWidth?: number;
  cardHeight?: number;
  columns?: number;
};

export default function SquareGrid({
  items,
  cardWidth = 202,
  cardHeight = 202,
  columns = 2,
}: SquareGridProps) {
  return (
    <div
      className="grid gap-6"
      style={{ gridTemplateColumns: `repeat(${columns}, ${cardWidth}px)` }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="group relative flex flex-col gap-3"
          style={{ width: cardWidth, top: item.offsetTop }}
        >
          <p className="origin-left mb-3 text-base font-medium text-white-800 transition-transform duration-300 ease-out group-hover:scale-110 dark:text-white-400">
            {item.label}
          </p>
          <div
            className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            style={{ width: cardWidth, height: cardHeight }}
          >
            {item.content}
          </div>
          {item.description && (
            <p className="line-clamp-2 h-10 text-sm leading-snug text-white opacity-0 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:text-blue-400">
              {item.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
