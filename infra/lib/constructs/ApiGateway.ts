import * as apigw from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class ApiGateway extends Construct {
  public readonly api: apigw.RestApi;

  constructor(scope: Construct, id: string, props: { stage: string }) {
    super(scope, id);

    this.api = new apigw.RestApi(this, `Api-${props.stage}`, {
      restApiName: `MyApi-${props.stage}`,
      deployOptions: {
        stageName: props.stage,
      },
    });
  }
}
