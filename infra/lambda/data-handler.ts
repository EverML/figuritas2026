import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

type AppSyncEvent = {
  fieldName: string;
  arguments: Record<string, any>;
};

const client = new DynamoDBClient({});
const tableName = process.env.TABLE_NAME;
const albumId = process.env.ALBUM_ID ?? "default";

if (!tableName) {
  throw new Error("TABLE_NAME is required");
}

function sortStickers<T extends { groupLabel?: string; prefix?: string; number?: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftGroup = left.groupLabel ?? "";
    const rightGroup = right.groupLabel ?? "";
    if (leftGroup !== rightGroup) {
      return leftGroup.localeCompare(rightGroup, "es");
    }

    const leftPrefix = left.prefix ?? "";
    const rightPrefix = right.prefix ?? "";
    if (leftPrefix !== rightPrefix) {
      return leftPrefix.localeCompare(rightPrefix, "es");
    }

    const leftNumber = Number(left.number ?? 0);
    const rightNumber = Number(right.number ?? 0);
    return leftNumber - rightNumber;
  });
}

export const handler = async (event: AppSyncEvent) => {
  switch (event.fieldName) {
    case "listStickers": {
      const response = await client.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "albumId = :albumId",
          ExpressionAttributeValues: {
            ":albumId": albumId,
          },
        }),
      );

      return sortStickers((response.Items ?? []) as any[]);
    }

    case "replaceStickers": {
      const items = (event.arguments?.input?.stickers ?? []) as any[];
      const existing = await client.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "albumId = :albumId",
          ExpressionAttributeValues: {
            ":albumId": albumId,
          },
        }),
      );

      const deletes = (existing.Items ?? []).map((item) => ({
        DeleteRequest: {
          Key: {
            albumId: item.albumId,
            id: item.id,
          },
        },
      }));

      while (deletes.length > 0) {
        await client.send(
          new BatchWriteCommand({
            RequestItems: {
              [tableName]: deletes.splice(0, 25),
            },
          }),
        );
      }

      const puts = items.map((item) => ({
        PutRequest: {
          Item: {
            albumId,
            ...item,
          },
        },
      }));

      while (puts.length > 0) {
        await client.send(
          new BatchWriteCommand({
            RequestItems: {
              [tableName]: puts.splice(0, 25),
            },
          }),
        );
      }

      return items;
    }

    case "setStickerStatus": {
      const { id, status } = event.arguments;
      const response = await client.send(
        new UpdateCommand({
          TableName: tableName,
          Key: {
            albumId,
            id,
          },
          UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": status,
            ":updatedAt": new Date().toISOString(),
          },
          ReturnValues: "ALL_NEW",
        }),
      );

      return response.Attributes ?? null;
    }

    case "clearStickers": {
      const response = await client.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "albumId = :albumId",
          ExpressionAttributeValues: {
            ":albumId": albumId,
          },
        }),
      );

      const deletes = (response.Items ?? []).map((item) => ({
        DeleteRequest: {
          Key: {
            albumId: item.albumId,
            id: item.id,
          },
        },
      }));

      while (deletes.length > 0) {
        await client.send(
          new BatchWriteCommand({
            RequestItems: {
              [tableName]: deletes.splice(0, 25),
            },
          }),
        );
      }

      return true;
    }

    default:
      throw new Error(`Unsupported field: ${event.fieldName}`);
  }
};
