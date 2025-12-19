// infra/lib/constructs/FrontendDeploy.ts
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

export interface FrontendDeployProps {
  /**
   * SPA 用に 404 を index.html にフォールバックするか
   */
  spaFallback?: boolean;

  webAclId?: string;
}

export class FrontendDeploy extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: FrontendDeployProps) {
    super(scope, id);

    // 1) S3 バケット（完全 private）
    this.bucket = new s3.Bucket(this, 'FrontendBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // 2) OAI 作成（CloudFront だけが S3 を読めるように）
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI');
    this.bucket.grantRead(oai);

    // 3) CloudFront Distribution
    this.distribution = new cloudfront.Distribution(
      this,
      'FrontendDistribution',
      {
        defaultRootObject: 'index.html',
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessIdentity(this.bucket, {
            originAccessIdentity: oai,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        webAclId: props.webAclId, //（WAFアタッチ）
        errorResponses: props.spaFallback
          ? [
            {
              httpStatus: 404,
              responseHttpStatus: 200,
              responsePagePath: '/index.html',
              ttl: Duration.minutes(1),
            },
          ]
          : [],
      }
    );
  }
}
