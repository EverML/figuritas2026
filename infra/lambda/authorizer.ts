import crypto from "node:crypto";

type AppSyncAuthorizerEvent = {
  authorizationToken?: string;
  requestHeaders?: Record<string, string>;
};

export const handler = async (event: AppSyncAuthorizerEvent) => {
  const token = (event.authorizationToken ?? "").trim();
  if (!token) {
    return { isAuthorized: false };
  }

  const expectedHash = process.env.CODE_HASH ?? "";
  const receivedHash = crypto.createHash("sha256").update(token).digest("hex");

  if (receivedHash !== expectedHash) {
    return { isAuthorized: false };
  }

  return {
    isAuthorized: true,
    resolverContext: {
      access: "shared-code",
    },
    ttlOverride: 0,
  };
};
