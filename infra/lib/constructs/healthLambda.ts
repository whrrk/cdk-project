import { Construct } from "constructs";
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class HealthLambda extends Construct {
  public readonly lambdaFn: lambda.Function;

  constructor(scope: Construct, id: string, props: { stage: string }) {
    super(scope, id);

    
    this.lambdaFn = new lambda.Function(this, `HealthFn-${props.stage}`, {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../api/health"),
    });
  }
}