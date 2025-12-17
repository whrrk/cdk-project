#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { PipelineStack } from '../lib/stacks/PipelineStack';
import { AuthStack } from "../lib/stacks/AuthStack";
import { DatabaseStack } from '../lib/stacks/DatabaseStack';
import { StorageStack } from '../lib/stacks/storageStack';
import { LambdaStack } from '../lib/stacks/LambdaStack';
import { ApiStack } from '../lib/stacks/ApiStack';
import { WebStack } from '../lib/stacks/WebStack';

const app = new cdk.App();

//production
// const env = {
//   account: process.env.CDK_DEFAULT_ACCOUNT,
//   region: process.env.CDK_DEFAULT_REGION,
// };

//test
const env = {
  account: "749339776410",
  region: "ap-northeast-1",
};


// cdk.json の context.dev を取得
const dev = app.node.tryGetContext("dev");
const deployMode = app.node.tryGetContext("deployMode") ?? "pipeline";

if (deployMode === "pipeline") {
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
} else {
  const auth = new AuthStack(app, "AuthStack", { env, stackName: "Dev-AuthStack" });

  // DB
  const db = new DatabaseStack(app, "DatabaseStack", { env, stackName: "Dev-DatabaseStack" });

  // Storage
  const storageStack = new StorageStack(app, "StorageStack", { env, stackName: "Dev-StorageStack" });

  // Lambda
  const lambda = new LambdaStack(app, 'LambdaStack', {
    env,
    userPool: auth.userPool,
    table: db.table,
    videoBucket: storageStack.videoBucket,
    stackName: "Dev-LambdaStack"
  });

  // API
  const api = new ApiStack(app, 'ApiStack', {
    env,
    userPool: auth.userPool,
    courseHandler: lambda.courseHandler,
    threadHandler: lambda.threadHandler,
    videoHandler: lambda.videoHandler,
    stackName: "Dev-ApiStack"
  });

  // Front
  const front = new WebStack(app, "WebStack", {
    env,
    stackName: "Dev-WebStack"
  });
}


app.synth();
