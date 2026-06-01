import { useDeferredValue } from "react";
import type { Sticker } from "../types/sticker";
import { EmptyState } from "../components/EmptyState";
import { FilterChips } from "../components/FilterChips";
import { SearchBar } from "../components/SearchBar";
import { StickerGroup } from "../components/StickerGroup";
import { parseSearchQuery } from "../lib/parser";
import { normalizeStickerNumber } from "../lib/stickers";

type MissingPageProps = {
  stickers: Sticker[];
  search: string;
  setSearch: (value: string) => void;
  filter: "all" | "special" | "country";
  setFilter: (value: "all" | "special" | "country") => void;
  onStickerClick: (sticker: Sticker) => void;
  onShare: () => void;
};

type GroupBucket = {
  title: string;
  stickers: Sticker[];
};

function getBucketTitle(sticker: Sticker): string {
  if (sticker.groupType === "special") {
    return sticker.groupLabel;
  }

  if (sticker.groupType === "country") {
    return sticker.countryName ?? sticker.prefix;
  }

  return sticker.groupLabel;
}

export function MissingPage({
  stickers,
  search,
  setSearch,
  filter,
  setFilter,
  onStickerClick,
  onShare,
}: MissingPageProps) {
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = parseSearchQuery(deferredSearch);

  const missing = stickers.filter((sticker) => sticker.status === "missing");
  const filteredMissing = missing.filter((sticker) => {
    if (filter === "special" && sticker.groupType !== "special") {
      return false;
    }

    if (filter === "country" && sticker.groupType !== "country") {
      return false;
    }

    if (!normalizedSearch.compact) {
      return true;
    }

    const haystack = `${sticker.prefix}${sticker.number}`.toUpperCase();
    const normalizedCountry = (sticker.countryName ?? "").toUpperCase().replace(/\s+/g, "");

    if (normalizedSearch.number) {
      return normalizeStickerNumber(sticker.number) === normalizeStickerNumber(normalizedSearch.number);
    }

    if (normalizedSearch.prefix) {
      return (
        haystack.includes(normalizedSearch.prefix) ||
        sticker.code.toUpperCase().includes(normalizedSearch.prefix) ||
        normalizedCountry.includes(normalizedSearch.prefix)
      );
    }

    return false;
  });

  const grouped = filteredMissing.reduce<GroupBucket[]>((accumulator, sticker) => {
    const title = getBucketTitle(sticker);
    const bucket = accumulator[accumulator.length - 1];
    if (bucket && bucket.title === title) {
      bucket.stickers.push(sticker);
      return accumulator;
    }

    accumulator.push({ title, stickers: [sticker] });
    return accumulator;
  }, []);

  const filterOptions = [
    { value: "all" as const, label: "Todas" },
    { value: "special" as const, label: "Especiales" },
    { value: "country" as const, label: "Países" },
  ];

  return (
    <div className="space-y-4">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[34px] font-black tracking-tight text-ink">Mundial 2026</h1>
            <p className="mt-1 text-[16px] font-medium text-slate-500">
              Me faltan <span className="font-bold text-primary-700">{missing.length}</span> figuritas
            </p>
          </div>
          <button
            type="button"
            onClick={onShare}
            className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink shadow-soft transition hover:bg-slate-50"
          >
            Compartir
          </button>
        </div>

        <div className="sticky top-4 z-20 space-y-3 rounded-[28px] bg-canvas/95 py-1 backdrop-blur">
          <SearchBar value={search} onChange={setSearch} />
          <FilterChips value={filter} options={filterOptions} onChange={setFilter} />
        </div>
      </header>

      {normalizedSearch && filteredMissing.length === 0 ? (
        <EmptyState
          title="No encontramos esa figurita"
          description="Probá con otro código, país o número."
        />
      ) : null}

      {!normalizedSearch.compact && missing.length === 0 ? (
        <EmptyState
          title="Álbum completo"
          description="No tenés figuritas pendientes."
        />
      ) : null}

      <div className="space-y-4">
        {grouped.map((group) => (
          <StickerGroup
            key={group.title}
            title={group.title}
            count={group.stickers.length}
            stickers={group.stickers}
            onStickerClick={onStickerClick}
          />
        ))}
      </div>
    </div>
  );
}
