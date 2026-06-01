import { COUNTRY_NAMES, resolveCountryCode, resolveCountryName } from "./countries";
import {
  buildStickerCode,
  buildStickerId,
  cleanGroupLabel,
  isDigitsOnly,
  normalizeCountryKey,
} from "./stickers";
import type { Sticker, StickerGroupType } from "../types/sticker";
import { formatStickerNumber, normalizeTextKey, stripAccents } from "./formatters";

function detectGroupType(header: string): StickerGroupType {
  const normalized = normalizeTextKey(header);

  if (normalized.includes("especial")) {
    return "special";
  }

  if (
    normalized.includes("pais") ||
    normalized.includes("país") ||
    normalized.includes("paises") ||
    normalized.includes("países")
  ) {
    return "country";
  }

  return "unknown";
}

function parseStickerTokens(line: string): { prefix: string; number: string } | null {
  const trimmed = line.replace(/^\-\s*\[\s*\]\s*/, "").trim();
  if (!trimmed) {
    return null;
  }

  const compact = trimmed.replace(/\s+/g, " ");
  const directMatch = compact.match(/^(.+?)[\s-]*(\d{1,3})$/);
  if (!directMatch) {
    return null;
  }

  const rawPrefix = directMatch[1].trim();
  const rawNumber = directMatch[2].trim();

  return {
    prefix: rawPrefix,
    number: formatStickerNumber(rawNumber),
  };
}

function resolvePrefix(rawPrefix: string): { prefix: string; countryCode?: string; countryName?: string } {
  const compact = rawPrefix.replace(/\s+/g, " ").trim();
  const maybeCode = compact.toUpperCase();

  if (/^[A-Z]{2,5}$/.test(maybeCode) && COUNTRY_NAMES[maybeCode]) {
    return {
      prefix: maybeCode,
      countryCode: maybeCode,
      countryName: resolveCountryName(maybeCode),
    };
  }

  const countryCode = resolveCountryCode(compact);
  if (countryCode) {
    return {
      prefix: countryCode,
      countryCode,
      countryName: resolveCountryName(countryCode),
    };
  }

  const stripped = stripAccents(compact).toUpperCase();
  if (/^[A-Z]{2,5}$/.test(stripped)) {
    return {
      prefix: stripped,
    };
  }

  return {
    prefix: compact.toUpperCase(),
    countryName: compact,
  };
}

export function parseMissingStickers(input: string): Sticker[] {
  const lines = input.split(/\r?\n/);
  const stickers: Sticker[] = [];
  const seen = new Set<string>();
  const timestamp = new Date().toISOString();

  let currentGroupLabel = "Sin grupo";
  let currentGroupType: StickerGroupType = "unknown";

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    if (line.startsWith("--")) {
      currentGroupLabel = cleanGroupLabel(line);
      currentGroupType = detectGroupType(line);
      continue;
    }

    const parsed = parseStickerTokens(line);
    if (!parsed) {
      continue;
    }

    const resolved = resolvePrefix(parsed.prefix);
    const normalizedPrefix = resolved.prefix.toUpperCase();
    const normalizedNumber = parsed.number;
    const id = buildStickerId(normalizedPrefix, normalizedNumber);

    if (seen.has(id)) {
      continue;
    }

    seen.add(id);

    stickers.push({
      id,
      code: buildStickerCode(normalizedPrefix, normalizedNumber),
      prefix: normalizedPrefix,
      number: normalizedNumber,
      groupLabel: currentGroupLabel,
      groupType: currentGroupType,
      countryCode: resolved.countryCode,
      countryName:
        resolved.countryName ??
        (currentGroupType === "country" ? resolveCountryName(normalizedPrefix) : undefined),
      status: "missing",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  return stickers;
}

export function parseSearchQuery(input: string): { prefix?: string; number?: string; compact: string } {
  const compact = input.trim().replace(/\s+/g, "").toUpperCase();
  if (!compact) {
    return { compact: "" };
  }

  const codeMatch = compact.match(/^([A-ZÀ-ÿ]+)(\d{1,3})$/);
  if (codeMatch) {
    return {
      prefix: codeMatch[1],
      number: formatStickerNumber(codeMatch[2]),
      compact,
    };
  }

  if (isDigitsOnly(compact)) {
    return {
      number: formatStickerNumber(compact),
      compact,
    };
  }

  const resolvedPrefix = resolveCountryCode(compact) ?? resolveCountryCode(input.trim());

  return {
    prefix: resolvedPrefix ?? compact,
    compact,
  };
}
