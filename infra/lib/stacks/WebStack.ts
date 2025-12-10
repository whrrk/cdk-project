// infra/lib/stacks/WebStack.ts
import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as path from 'path';
import { FrontendDeploy } from '../construcets/FrontendDeploy';

export interface WebStackProps extends StackProps {}

export class WebStack extends Stack {
  public readonly frontUrlOutput: CfnOutput;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    const frontend = new FrontendDeploy(this, 'Frontend', {
      // stacks/ から見て ../../web/dist
      buildOutputPath: path.join(__dirname, '..', '..', '..', 'web', 'dist'),
      spaFallback: true,
    });

    this.distribution = frontend.distribution;

    this.frontUrlOutput = new CfnOutput(this, 'FrontendDistributionDomainName', {
      value: this.distribution.domainName,
    });
  }
}
