import * as path from "node:path";
import { createHash } from "node:crypto";
import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class FiguritasSyncStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const sharedCode = this.node.tryGetContext("syncCode") ?? process.env.SYNC_CODE;
    if (!sharedCode) {
      throw new Error("Missing sync code. Pass it with -c syncCode=... or set SYNC_CODE.");
    }

    const codeHash = createHash("sha256").update(sharedCode).digest("hex");

    const table = new dynamodb.Table(this, "StickersTable", {
      partitionKey: { name: "albumId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
    });

    const authorizer = new NodejsFunction(this, "AppSyncAuthorizer", {
      entry: path.join(__dirname, "..", "lambda", "authorizer.ts"),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handler",
      memorySize: 128,
      timeout: Duration.seconds(5),
      environment: {
        CODE_HASH: codeHash,
      },
    });

    const dataHandler = new NodejsFunction(this, "AppSyncDataHandler", {
      entry: path.join(__dirname, "..", "lambda", "data-handler.ts"),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handler",
      memorySize: 256,
      timeout: Duration.seconds(15),
      environment: {
        TABLE_NAME: table.tableName,
        ALBUM_ID: "default",
      },
    });

    table.grantReadWriteData(dataHandler);

    const api = new appsync.GraphqlApi(this, "FiguritasApi", {
      name: "figuritas-sync-api",
      definition: appsync.Definition.fromFile(
        path.join(__dirname, "..", "graphql", "schema.graphql"),
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.LAMBDA,
          lambdaAuthorizerConfig: {
            handler: authorizer,
            resultsCacheTtl: Duration.seconds(0),
          },
        },
      },
      xrayEnabled: true,
    });

    const dataSource = api.addLambdaDataSource("DataSource", dataHandler);

    dataSource.createResolver("ListStickersResolver", {
      typeName: "Query",
      fieldName: "listStickers",
    });

    dataSource.createResolver("ReplaceStickersResolver", {
      typeName: "Mutation",
      fieldName: "replaceStickers",
    });

    dataSource.createResolver("SetStickerStatusResolver", {
      typeName: "Mutation",
      fieldName: "setStickerStatus",
    });

    dataSource.createResolver("ClearStickersResolver", {
      typeName: "Mutation",
      fieldName: "clearStickers",
    });

    new CfnOutput(this, "GraphqlApiUrl", {
      value: api.graphqlUrl,
    });
  }
}
