import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface InfraStackProps extends cdk.StackProps {
  stage: string;
}

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);

    new cdk.CfnOutput(this, 'Stage', {
      value: props.stage,
    });
  }
}
