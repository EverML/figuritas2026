import crypto from "node:crypto";

type AppSyncAuthorizerEvent = {
  authorizationToken?: string;
  requestHeaders?: Record<string, string>;
};

export const handler = async (event: AppSyncAuthorizerEvent) => {
  const token =
    (event.authorizationToken ??
      event.requestHeaders?.Authorization ??
      event.requestHeaders?.authorization ??
      "").trim();
  if (!token) {
    console.log("authorizer: missing token", {
      hasAuthorizationToken: Boolean(event.authorizationToken),
      headerKeys: Object.keys(event.requestHeaders ?? {}),
    });
    return { isAuthorized: false };
  }

  const expectedHash = process.env.CODE_HASH ?? "";
  const receivedHash = crypto.createHash("sha256").update(token).digest("hex");

  console.log("authorizer: token received", {
    tokenLength: token.length,
    expectedHash,
    receivedHash,
    matched: receivedHash === expectedHash,
  });

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
