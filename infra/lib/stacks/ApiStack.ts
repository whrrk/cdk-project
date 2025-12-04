import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiGateway } from '../constructs/ApiGateway';
import * as apigw from 'aws-cdk-lib/aws-apigateway';

/**
 * API Gateway（ルーティング・HTTP 構造）の専門家
 */

interface ApiStackProps extends cdk.StackProps {
  stage: string;
  lambdas: {
    health: any;
    user: any;
  };
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const api = new ApiGateway(this, 'ApiGateway', { stage: props.stage });

    // /health
    const health = api.api.root.addResource('health');
    health.addMethod('GET', new apigw.LambdaIntegration(props.lambdas.health));

    // /user
    const user = api.api.root.addResource('user');
    user.addMethod('GET', new apigw.LambdaIntegration(props.lambdas.user));
  }
}
