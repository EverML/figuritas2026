import type { Sticker, StickerStatus } from "../types/sticker";

const DEFAULT_APPSYNC_URL =
  "https://rnzwtchaxzd6fi4xfzhnqcqk6i.appsync-api.us-east-1.amazonaws.com/graphql";

const GRAPHQL_URL = import.meta.env.VITE_APPSYNC_URL?.trim() || DEFAULT_APPSYNC_URL;

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

type StickerListResponse = {
  listStickers: Sticker[];
};

type StickerMutationResponse = {
  setStickerStatus?: Sticker | null;
  replaceStickers: Sticker[];
};

export class StickerConflictError extends Error {
  constructor() {
    super("STICKER_CONFLICT");
    this.name = "StickerConflictError";
  }
}

async function requestGraphql<T>(
  query: string,
  variables: Record<string, unknown>,
  code: string,
): Promise<T> {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: code,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = (await response.json()) as GraphqlResponse<T>;
  if (payload.errors?.length) {
    const message = payload.errors.map((error) => error.message ?? "GraphQL error").join(", ");
    if (message.includes("STICKER_CONFLICT")) {
      throw new StickerConflictError();
    }

    throw new Error(message);
  }

  if (!payload.data) {
    throw new Error("Empty GraphQL response");
  }

  return payload.data;
}

export async function fetchRemoteStickers(syncCode: string): Promise<Sticker[]> {
  const data = await requestGraphql<StickerListResponse>(
    `query ListStickers {
      listStickers {
        id
        code
        prefix
        number
        groupLabel
        groupType
        countryCode
        countryName
        status
        createdAt
        updatedAt
      }
    }`,
    {},
    syncCode,
  );

  return data.listStickers ?? [];
}

export async function replaceRemoteStickers(syncCode: string, stickers: Sticker[]): Promise<Sticker[]> {
  const data = await requestGraphql<StickerMutationResponse>(
    `mutation ReplaceStickers($input: ReplaceStickersInput!) {
      replaceStickers(input: $input) {
        id
        code
        prefix
        number
        groupLabel
        groupType
        countryCode
        countryName
        status
        createdAt
        updatedAt
      }
    }`,
    {
      input: {
        stickers,
      },
    },
    syncCode,
  );

  return data.replaceStickers ?? stickers;
}

export async function setRemoteStickerStatus(
  syncCode: string,
  id: string,
  status: StickerStatus,
  expectedUpdatedAt?: string,
): Promise<Sticker | null> {
  const data = await requestGraphql<StickerMutationResponse>(
    `mutation SetStickerStatus($id: ID!, $status: StickerStatus!, $expectedUpdatedAt: AWSDateTime) {
      setStickerStatus(id: $id, status: $status, expectedUpdatedAt: $expectedUpdatedAt) {
        id
        code
        prefix
        number
        groupLabel
        groupType
        countryCode
        countryName
        status
        createdAt
        updatedAt
      }
    }`,
    {
      id,
      status,
      expectedUpdatedAt,
    },
    syncCode,
  );

  return data.setStickerStatus ?? null;
}

export function getSyncEndpoint(): string {
  return GRAPHQL_URL;
}
