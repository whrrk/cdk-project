// infra/lib/stacks/WebStack.ts
import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { FrontendDeploy } from '../construcets/FrontendDeploy';


export interface WebStackProps extends StackProps {}

export class WebStack extends Stack {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    const frontend = new FrontendDeploy(this, 'Frontend', {
      buildOutputPath: '../web/dist', // ← web で npm run build した成果物
      spaFallback: true,              // SPA 前提なら true 推奨
    });

    this.distribution = frontend.distribution;

    new CfnOutput(this, 'FrontendDistributionDomainName', {
      value: this.distribution.domainName,
    });
  }
}
