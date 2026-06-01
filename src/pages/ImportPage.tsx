import { useMemo, useState } from "react";
import type { Sticker } from "../types/sticker";
import { EmptyState } from "../components/EmptyState";
import { ImportTextarea } from "../components/ImportTextarea";
import { parseMissingStickers } from "../lib/parser";

type ImportPageProps = {
  stickerCount: number;
  onImport: (stickers: Sticker[]) => void;
};

const SAMPLE_TEXT = `-- Especiales missing
FWC 1
FWC 3
FWC 4

-- PAISES MISSING
PAN 01
PAN 04
PAN 07`;

export function ImportPage({ stickerCount, onImport }: ImportPageProps) {
  const [draft, setDraft] = useState(SAMPLE_TEXT);
  const [pendingImport, setPendingImport] = useState<Sticker[] | null>(null);

  const preview = useMemo(() => parseMissingStickers(draft), [draft]);
  const parsedCount = preview.length;

  function handleImportClick() {
    if (parsedCount === 0) {
      return;
    }

    if (stickerCount > 0) {
      setPendingImport(preview);
      return;
    }

    onImport(preview);
  }

  function confirmReplace() {
    if (!pendingImport) {
      return;
    }

    onImport(pendingImport);
    setPendingImport(null);
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[30px] font-black tracking-tight text-ink">Importar</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Pegá un listado en texto plano para reemplazar tu dataset local.
        </p>
      </header>

      <ImportTextarea
        value={draft}
        onChange={setDraft}
        previewCount={parsedCount}
        onImport={handleImportClick}
        disabled={parsedCount === 0}
      />

      {parsedCount === 0 ? (
        <EmptyState
          title="No detectamos figuritas"
          description="Revisá el formato. Cada sticker debe ir en su propia línea."
        />
      ) : null}

      {pendingImport ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 px-4 pb-4 pt-16 backdrop-blur-sm">
          <div className="w-full max-w-[440px] rounded-[28px] border border-line bg-white p-5 shadow-float">
            <h2 className="text-xl font-extrabold text-ink">Reemplazar lista actual</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Vas a reemplazar las {stickerCount} figuritas actuales por {pendingImport.length} nuevas.
            </p>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingImport(null)}
                className="flex-1 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmReplace}
                className="flex-1 rounded-2xl bg-primary-700 px-4 py-3 text-sm font-bold text-white shadow-float transition hover:bg-primary-800"
              >
                Reemplazar lista actual
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
