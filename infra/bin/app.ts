#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { PipelineStack } from '../lib/stacks/PipelineStack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// cdk.json の context.dev を取得
const dev = app.node.tryGetContext("dev");

// パイプライン本体だけ作る
new PipelineStack(app, 'ProjectPipelineStack', {
  env,
  githubRepo: dev.githubRepo,
  githubBranch: dev.githubBranch,
  // CodeStar Connections で作った接続の ARN に書き換え
  githubConnectionArn: dev.githubConnectionArn,
  stageName: dev.stage,
  stagePrefix: dev.prefix,
});

app.synth();
