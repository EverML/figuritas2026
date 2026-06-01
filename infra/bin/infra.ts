#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FiguritasSyncStack } from '../lib/figuritas-sync-stack.js';

const app = new cdk.App();
new FiguritasSyncStack(app, 'FiguritasSyncStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
