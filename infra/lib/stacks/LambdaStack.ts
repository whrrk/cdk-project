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
  public readonly apiHandler: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const { table, userPool } = props;

    this.apiHandler = new lambda.Function(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',          // api/index.jsの exports.handler
      code: lambda.Code.fromAsset('../api'), // フォルダを指定
      environment: {
        TABLE_NAME: table.tableName,
        USER_POOL_ID: userPool.userPoolId,
      },
    });

    // Lambdaに DynamoDB 権限付与
    table.grantReadWriteData(this.apiHandler);
  }
}
