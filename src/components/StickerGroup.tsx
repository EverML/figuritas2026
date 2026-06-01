import type { Sticker } from "../types/sticker";
import { StickerCard } from "./StickerCard";

type StickerGroupProps = {
  title: string;
  count: number;
  stickers: Sticker[];
  pendingStickerId?: string | null;
  onStickerClick: (sticker: Sticker) => void;
};

export function StickerGroup({
  title,
  count,
  stickers,
  pendingStickerId,
  onStickerClick,
}: StickerGroupProps) {
  return (
    <section className="rounded-[28px] border border-line bg-white p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-extrabold leading-tight text-ink">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{count} faltantes</p>
        </div>
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-primary-50 px-3 text-sm font-bold text-primary-700">
          {count}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {stickers.map((sticker) => (
          <StickerCard
            key={sticker.id}
            sticker={sticker}
            isPending={pendingStickerId === sticker.id}
            onClick={onStickerClick}
          />
        ))}
      </div>
    </section>
  );
}
