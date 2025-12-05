#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { AuthStack } from '../lib/stacks/AuthStack';
import { DatabaseStack } from '../lib/stacks/DatabaseStack';
import { LambdaStack } from '../lib/stacks/LambdaStack';
import { ApiStack } from '../lib/stacks/ApiStack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// 1) 認証 (Cognito)
const authStack = new AuthStack(app, 'AuthStack', { env });

// 2) DB (DynamoDB)
const databaseStack = new DatabaseStack(app, 'DatabaseStack', { env });

// 3) Lambda
const lambdaStack = new LambdaStack(app, 'LambdaStack', {
  env,
  userPool: authStack.userPool,
  table: databaseStack.table,
});

// 4) API Gateway
const apiStack = new ApiStack(app, 'ApiStack', {
  env,
  handler: lambdaStack.apiHandler,
  userPool: authStack.userPool    // ← 新しく追加
});

// 学習順序を明示的に
lambdaStack.addDependency(authStack);
lambdaStack.addDependency(databaseStack);
apiStack.addDependency(lambdaStack);
