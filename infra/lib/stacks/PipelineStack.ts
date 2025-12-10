import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
} from "aws-cdk-lib/pipelines";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import { AppStage } from "../stage/AppStage";

// DevStage は今回使わないので一旦コメントアウト
// import { DevStage } from './DevStage';

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
        commands: ["npm install", "npx cdk synth"],
        primaryOutputDirectory: "cdk.out",
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
        },
        commands: [
          'echo "[Step] node version (before)"',
          'node -v || echo "node not found"',

          'echo "[Step] build frontend"',
          "cd web",
          "cat <<EOF > .env.production",
          "VITE_API_BASE_URL=$API_URL",
          "VITE_COGNITO_DOMAIN=$COGNITO_DOMAIN",
          "VITE_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID",
          "VITE_REDIRECT_URL=$FRONTEND_URL",
          "EOF",
          "npm install",
          "npm run build",
          "cd ..",
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
