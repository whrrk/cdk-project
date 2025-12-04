#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ApiStack } from '../lib/stacks/ApiStack';
import { LambdaStack } from '../lib/stacks/LambdaStack';

const app = new cdk.App();
const stage = app.node.tryGetContext('stage'); // dev/stg/prod
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'ap-northeast-1',
};

// Lambda Stack
const lambdaStack = new LambdaStack(app, `LambdaStack-${stage}`, {
  env,
  stage,
});

// API Stack（Lambda Stack からLambdaを受け取る）
new ApiStack(app, `ApiStack-${stage}`, {
  env,
  stage,
  lambdas: lambdaStack.lambdas,
});
