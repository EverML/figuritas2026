import { useEffect, useMemo, useState } from "react";
import type { Sticker } from "./types/sticker";
import { AppShell } from "./components/AppShell";
import { BottomNav, type TabKey } from "./components/BottomNav";
import { MissingPage } from "./pages/MissingPage";
import { QuickSearchPage } from "./pages/QuickSearchPage";
import { SummaryPage } from "./pages/SummaryPage";
import { ImportPage } from "./pages/ImportPage";
import { Toast, type ToastState } from "./components/Toast";
import {
  clearSyncCode,
  loadStickers,
  loadSyncCode,
  saveStickers,
  saveSyncCode,
} from "./lib/storage";
import { INITIAL_DATASET } from "./lib/seed";
import { parseMissingStickers } from "./lib/parser";
import { formatStickerCode } from "./lib/formatters";
import { fetchRemoteStickers, getSyncEndpoint, replaceRemoteStickers } from "./lib/sync";

type FilterKey = "all" | "special" | "country";
type SyncState = "idle" | "syncing" | "synced" | "error";

function seedStickers(): Sticker[] {
  const seed = parseMissingStickers(INITIAL_DATASET);
  return seed;
}

function sortStickersById(items: Sticker[]): Sticker[] {
  return [...items].sort((left, right) => left.id.localeCompare(right.id));
}

function stickerSignature(items: Sticker[]): string {
  return sortStickersById(items)
    .map((sticker) => `${sticker.id}:${sticker.status}:${sticker.updatedAt}`)
    .join("|");
}

export default function App() {
  const [stickers, setStickers] = useState<Sticker[]>(() => {
    const stored = loadStickers();
    return stored.length > 0 ? stored : seedStickers();
  });
  const [syncCode, setSyncCode] = useState<string>(() => loadSyncCode());
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [syncDirty, setSyncDirty] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("missing");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    saveStickers(stickers);
  }, [stickers]);

  useEffect(() => {
    saveSyncCode(syncCode);
  }, [syncCode]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!syncCode) {
      setSyncState("idle");
      return;
    }

    let alive = true;

    async function synchronize() {
      setSyncState("syncing");

      try {
        if (syncDirty) {
          const pushed = await replaceRemoteStickers(syncCode, stickers);
          if (!alive) {
            return;
          }

          setStickers(pushed);
          setSyncDirty(false);
          setLastSyncAt(new Date().toISOString());
          setSyncState("synced");
          return;
        }

        const remote = await fetchRemoteStickers(syncCode);
        if (!alive) {
          return;
        }

        if (remote.length === 0 && stickers.length > 0) {
          const pushed = await replaceRemoteStickers(syncCode, stickers);
          if (!alive) {
            return;
          }

          setStickers(pushed);
        } else if (stickerSignature(remote) !== stickerSignature(stickers)) {
          setStickers(remote);
        }

        setLastSyncAt(new Date().toISOString());
        setSyncState("synced");
      } catch {
        if (!alive) {
          return;
        }

        setSyncState("error");
      }
    }

    void synchronize();
    const interval = window.setInterval(() => {
      void synchronize();
    }, 15000);

    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [stickers, syncCode, syncDirty]);

  const missingCount = useMemo(
    () => stickers.filter((sticker) => sticker.status === "missing").length,
    [stickers],
  );

  const shareText = useMemo(() => {
    const missing = stickers.filter((sticker) => sticker.status === "missing");
    if (missing.length === 0) {
      return "Álbum completo\nNo me faltan figuritas.";
    }

    const grouped = missing.reduce<Record<string, Sticker[]>>((accumulator, sticker) => {
      const key = sticker.groupType === "country" ? sticker.countryName ?? sticker.prefix : sticker.groupLabel;
      accumulator[key] = accumulator[key] ?? [];
      accumulator[key].push(sticker);
      return accumulator;
    }, {});

    const sections = Object.entries(grouped)
      .map(([label, items]) => {
        const lines = items.map((sticker) => formatStickerCode(sticker.prefix, sticker.number));
        return `${label}:\n${lines.join("\n")}`;
      })
      .join("\n\n");

    return `Me faltan estas figuritas:\n\n${sections}`;
  }, [stickers]);

  function updateSticker(nextSticker: Sticker) {
    setStickers((current) =>
      current.map((sticker) =>
        sticker.id === nextSticker.id
          ? {
              ...sticker,
              status: nextSticker.status,
              updatedAt: new Date().toISOString(),
            }
          : sticker,
      ),
    );
  }

  function handleStickerClick(sticker: Sticker) {
    const nextStatus = sticker.status === "missing" ? "owned" : "missing";
    const updatedSticker: Sticker = {
      ...sticker,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    setSyncDirty(true);
    updateSticker(updatedSticker);
    setToast({
      message:
        nextStatus === "owned"
          ? `${formatStickerCode(sticker.prefix, sticker.number)} marcada como conseguida`
          : `${formatStickerCode(sticker.prefix, sticker.number)} marcada como faltante`,
      actionLabel: "Deshacer",
      onAction: () => {
        setSyncDirty(true);
        updateSticker({
          ...sticker,
          status: sticker.status,
          updatedAt: new Date().toISOString(),
        });
        setToast(null);
      },
    });

  }

  function handleShare() {
    void (async () => {
      try {
        if (navigator.share) {
          await navigator.share({ text: shareText });
          return;
        }

        await navigator.clipboard.writeText(shareText);
        setToast({
          message: "Lista copiada al portapapeles",
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setToast({
          message: "No se pudo compartir la lista",
        });
      }
    })();
  }

  function handleImport(nextStickers: Sticker[]) {
    setSyncDirty(true);
    setStickers(nextStickers);
    setSearchQuery("");
    setFilter("all");
    setActiveTab("missing");
    setToast({
      message: `Importaste ${nextStickers.length} figuritas`,
    });

  }

  function handleSaveSyncCode(nextCode: string) {
    const trimmed = nextCode.trim();
    if (trimmed && !/^\d{8}$/.test(trimmed)) {
      setToast({
        message: "El código de sincronización debe tener exactamente 8 dígitos",
      });
      return;
    }

    setSyncCode(trimmed);
    setSyncDirty(false);
    setToast({
      message: trimmed ? "Código de sincronización guardado" : "Sincronización local solamente",
    });
  }

  function handleClearSyncCode() {
    clearSyncCode();
    setSyncCode("");
    setSyncDirty(false);
    setSyncState("idle");
    setToast({
      message: "Sincronización desactivada",
    });
  }

  function handleSyncNow() {
    if (!syncCode) {
      setToast({
        message: "Primero guardá un código de sincronización",
      });
      return;
    }

    setSyncState("syncing");

    void (async () => {
      try {
        if (syncDirty) {
          const pushed = await replaceRemoteStickers(syncCode, stickers);
          setStickers(pushed);
          setSyncDirty(false);
        } else {
          const remote = await fetchRemoteStickers(syncCode);
          if (remote.length === 0 && stickers.length > 0) {
            const pushed = await replaceRemoteStickers(syncCode, stickers);
            setStickers(pushed);
          } else if (stickerSignature(remote) !== stickerSignature(stickers)) {
            setStickers(remote);
          }
        }

        setLastSyncAt(new Date().toISOString());
        setSyncState("synced");
        setToast({
          message: "Sincronización actualizada",
        });
      } catch {
        setSyncState("error");
        setToast({
          message: "No se pudo sincronizar",
        });
      }
    })();
  }

  return (
    <AppShell footer={<BottomNav activeTab={activeTab} onChange={setActiveTab} />}>
      <div className="space-y-4">
        {activeTab === "missing" ? (
          <MissingPage
            stickers={stickers}
            search={searchQuery}
            setSearch={setSearchQuery}
            filter={filter}
            setFilter={setFilter}
            onStickerClick={handleStickerClick}
            onShare={handleShare}
            syncState={syncState}
            lastSyncAt={lastSyncAt}
          />
        ) : null}

        {activeTab === "search" ? (
          <QuickSearchPage
            stickers={stickers}
            query={searchQuery}
            setQuery={setSearchQuery}
            onStickerClick={handleStickerClick}
          />
        ) : null}

        {activeTab === "summary" ? (
          <SummaryPage stickers={stickers} onShare={handleShare} />
        ) : null}

        {activeTab === "import" ? (
          <ImportPage
            stickerCount={stickers.length}
            onImport={handleImport}
            syncCode={syncCode}
            syncState={syncState}
            lastSyncAt={lastSyncAt}
            syncEndpoint={getSyncEndpoint()}
            onSaveSyncCode={handleSaveSyncCode}
            onClearSyncCode={handleClearSyncCode}
            onSyncNow={handleSyncNow}
          />
        ) : null}
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="sr-only" aria-live="polite">
        {missingCount} faltantes
      </div>
    </AppShell>
  );
}
