import type { Sticker } from "../types/sticker";
import { EmptyState } from "../components/EmptyState";
import { StatsCard } from "../components/StatsCard";
import { percentage } from "../lib/formatters";

type SummaryPageProps = {
  stickers: Sticker[];
  onShare: () => void;
};

export function SummaryPage({ stickers, onShare }: SummaryPageProps) {
  const total = stickers.length;
  const missing = stickers.filter((sticker) => sticker.status === "missing");
  const owned = stickers.filter((sticker) => sticker.status === "owned");
  const progress = percentage(owned.length, total);

  const groupedCounts = missing.reduce<Record<string, number>>((accumulator, sticker) => {
    const label =
      sticker.groupType === "special"
        ? sticker.groupLabel
        : sticker.countryName ?? sticker.prefix;
    accumulator[label] = (accumulator[label] ?? 0) + 1;
    return accumulator;
  }, {});

  const sortedGroups = Object.entries(groupedCounts).sort((left, right) => right[1] - left[1]);

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-black tracking-tight text-ink">Resumen</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Estado general del dataset cargado.</p>
        </div>
        <button
          type="button"
          onClick={onShare}
          className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink shadow-soft transition hover:bg-slate-50"
        >
          Compartir faltantes
        </button>
      </header>

      {total === 0 ? (
        <EmptyState
          title="Todavía no cargaste tu lista"
          description="Importá tus figuritas faltantes para empezar."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatsCard label="Faltan" value={missing.length} />
            <StatsCard label="Conseguidas" value={owned.length} />
            <StatsCard label="Total cargadas" value={total} />
            <StatsCard label="Completado" value={progress} />
          </div>

          <section className="rounded-[28px] border border-line bg-white p-4 shadow-soft">
            <h2 className="text-lg font-extrabold text-ink">Faltantes por grupo</h2>
            <div className="mt-4 space-y-3">
              {sortedGroups.length > 0 ? (
                sortedGroups.map(([label, count]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <span className="font-semibold text-ink">{label}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-primary-700">
                      faltan {count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No quedan stickers pendientes.</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
