// lib/WafBlockerStack.ts
import { Stack, StackProps, PhysicalName } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";

export class WafBlockerStack extends Stack {
    public readonly WafBlockerHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        this.WafBlockerHandler = new lambda.Function(this, "WafBlockerHandler", {
            functionName: PhysicalName.GENERATE_IF_NEEDED, // 또는 "dev-waf-blocker" 처럼 고정 문자열
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: 'handler/wafBlocker.handler',
            code: lambda.Code.fromAsset('../api'),
        });

        this.WafBlockerHandler.addToRolePolicy(
            new iam.PolicyStatement({g
                actions: ['wafv2:GetIPSet', 'wafv2:UpdateIPSet'],
                resources: ['*'],
            })
        );
    }
}
