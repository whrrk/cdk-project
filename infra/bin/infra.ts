#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { InfraStack } from '../lib/infra-stack';

const app = new cdk.App();

const stage = (app.node.tryGetContext('stage') as string) ?? 'dev';

new InfraStack(app, `InfraStack-${stage}`, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'ap-northeast-1' },
  stage: stage
});
