import { useEffect, useMemo, useState } from "react";
import type { Sticker } from "../types/sticker";
import { EmptyState } from "../components/EmptyState";
import { ImportTextarea } from "../components/ImportTextarea";
import { parseMissingStickers } from "../lib/parser";

type ImportPageProps = {
  stickerCount: number;
  onImport: (stickers: Sticker[]) => void;
  syncCode: string;
  syncState: "idle" | "syncing" | "synced" | "error";
  lastSyncAt: string | null;
  syncEndpoint: string;
  onSaveSyncCode: (syncCode: string) => void;
  onClearSyncCode: () => void;
  onSyncNow: () => void;
};

const SAMPLE_TEXT = `-- Especiales missing
FWC 1
FWC 3
FWC 4

-- PAISES MISSING
PAN 01
PAN 04
PAN 07`;

export function ImportPage({
  stickerCount,
  onImport,
  syncCode,
  syncState,
  lastSyncAt,
  syncEndpoint,
  onSaveSyncCode,
  onClearSyncCode,
  onSyncNow,
}: ImportPageProps) {
  const [draft, setDraft] = useState(SAMPLE_TEXT);
  const [pendingImport, setPendingImport] = useState<Sticker[] | null>(null);
  const [syncDraft, setSyncDraft] = useState(syncCode);

  const preview = useMemo(() => parseMissingStickers(draft), [draft]);
  const parsedCount = preview.length;

  useEffect(() => {
    setSyncDraft(syncCode);
  }, [syncCode]);

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

  function handleSaveSyncCode() {
    onSaveSyncCode(syncDraft);
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[30px] font-black tracking-tight text-ink">Importar</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Pegá un listado en texto plano para reemplazar tu dataset local.
        </p>
      </header>

      <section className="rounded-[28px] border border-line bg-white p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-ink">Sincronización</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Conectá este dispositivo con el mismo código secreto de 8 dígitos para compartir el estado.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            {syncState === "syncing" ? "Sync..." : syncCode ? "Conectado" : "Local"}
          </span>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Código secreto</span>
          <input
            value={syncDraft}
            onChange={(event) => setSyncDraft(event.target.value)}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            placeholder="01234567"
            className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-base font-semibold text-ink outline-none transition focus:border-primary-600"
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSaveSyncCode}
            className="rounded-2xl bg-primary-700 px-4 py-3 text-sm font-bold text-white shadow-float transition hover:bg-primary-800"
          >
            Guardar código
          </button>
          <button
            type="button"
            onClick={onSyncNow}
            disabled={!syncCode || syncState === "syncing"}
            className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sincronizar ahora
          </button>
          <button
            type="button"
            onClick={onClearSyncCode}
            disabled={!syncCode}
            className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Desconectar
          </button>
        </div>

        <div className="mt-3 space-y-1 text-xs font-medium text-slate-500">
          <p>{syncEndpoint}</p>
          <p>{lastSyncAt ? `Última sync: ${new Date(lastSyncAt).toLocaleString("es-AR")}` : "Todavía no sincronizó"}</p>
        </div>
      </section>

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
