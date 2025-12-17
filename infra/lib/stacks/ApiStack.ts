// lib/ApiStack.ts
import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export interface ApiStackProps extends StackProps {
  courseHandler: lambda.IFunction;
  threadHandler: lambda.IFunction;
  videoHandler: lambda.IFunction;
  userPool: cognito.IUserPool;
}

export class ApiStack extends Stack {
  public readonly restApi: apigw.RestApi;
  public readonly apiUrlOutput: CfnOutput;

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
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });


    this.apiUrlOutput = new CfnOutput(this, "ApiUrl", {
      value: this.restApi.url ?? "",
    });

    this.restApi.addGatewayResponse('UnauthorizedResponse', {
      type: apigw.ResponseType.UNAUTHORIZED,
      statusCode: '401',
      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
        "Access-Control-Allow-Headers": "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
        "Access-Control-Allow-Methods": "'GET,POST,PUT,DELETE,OPTIONS'",
      },
    });

    this.restApi.addGatewayResponse("Default4xx", {
      type: apigw.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        "Access-Control-Allow-Origin": "'https://dix3mtf4a9qw2.cloudfront.net'",
        "Access-Control-Allow-Headers": "'Content-Type,Authorization'",
        "Access-Control-Allow-Methods": "'GET,POST,PUT,DELETE,OPTIONS'",
      },
    });

    this.restApi.addGatewayResponse("Default5xx", {
      type: apigw.ResponseType.DEFAULT_5XX,
      responseHeaders: {
        "Access-Control-Allow-Origin": "'https://dix3mtf4a9qw2.cloudfront.net'",
        "Access-Control-Allow-Headers": "'Content-Type,Authorization'",
        "Access-Control-Allow-Methods": "'GET,POST,PUT,DELETE,OPTIONS'",
      },
    });

    const courseIntegration = new apigw.LambdaIntegration(props.courseHandler);
    const threadIntegration = new apigw.LambdaIntegration(props.threadHandler);
    const videoIntegration = new apigw.LambdaIntegration(props.videoHandler);


    const authOptions: apigw.MethodOptions = {
      authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    };
    // ③ 以降の addMethod はオプション不要で「全部 Cognito 必須」になる
    const courses = this.restApi.root.addResource('courses');
    courses.addMethod('GET', courseIntegration, authOptions);
    courses.addMethod('POST', courseIntegration, authOptions);

    const course = courses.addResource('{courseId}');
    course.addMethod('GET', courseIntegration, authOptions);

    const videos = course.addResource('videos');   // ✅ 추가
    videos.addMethod('GET', videoIntegration, authOptions);     // GET /courses/{courseId}/videos
    videos.addMethod('POST', videoIntegration, authOptions);

    const enroll = course.addResource('enroll');
    enroll.addMethod('POST', courseIntegration, authOptions);

    const members = course.addResource('members');
    members.addMethod('GET', courseIntegration, authOptions);

    const courseThreads = course.addResource('threads');
    courseThreads.addMethod('GET', threadIntegration, authOptions);
    courseThreads.addMethod('POST', threadIntegration, authOptions);

    const threadsRoot = this.restApi.root.addResource('threads');
    const thread = threadsRoot.addResource('{threadId}');
    const messages = thread.addResource('messages');
    messages.addMethod('GET', threadIntegration, authOptions);
    messages.addMethod('POST', threadIntegration, authOptions);
  }
}