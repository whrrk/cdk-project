// lib/LambdaStack.ts
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from "aws-cdk-lib/aws-s3";

export interface LambdaStackProps extends StackProps {
  table: dynamodb.Table;
  userPool: cognito.UserPool;
  videoBucket: s3.Bucket;
}

export class LambdaStack extends Stack {
  public readonly courseHandler: lambda.Function;
  public readonly threadHandler: lambda.Function;
  public readonly videoHandler: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const { table, userPool, videoBucket } = props;

    const commonEnv = {
      TABLE_NAME: table.tableName,
      USER_POOL_ID: userPool.userPoolId,
      VIDEO_BUCKET: videoBucket.bucketName,
    };

    // /courses 系用
    this.courseHandler = new lambda.Function(this, 'CourseHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler/courses.handler',          // api/courses.js の exports.handler
      code: lambda.Code.fromAsset('../api'),
      environment: commonEnv
    });

    // /threads 系用
    this.threadHandler = new lambda.Function(this, 'ThreadHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler/threads.handler',          // api/threads.js の exports.handler
      code: lambda.Code.fromAsset('../api'),
      environment: commonEnv,
    });

    // /video 系用
    this.videoHandler = new lambda.Function(this, 'VideoHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler/videos.handler',          // api/threads.js の exports.handler
      code: lambda.Code.fromAsset('../api'),
      environment: commonEnv,
    });

    // Lambdaに DynamoDB 権限付与
    table.grantReadWriteData(this.courseHandler);
    table.grantReadWriteData(this.threadHandler);
    table.grantReadWriteData(this.videoHandler);
    userPool.grant(this.courseHandler, 'cognito-idp:AdminGetUser');
    userPool.grant(this.threadHandler, 'cognito-idp:AdminGetUser');
    userPool.grant(this.videoHandler, 'cognito-idp:AdminGetUser');

    videoBucket.grantRead(this.courseHandler);
  }
}
