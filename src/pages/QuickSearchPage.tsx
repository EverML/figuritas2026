import { useDeferredValue, useMemo, type ReactNode } from "react";
import type { Sticker } from "../types/sticker";
import { EmptyState } from "../components/EmptyState";
import { SearchBar } from "../components/SearchBar";
import { normalizeStickerNumber } from "../lib/stickers";
import { parseSearchQuery } from "../lib/parser";
import { formatStickerCode } from "../lib/formatters";

type QuickSearchPageProps = {
  stickers: Sticker[];
  query: string;
  setQuery: (value: string) => void;
  pendingStickerId: string | null;
  onStickerClick: (sticker: Sticker) => void;
};

export function QuickSearchPage({
  stickers,
  query,
  setQuery,
  pendingStickerId,
  onStickerClick,
}: QuickSearchPageProps) {
  const deferredQuery = useDeferredValue(query);
  const parsed = parseSearchQuery(deferredQuery);
  const normalized = parsed.compact;

  const matches = useMemo(() => {
    if (!normalized) {
      return [];
    }

    return stickers.filter((sticker) => {
      const code = sticker.code.toUpperCase().replace(/\s+/g, "");
      const prefix = sticker.prefix.toUpperCase();
      const number = normalizeStickerNumber(sticker.number);

      if (parsed.prefix && parsed.number) {
        return code === normalized;
      }

      if (parsed.number && !parsed.prefix) {
        return number === normalizeStickerNumber(parsed.number);
      }

      if (parsed.prefix && !parsed.number) {
        return prefix.includes(parsed.prefix);
      }

      return code.includes(normalized) || prefix.includes(normalized);
    });
  }, [normalized, parsed.number, parsed.prefix, stickers]);

  const missingMatches = matches.filter((sticker) => sticker.status === "missing");
  const ownedMatches = matches.filter((sticker) => sticker.status === "owned");

  const primaryMatch = missingMatches[0] ?? ownedMatches[0] ?? null;

  let statusTitle = "Buscá por código o país";
  let statusDescription = "Escribí PAN 07, PAN07, PAN, 07 o FWC.";
  let action: ReactNode = null;

  if (normalized) {
    if (missingMatches.length > 0) {
      statusTitle = missingMatches.length === 1 ? "Te falta esta figurita" : "Te faltan estas figuritas";
      statusDescription =
        missingMatches.length === 1
          ? `${missingMatches[0].code} está pendiente en tu lista.`
          : `${missingMatches.length} coincidencias siguen pendientes.`;
      if (missingMatches.length === 1) {
        action = (
          <button
            type="button"
            onClick={() => onStickerClick(missingMatches[0])}
            className="rounded-2xl bg-primary-700 px-4 py-3 text-sm font-bold text-white shadow-float transition hover:bg-primary-800"
          >
            {pendingStickerId === missingMatches[0].id ? "Confirmar cambio" : "Marcar como conseguida"}
          </button>
        );
      }
    } else if (ownedMatches.length > 0) {
      statusTitle = "Ya la tenés";
      statusDescription = `${ownedMatches[0].code} ya está marcada como conseguida.`;
    } else {
      statusTitle = "No está en tu lista de faltantes";
      statusDescription = "Probá con otro código o importá una lista nueva.";
    }
  }

  return (
    <div className="space-y-4">
      <header className="space-y-3">
        <div>
          <h1 className="text-[30px] font-black tracking-tight text-ink">Buscar</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Resultado instantáneo mientras escribís.
          </p>
        </div>
        <SearchBar value={query} onChange={setQuery} placeholder="PAN 07, PAN07, PAN, 07..." />
      </header>

      {!normalized ? (
        <EmptyState
          title={statusTitle}
          description={statusDescription}
        />
      ) : null}

      {normalized ? (
        <div className="space-y-4">
          <div className="rounded-[28px] border border-line bg-white p-5 shadow-soft">
            <p className="text-sm font-semibold text-slate-500">Resultado</p>
            <h2 className="mt-2 text-2xl font-extrabold text-ink">{statusTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{statusDescription}</p>
            {action ? <div className="mt-4">{action}</div> : null}
          </div>

          {matches.length > 1 ? (
            <div className="space-y-3">
              <p className="px-1 text-sm font-semibold text-slate-500">
                Coincidencias: {matches.length}
              </p>
              {matches.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => onStickerClick(sticker)}
                  aria-pressed={pendingStickerId === sticker.id}
                  className={[
                    "flex w-full items-center justify-between rounded-[24px] border px-4 py-4 text-left shadow-soft transition hover:bg-slate-50",
                    pendingStickerId === sticker.id ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200" : "border-line bg-white",
                  ].join(" ")}
                >
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                      {sticker.groupType === "country" ? sticker.countryName ?? sticker.prefix : sticker.groupLabel}
                    </p>
                    <p className="mt-1 text-lg font-extrabold text-ink">{formatStickerCode(sticker.prefix, sticker.number)}</p>
                  </div>
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-bold",
                      sticker.status === "missing"
                        ? "bg-warning-50 text-warning-600"
                        : "bg-success-50 text-success-600",
                    ].join(" ")}
                  >
                    {sticker.status === "missing" ? "Falta" : "Conseguida"}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {primaryMatch ? (
        <div className="rounded-[28px] border border-line bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold text-slate-500">Código resaltado</p>
          <p className="mt-2 text-3xl font-black text-ink">{formatStickerCode(primaryMatch.prefix, primaryMatch.number)}</p>
          <p className="mt-2 text-sm text-slate-500">
            {primaryMatch.groupType === "country" ? primaryMatch.countryName ?? primaryMatch.prefix : primaryMatch.groupLabel}
          </p>
        </div>
      ) : null}
    </div>
  );
}
