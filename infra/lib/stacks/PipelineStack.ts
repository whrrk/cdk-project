import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
} from "aws-cdk-lib/pipelines";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as iam from "aws-cdk-lib/aws-iam";
import { AppStage } from "../stage/AppStage";

export interface PipelineStackProps extends StackProps {
  readonly githubRepo?: string; // "user/repo"
  readonly githubBranch?: string; // デフォルト "main"
  readonly githubConnectionArn?: string; // CodeStar Connections を使うなら
  readonly stageName?: string;
  readonly stagePrefix?: string;

  // これらは別経路で使う可能性があるなら残してもOK（今のコードでは未使用）
  readonly apiUrlOutput?: CfnOutput;
  readonly cognitoDomainOutput?: CfnOutput;
  readonly cognitoClientIdOutput?: CfnOutput;
  readonly frontendUrlOutput?: CfnOutput;
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "ProjectPipeline",
      selfMutation: true,
      synth: new CodeBuildStep("Synth", {
        input: CodePipelineSource.connection(
          props.githubRepo ?? "local-repo",
          props.githubBranch ?? "master",
          {
            connectionArn: props.githubConnectionArn!,
          }
        ),
        // ← Synth では envFromCfnOutputs は使わない（Stack デプロイ前だから）
        commands: ["cd infra", "npm ci", "npx cdk synth"],
        primaryOutputDirectory: "infra/cdk.out",
        buildEnvironment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        },
        partialBuildSpec: codebuild.BuildSpec.fromObject({
          version: "0.2",
          phases: {
            install: {
              "runtime-versions": {
                nodejs: 20,
              },
            },
          },
        }),
      }),
    });

    // ① まず普通に Stage を new する（ここでは "Dev" 環境）
    const appStage = new AppStage(this, "Dev", {
      env: props.env, // bin で渡している env をそのまま引き継ぐ
    });

    // ② Stage を pipeline に追加 → 戻り値は StageDeployment
    const devStageDeployment = pipeline.addStage(appStage);

    // ③ Dev ステージが全部デプロイされた「後」に Web ビルド Step を実行
    devStageDeployment.addPost(
      new CodeBuildStep("BuildWeb", {
        envFromCfnOutputs: {
          API_URL: appStage.apiUrlOutput,
          COGNITO_DOMAIN: appStage.cognitoDomainOutput,
          COGNITO_CLIENT_ID: appStage.cognitoClientIdOutput,
          FRONTEND_URL: appStage.frontendUrlOutput,
          WEB_BUCKET_NAME: appStage.webBucketNameOutput,
          WEB_DISTRIBUTION_ID: appStage.webDistributionIdOutput,
        },
        commands: [
          'echo "[Step] node version (before)"',
          'node -v || echo "node not found"',

          'echo "[Step] build frontend"',
          "cd web",

          "rm -f .env.production",
          "echo \"VITE_API_BASE_URL=$API_URL\" >> .env.production",
          "echo \"VITE_COGNITO_DOMAIN=$COGNITO_DOMAIN\" >> .env.production",
          "echo \"VITE_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID\" >> .env.production",
          "echo \"VITE_REDIRECT_URL=https://$FRONTEND_URL\" >> .env.production",

          "echo '[Step] show .env.production'",
          "cat .env.production",

          "npm ci",
          "npm run build",

          'echo "[Step] deploy to S3 / CloudFront"',
          "aws --version || echo 'aws cli not found'",

          // dist -> S3
          "aws s3 sync dist/ s3://$WEB_BUCKET_NAME --delete",

          // CloudFront cache 飛ばす
          "aws cloudfront create-invalidation --distribution-id $WEB_DISTRIBUTION_ID --paths '/*'",

          "cd ..",
        ],
        buildEnvironment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        },
        partialBuildSpec: codebuild.BuildSpec.fromObject({
          version: "0.2",
          phases: {
            install: {
              "runtime-versions": {
                nodejs: 20,
              },
            },
          },
        }),
        rolePolicyStatements: [
          new iam.PolicyStatement({
            actions: [
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
              'cloudfront:CreateInvalidation',
            ],
            resources: ['*'],
          }),
        ],
      })
    );

    // ④ DevStage は二重管理になるので今回の pipeline からは外す
    // const devStage = new DevStage(this, 'Dev', {
    //   env: {
    //     account: process.env.CDK_DEFAULT_ACCOUNT,
    //     region: process.env.CDK_DEFAULT_REGION,
    //   },
    // });
    // pipeline.addStage(devStage);
  }
}
