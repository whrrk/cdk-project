#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { PipelineStack } from '../lib/stacks/PipelineStack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// パイプライン本体だけ作る
new PipelineStack(app, 'ProjectPipelineStack', {
  env,
  // 自分の GitHub リポジトリに書き換え
  githubRepo: 'whrrk/cdk-project',
  githubBranch: 'master',
  // CodeStar Connections で作った接続の ARN に書き換え
  githubConnectionArn:
    'arn:aws:codeconnections:ap-northeast-1:749339776410:connection/6d1b74b2-623d-4cea-89ba-19698600b1fc',
});

app.synth();
