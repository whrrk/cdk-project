// lib/ApiStack.ts
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export interface ApiStackProps extends StackProps {
  handler: lambda.IFunction;
  userPool: cognito.IUserPool;
}

export class ApiStack extends Stack {
  public readonly restApi: apigw.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'UserAuthorizer', {
      cognitoUserPools: [props.userPool],
    });
    
    this.restApi = new apigw.RestApi(this, 'AppApi', {
      restApiName: 'EducationApi',
      deployOptions: {
        stageName: 'dev',
      },
      defaultMethodOptions: {
        authorizer,
        authorizationType: apigw.AuthorizationType.COGNITO,
      },
    });

    this.restApi.addGatewayResponse('UnauthorizedResponse', {
      type: apigw.ResponseType.UNAUTHORIZED,
      statusCode: '401',
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'*'",
      },
    });

   const lambdaIntegration = new apigw.LambdaIntegration(props.handler);

    // ③ 以降の addMethod はオプション不要で「全部 Cognito 必須」になる
    const courses = this.restApi.root.addResource('courses');
    courses.addMethod('GET', lambdaIntegration);
    courses.addMethod('POST', lambdaIntegration);

    const course = courses.addResource('{courseId}');
    course.addMethod('GET', lambdaIntegration);

    const enroll = course.addResource('enroll');
    enroll.addMethod('POST', lambdaIntegration);

    const members = course.addResource('members');
    members.addMethod('GET', lambdaIntegration);

    const courseThreads = course.addResource('threads');
    courseThreads.addMethod('GET', lambdaIntegration);
    courseThreads.addMethod('POST', lambdaIntegration);

    const threadsRoot = this.restApi.root.addResource('threads');
    const thread = threadsRoot.addResource('{threadId}');
    const messages = thread.addResource('messages');
    messages.addMethod('GET', lambdaIntegration);
    messages.addMethod('POST', lambdaIntegration);
  }
}