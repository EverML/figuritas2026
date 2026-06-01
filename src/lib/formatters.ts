export function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeTextKey(value: string): string {
  return stripAccents(value).toLowerCase().replace(/\s+/g, " ").trim();
}

export function titleCase(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) {
    return "";
  }

  return compact
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatStickerNumber(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) {
    return value.trim();
  }

  return digitsOnly.padStart(2, "0");
}

export function formatStickerCode(prefix: string, number: string): string {
  return `${prefix} ${formatStickerNumber(number)}`.trim();
}

export function compactNumber(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) {
    return value.trim();
  }

  return String(Number(digitsOnly));
}

export function percentage(part: number, total: number): string {
  if (total <= 0) {
    return "0%";
  }

  return `${Math.round((part / total) * 100)}%`;
}
