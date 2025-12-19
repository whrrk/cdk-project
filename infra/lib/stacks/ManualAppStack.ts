import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AuthStack } from "../stacks/AuthStack";
import { ApiStack } from "../stacks/ApiStack";
import { DatabaseStack } from "../stacks/DatabaseStack";
import { LambdaStack } from "../stacks/LambdaStack";
import { WebStack } from "../stacks/WebStack";
import { StorageStack } from "./StorageStack";

export class ManualAppStack extends Stack {
    public readonly apiUrlOutput: CfnOutput;
    public readonly cognitoDomainOutput: CfnOutput;
    public readonly cognitoClientIdOutput: CfnOutput;
    public readonly frontendUrlOutput: CfnOutput;
    public readonly webBucketNameOutput: CfnOutput;
    public readonly webDistributionIdOutput: CfnOutput;
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const env = { account: this.account, region: this.region };
        // Auth
        const auth = new AuthStack(this, "AuthStack", { env });

        // DB
        const db = new DatabaseStack(this, "DatabaseStack", { env });

        // Storage
        const storageStack = new StorageStack(this, "StorageStack");

        // Lambda
        const lambda = new LambdaStack(this, 'LambdaStack', {
            userPool: auth.userPool,
            table: db.table,
            videoBucket: storageStack.videoBucket
        });

        // API
        const api = new ApiStack(this, 'ApiStack', {
            env,
            userPool: auth.userPool,
            courseHandler: lambda.courseHandler,
            threadHandler: lambda.threadHandler,
            videoHandler: lambda.videoHandler
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
        this.webBucketNameOutput = front.bucketNameOutput;
        this.webDistributionIdOutput = front.distributionIdOutput;
    }
}
