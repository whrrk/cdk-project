// lib/AuthStack.ts
import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export interface AuthStackProps extends StackProps {}

export class AuthStack extends Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly cognitoDomainOutput: CfnOutput;
  public readonly cognitoClientIdOutput: CfnOutput;

  constructor(scope: Construct, id: string, props?: AuthStackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, 'AppUserPool', {
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
      },
      passwordPolicy: {
        minLength: 8,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    this.userPoolClient = new cognito.UserPoolClient(
      this,
      'AppUserPoolClient',
      {
        userPool: this.userPool,
        generateSecret: false,
          authFlows: {
          userPassword: true,   // ← USER_PASSWORD_AUTH を有効化
          userSrp: true,        // ← USER_SRP_AUTH も一緒にONにしておくと便利
        },
      },
    );

    const stack = Stack.of(this);  
    const stagePrefix = stack.stackName.toLowerCase();

    const domain = this.userPool.addDomain('AppUserPoolDomain', {
      cognitoDomain: {
        domainPrefix: `ledemy-${stagePrefix}`.substring(0, 63), 
      },
    });

    this.cognitoDomainOutput = new CfnOutput(this, "CognitoDomain", {
      value: domain.baseUrl(), // 例: https://your-prefix.auth.ap-northeast-1.amazoncognito.com
    });

    this.cognitoClientIdOutput = new CfnOutput(this, "CognitoClientId", {
      value: this.userPoolClient.userPoolClientId,
    });
  }
}
