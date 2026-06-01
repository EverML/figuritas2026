export type StickerStatus = "missing" | "owned";

export type StickerGroupType = "special" | "country" | "unknown";

export type Sticker = {
  id: string;
  code: string;
  prefix: string;
  number: string;
  groupLabel: string;
  groupType: StickerGroupType;
  countryCode?: string;
  countryName?: string;
  status: StickerStatus;
  createdAt: string;
  updatedAt: string;
};
