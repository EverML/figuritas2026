import type { Sticker } from "../types/sticker";

const STORAGE_KEY = "world-cup-stickers-state-v2";
const SYNC_CODE_KEY = "world-cup-sync-code-v1";

export function loadStickers(): Sticker[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Sticker[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStickers(stickers: Sticker[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stickers));
}

export function clearStickers(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export { STORAGE_KEY };

export function loadSyncCode(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(SYNC_CODE_KEY) ?? "";
}

export function saveSyncCode(syncCode: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const trimmed = syncCode.trim();
  if (!trimmed) {
    window.localStorage.removeItem(SYNC_CODE_KEY);
    return;
  }

  window.localStorage.setItem(SYNC_CODE_KEY, trimmed);
}

export function clearSyncCode(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SYNC_CODE_KEY);
}
