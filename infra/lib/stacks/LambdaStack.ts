import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { HealthLambda } from '../constructs/healthLambda';
import { UserLambda } from '../constructs/UserLambda';

/**
 * Lambda（関数）の定義・管理の専門家
 */

interface LambdaStackProps extends cdk.StackProps {
  stage: string;
}

export class LambdaStack extends cdk.Stack {
  public readonly lambdas: any;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const health = new HealthLambda(this, 'HealthLambda', { stage: props.stage });
    const user = new UserLambda(this, 'UserLambda', { stage: props.stage });

    this.lambdas = {
      health: health.lambdaFn,
      user: user.lambdaFn,
    };
  }
}
