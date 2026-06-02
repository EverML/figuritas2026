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
import { resolveCountryName } from "./lib/countries";
import { buildStickerCode, buildStickerId } from "./lib/stickers";
import {
  fetchRemoteStickers,
  getSyncEndpoint,
  replaceRemoteStickers,
  setRemoteStickerStatus,
  StickerConflictError,
} from "./lib/sync";

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
  const [pendingStickerId, setPendingStickerId] = useState<string | null>(null);
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
    if (!pendingStickerId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setPendingStickerId(null);
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [pendingStickerId]);

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
              updatedAt: nextSticker.updatedAt,
            }
          : sticker,
      ),
    );
  }

  function showStickerUpdatedToast(sticker: Sticker, nextStatus: Sticker["status"], previousSticker: Sticker) {
    setToast({
      message:
        nextStatus === "owned"
          ? `${formatStickerCode(sticker.prefix, sticker.number)} marcada como conseguida`
          : `${formatStickerCode(sticker.prefix, sticker.number)} marcada como faltante`,
      actionLabel: "Deshacer",
      onAction: () => {
        setSyncDirty(true);
        setPendingStickerId(null);
        updateSticker({
          ...previousSticker,
          updatedAt: new Date().toISOString(),
        });
        setToast(null);
      },
    });
  }

  async function confirmSyncedStickerChange(sticker: Sticker) {
    setSyncState("syncing");

    try {
      let remote = await fetchRemoteStickers(syncCode);
      if (remote.length === 0 && stickers.length > 0) {
        remote = await replaceRemoteStickers(syncCode, stickers);
      }

      const freshSticker = remote.find((remoteSticker) => remoteSticker.id === sticker.id) ?? sticker;

      if (remote.length > 0) {
        setStickers(remote);
      }

      if (sticker.status === "missing" && freshSticker.status === "owned") {
        setStickers(remote);
        setSyncDirty(false);
        setLastSyncAt(new Date().toISOString());
        setSyncState("synced");
        throw new StickerConflictError();
      }

      const nextStatus = freshSticker.status === "missing" ? "owned" : "missing";
      const updatedSticker = await setRemoteStickerStatus(
        syncCode,
        freshSticker.id,
        nextStatus,
        freshSticker.updatedAt,
      );

      if (!updatedSticker) {
        throw new Error("No sticker returned from server");
      }

      const nextStickers = (remote.length > 0 ? remote : stickers).map((currentSticker) =>
        currentSticker.id === updatedSticker.id ? updatedSticker : currentSticker,
      );

      setStickers(nextStickers);
      setSyncDirty(false);
      setLastSyncAt(new Date().toISOString());
      setSyncState("synced");
      showStickerUpdatedToast(updatedSticker, nextStatus, freshSticker);
    } catch (error) {
      if (error instanceof StickerConflictError) {
        try {
          const remote = await fetchRemoteStickers(syncCode);
          setStickers(remote);
          setLastSyncAt(new Date().toISOString());
          setSyncState("synced");
        } catch {
          setSyncState("error");
        }

        setSyncDirty(false);
        setToast({
          message: `${formatStickerCode(sticker.prefix, sticker.number)} ya fue marcada como conseguida en otro dispositivo`,
        });
        return;
      }

      setSyncState("error");
      setToast({
        message: "No se pudo confirmar contra el servidor",
      });
    }
  }

  function handleStickerClick(sticker: Sticker) {
    if (pendingStickerId !== sticker.id) {
      setPendingStickerId(sticker.id);
      setToast({
        message: `Tocá otra vez para confirmar ${formatStickerCode(sticker.prefix, sticker.number)}`,
      });
      return;
    }

    setPendingStickerId(null);

    if (syncCode) {
      void confirmSyncedStickerChange(sticker);
      return;
    }

    const nextStatus = sticker.status === "missing" ? "owned" : "missing";
    const updatedSticker: Sticker = {
      ...sticker,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    setSyncDirty(true);
    updateSticker(updatedSticker);
    showStickerUpdatedToast(updatedSticker, nextStatus, sticker);
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

  function handleAddCountryPending(countryCode: string, number: string) {
    const normalizedCountryCode = countryCode.toUpperCase();
    const id = buildStickerId(normalizedCountryCode, number);
    const timestamp = new Date().toISOString();

    setSyncDirty(true);
    setStickers((current) => {
      const existing = current.find((sticker) => sticker.id === id);
      if (existing) {
        return current.map((sticker) =>
          sticker.id === id
            ? {
                ...sticker,
                status: "missing",
                updatedAt: timestamp,
              }
            : sticker,
        );
      }

      return [
        ...current,
        {
          id,
          code: buildStickerCode(normalizedCountryCode, number),
          prefix: normalizedCountryCode,
          number,
          groupLabel: "Países",
          groupType: "country",
          countryCode: normalizedCountryCode,
          countryName: resolveCountryName(normalizedCountryCode),
          status: "missing",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ];
    });

    setToast({
      message: `${buildStickerCode(normalizedCountryCode, number)} agregada como faltante`,
    });
  }

  function handleRemovePendingSticker(sticker: Sticker) {
    const timestamp = new Date().toISOString();

    setSyncDirty(true);
    updateSticker({
      ...sticker,
      status: "owned",
      updatedAt: timestamp,
    });
    setToast({
      message: `${formatStickerCode(sticker.prefix, sticker.number)} quitada de faltantes`,
      actionLabel: "Deshacer",
      onAction: () => {
        setSyncDirty(true);
        updateSticker({
          ...sticker,
          status: "missing",
          updatedAt: new Date().toISOString(),
        });
        setToast(null);
      },
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
            pendingStickerId={pendingStickerId}
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
            pendingStickerId={pendingStickerId}
            onStickerClick={handleStickerClick}
          />
        ) : null}

        {activeTab === "summary" ? (
          <SummaryPage stickers={stickers} onShare={handleShare} />
        ) : null}

        {activeTab === "import" ? (
          <ImportPage
            stickers={stickers}
            stickerCount={stickers.length}
            onImport={handleImport}
            onAddCountryPending={handleAddCountryPending}
            onRemovePendingSticker={handleRemovePendingSticker}
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
