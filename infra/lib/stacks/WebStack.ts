// infra/lib/stacks/WebStack.ts
import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { FrontendDeploy } from '../construcets/FrontendDeploy';

export interface WebStackProps extends StackProps { }

export class WebStack extends Stack {
  public readonly frontUrlOutput: CfnOutput;
  public readonly distribution: cloudfront.Distribution;
  public readonly bucketNameOutput: CfnOutput;
  public readonly distributionIdOutput: CfnOutput;

  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    const frontend = new FrontendDeploy(this, 'Frontend', {
      spaFallback: true,
    });

    this.distribution = frontend.distribution;

    // CloudFront ドメイン名
    this.frontUrlOutput = new CfnOutput(this, 'FrontendDistributionDomainName', {
      value: this.distribution.domainName,
    });

    // S3 バケット名
    this.bucketNameOutput = new CfnOutput(this, 'FrontendBucketName', {
      value: frontend.bucket.bucketName,
    });

    // CloudFront Distribution ID
    this.distributionIdOutput = new CfnOutput(this, 'FrontendDistributionId', {
      value: this.distribution.distributionId,
    });
  }
}
