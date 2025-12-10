import { Stack, StackProps,CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodeBuildStep, CodePipeline, CodePipelineSource } from 'aws-cdk-lib/pipelines';
import { DevStage } from './DevStage';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';

export interface PipelineStackProps extends StackProps {
  readonly githubRepo?: string;       // "user/repo"
  readonly githubBranch?: string;    // デフォルト "main"
  readonly githubConnectionArn?: string; // CodeStar Connections を使うなら
  readonly stageName?: string;
  readonly stagePrefix?: string;
  readonly apiUrlOutput: CfnOutput;
  readonly cognitoDomainOutput: CfnOutput;
  readonly cognitoClientIdOutput: CfnOutput;
  readonly frontendUrlOutput: CfnOutput;
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'ProjectPipeline',
      selfMutation: true,
      synth: new CodeBuildStep('Synth', {
        input: CodePipelineSource.connection(
          props.githubRepo ?? 'local-repo',
          props.githubBranch ?? 'master',
          {
            connectionArn: props.githubConnectionArn!,
          },
        ),
        envFromCfnOutputs: {
          API_URL: props.apiUrlOutput,
          COGNITO_DOMAIN: props.cognitoDomainOutput,
          COGNITO_CLIENT_ID: props.cognitoClientIdOutput,
          FRONTEND_URL: props.frontendUrlOutput,

        },
        commands: [
          'echo "[Step] node version (before)"',
          'node -v || echo "node not found"',

          // 1) web build
          'echo "[Step] build frontend"',
          'cd web',
          "cat <<EOF > .env.production",
          "VITE_API_BASE_URL=$API_URL",
          "VITE_COGNITO_DOMAIN=$COGNITO_DOMAIN",
          "VITE_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID",
          "VITE_REDIRECT_URL=$FRONTEND_URL",
          "EOF",
          'npm ci',
          'npm run build',
          'cd ..',

          // 2) CDK synth (출력: 루트 ./cdk.out)
          'echo "[Step] cdk synth (output: ./cdk.out)"',
          'cd infra',
          'npm ci',
          'npx cdk synth -o ../cdk.out',
          'cd ..',

          // 3) 디버그: root/cdk.out 안 확인
          'echo "[DEBUG] list cdk.out root"',
          'ls',
          'ls cdk.out',
          'ls cdk.out/assembly-ProjectPipelineStack-Dev || echo "!! assembly-ProjectPipelineStack-Dev not found in root cdk.out !!"',
        ],

        // ★ CloudAssembly root 를 "리포지토리 루트의 cdk.out" 로 고정
        primaryOutputDirectory: 'cdk.out',
        buildEnvironment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        },
        partialBuildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              'runtime-versions': {
                nodejs: 20,
              },
            },
          },
        }),
      }),
    });

    const devStage = new DevStage(this, 'Dev', {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    });

    pipeline.addStage(devStage);
  }
}
