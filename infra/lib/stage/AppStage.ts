import { Stage, StageProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";

import { AuthStack } from "../stacks/AuthStack";
import { ApiStack } from "../stacks/ApiStack";
import { DatabaseStack } from "../stacks/DatabaseStack";
import { LambdaStack } from "../stacks/LambdaStack";
import { WebStack } from "../stacks/WebStack";

export class AppStage extends Stage {
  public readonly apiUrlOutput: CfnOutput;
  public readonly cognitoDomainOutput: CfnOutput;
  public readonly cognitoClientIdOutput: CfnOutput;
  public readonly frontendUrlOutput: CfnOutput;

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const env = { account: this.account, region: this.region };
    // Auth
    const auth = new AuthStack(this, "AuthStack", { env });

    // DB
    const db = new DatabaseStack(this, "DatabaseStack", { env });

    // Lambda
    const lambda = new LambdaStack(this, 'LambdaStack', {
      env,
      userPool: auth.userPool,
      table: db.table,
    });

    // API
    const api = new ApiStack(this, 'ApiStack', {
      env,
      userPool: auth.userPool,
      courseHandler: lambda.courseHandler,
      threadHandler: lambda.threadHandler,
    });

    // Front
    const front = new WebStack(this, "WebStack", {
      env: props?.env,
    });

    // ---- Output をまとめて Pipeline に渡す ----

    this.apiUrlOutput = api.apiUrlOutput;
    this.cognitoDomainOutput = auth.cognitoDomainOutput;
    this.cognitoClientIdOutput = auth.cognitoClientIdOutput;
    this.frontendUrlOutput = front.frontUrlOutput;
  }
}
