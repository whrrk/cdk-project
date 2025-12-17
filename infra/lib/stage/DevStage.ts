// lib/DevStage.ts
import { Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AuthStack } from '../stacks/AuthStack';
import { DatabaseStack } from '../stacks/DatabaseStack';
import { LambdaStack } from '../stacks/LambdaStack';
import { ApiStack } from '../stacks/ApiStack';
import { WebStack } from '../stacks/WebStack';
import { StorageStack } from '../stacks/storageStack';

export class DevStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const env = { account: this.account, region: this.region };

    // 1) Auth
    const authStack = new AuthStack(this, 'AuthStack', { env });

    // 2) DB
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', { env });

    const storageStack = new StorageStack(this, "StorageStack");

    // 3) Lambda
    const lambdaStack = new LambdaStack(this, 'LambdaStack', {
      env,
      userPool: authStack.userPool,
      table: databaseStack.table,
      videoBucket: storageStack.videoBucket
    });

    // 4) API Gateway  ← ここを修正
    const apiStack = new ApiStack(this, 'ApiStack', {
      env,
      userPool: authStack.userPool,
      courseHandler: lambdaStack.courseHandler,
      threadHandler: lambdaStack.threadHandler,
      videoHandler: lambdaStack.videoHandler
    });

    // 5) Web (S3 + CloudFront)
    new WebStack(this, 'WebStack', {
      env,
    });
  }
}
