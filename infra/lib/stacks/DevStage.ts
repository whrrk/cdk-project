// lib/DevStage.ts
import { Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AuthStack } from './AuthStack';
import { DatabaseStack } from './DatabaseStack';
import { LambdaStack } from './LambdaStack';
import { ApiStack } from './ApiStack';
import { WebStack } from './WebStack';

export class DevStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const env = { account: this.account, region: this.region };

    // 1) Auth
    const authStack = new AuthStack(this, 'AuthStack', { env });

    // 2) DB
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', { env });

    // 3) Lambda
    const lambdaStack = new LambdaStack(this, 'LambdaStack', {
      env,
      userPool: authStack.userPool,
      table: databaseStack.table,
    });

    // 4) API Gateway  ← ここを修正
    const apiStack = new ApiStack(this, 'ApiStack', {
      env,
      userPool: authStack.userPool,
      courseHandler: lambdaStack.courseHandler,
      threadHandler: lambdaStack.threadHandler,
    });

    // 5) Web (S3 + CloudFront)
    new WebStack(this, 'WebStack', {
      env,
    });
  }
}
