import { useEffect, useMemo, useState } from "react";
import type { Sticker } from "./types/sticker";
import { AppShell } from "./components/AppShell";
import { BottomNav, type TabKey } from "./components/BottomNav";
import { MissingPage } from "./pages/MissingPage";
import { QuickSearchPage } from "./pages/QuickSearchPage";
import { SummaryPage } from "./pages/SummaryPage";
import { ImportPage } from "./pages/ImportPage";
import { Toast, type ToastState } from "./components/Toast";
import { loadStickers, saveStickers } from "./lib/storage";
import { INITIAL_DATASET } from "./lib/seed";
import { parseMissingStickers } from "./lib/parser";
import { formatStickerCode } from "./lib/formatters";

type FilterKey = "all" | "special" | "country";

function seedStickers(): Sticker[] {
  const seed = parseMissingStickers(INITIAL_DATASET);
  return seed;
}

export default function App() {
  const [stickers, setStickers] = useState<Sticker[]>(() => {
    const stored = loadStickers();
    return stored.length > 0 ? stored : seedStickers();
  });
  const [activeTab, setActiveTab] = useState<TabKey>("missing");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    saveStickers(stickers);
  }, [stickers]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [toast]);

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
    updateSticker({ ...sticker, status: nextStatus });
    setToast({
      message:
        nextStatus === "owned"
          ? `${formatStickerCode(sticker.prefix, sticker.number)} marcada como conseguida`
          : `${formatStickerCode(sticker.prefix, sticker.number)} marcada como faltante`,
      actionLabel: "Deshacer",
      onAction: () => {
        updateSticker({ ...sticker, status: sticker.status });
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
    setStickers(nextStickers);
    setSearchQuery("");
    setFilter("all");
    setActiveTab("missing");
    setToast({
      message: `Importaste ${nextStickers.length} figuritas`,
    });
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
