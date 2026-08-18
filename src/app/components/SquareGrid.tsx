type SquareItem = {
  label: string;
  description?: string;
  content?: React.ReactNode;
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
          className="group flex flex-col gap-3"
          style={{ width: cardWidth }}
        >
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {item.label}
          </p>
          <div
            className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            style={{ width: cardWidth, height: cardHeight }}
          >
            {item.content}
          </div>
          {item.description && (
            <p className="line-clamp-2 h-10 text-sm leading-snug text-white transition-colors duration-300 group-hover:text-blue-400">
              {item.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
