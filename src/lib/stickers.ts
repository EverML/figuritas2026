import { compactNumber, formatStickerCode, formatStickerNumber, normalizeTextKey } from "./formatters";

export function normalizeStickerCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function normalizeStickerNumber(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits ? String(Number(digits)) : "";
}

export function buildStickerId(prefix: string, number: string): string {
  const paddedNumber = formatStickerNumber(number);
  return `${prefix.toUpperCase()}-${paddedNumber}`;
}

export function buildStickerCode(prefix: string, number: string): string {
  return formatStickerCode(prefix.toUpperCase(), number);
}

export function isDigitsOnly(value: string): boolean {
  return /^\d+$/.test(value);
}

export function isLettersOnly(value: string): boolean {
  return /^[A-ZÀ-ÿ]+$/.test(value);
}

export function cleanGroupLabel(value: string): string {
  const cleaned = value
    .replace(/^--+\s*/, "")
    .replace(/\bmissing\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "Sin grupo";
  }

  return cleaned
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function normalizeSearchInput(value: string): string {
  return normalizeStickerCode(value);
}

export function normalizeCountryKey(value: string): string {
  return normalizeTextKey(value).replace(/\s+/g, " ");
}

export function formatCompactSticker(prefix: string, number: string): string {
  return `${prefix.toUpperCase()} ${compactNumber(number).padStart(2, "0")}`.trim();
}
