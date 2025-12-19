import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";

export class WafStack extends cdk.Stack {
    public readonly webAclArn: string;

    constructor(scope: Construct, id: string, props: cdk.StackProps) {
        super(scope, id, props);

        const webAcl = new wafv2.CfnWebACL(this, "WebAcl", {
            scope: "CLOUDFRONT",
            defaultAction: { allow: {} },
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: "WebAcl",
                sampledRequestsEnabled: true,
            },
            rules: [
                {
                    name: "AWSManagedCommonRuleSet",
                    priority: 1,
                    overrideAction: { none: {} },
                    statement: {
                        managedRuleGroupStatement: {
                            vendorName: "AWS",
                            name: "AWSManagedRulesCommonRuleSet",
                        },
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: "CommonRules",
                        sampledRequestsEnabled: true,
                    },
                },
                {
                    name: "RateLimit",
                    priority: 2,
                    action: { block: {} },
                    statement: {
                        rateBasedStatement: {
                            limit: 100, // 5分あたり
                            aggregateKeyType: "IP",
                        },
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: "RateLimit",
                        sampledRequestsEnabled: true,
                    },
                },
            ],
        });

        this.webAclArn = webAcl.attrArn;

        new cdk.CfnOutput(this, "WebAclArn", {
            value: this.webAclArn,
        });
    }
}
