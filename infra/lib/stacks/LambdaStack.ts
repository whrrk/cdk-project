// lib/LambdaStack.ts
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export interface LambdaStackProps extends StackProps {
  table: dynamodb.Table;
  userPool: cognito.UserPool;
}

export class LambdaStack extends Stack {
  public readonly courseHandler: lambda.Function;
  public readonly threadHandler: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const { table, userPool } = props;

    const commonEnv = {
      TABLE_NAME: table.tableName,
      USER_POOL_ID: userPool.userPoolId,
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

    // Lambdaに DynamoDB 権限付与
    table.grantReadWriteData(this.courseHandler);
    table.grantReadWriteData(this.threadHandler);
    userPool.grant(this.courseHandler, 'cognito-idp:AdminGetUser');
    userPool.grant(this.threadHandler, 'cognito-idp:AdminGetUser');
  }
}
