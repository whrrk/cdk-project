import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";

export class StorageStack extends Stack {
  public readonly videoBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.videoBucket = new s3.Bucket(this, "VideoBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          allowedOrigins: ["*"], // dev 단계
          allowedHeaders: ["*"],
        },
      ],
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY, // 開発用(かいはつよう)。本番は RETAIN
      autoDeleteObjects: true,              // 開発用。本番は false
    });
  }
}
