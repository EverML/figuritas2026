import type { Sticker } from "../types/sticker";

type StickerCardProps = {
  sticker: Sticker;
  isPending?: boolean;
  onClick: (sticker: Sticker) => void;
};

export function StickerCard({ sticker, isPending = false, onClick }: StickerCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(sticker)}
      aria-pressed={isPending}
      className={[
        "group flex min-h-[96px] flex-col items-center justify-center rounded-3xl border px-3 py-4 text-center shadow-soft transition hover:-translate-y-0.5 hover:shadow-float active:translate-y-0",
        isPending ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200" : "border-line bg-white",
      ].join(" ")}
    >
      <span className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-500">
        {sticker.prefix}
      </span>
      <span className="mt-1 text-[28px] font-extrabold leading-none text-ink">
        {sticker.number}
      </span>
      <span className="mt-2 text-[11px] font-semibold text-slate-400 group-hover:text-primary-700">
        {isPending ? "Tocar otra vez para confirmar" : "Tocar para marcar"}
      </span>
    </button>
  );
}
