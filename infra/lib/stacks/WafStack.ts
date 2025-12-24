import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import * as logs from "aws-cdk-lib/aws-logs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as subscriptions from "aws-cdk-lib/aws-logs-destinations";
import * as lambda from "aws-cdk-lib/aws-lambda";

export interface WafStackProps extends cdk.StackProps {
    blockerFn: lambda.IFunction;
}

export class WafStack extends cdk.Stack {
    public readonly webAclArn: string;

    constructor(scope: Construct, id: string, props: WafStackProps) {
        super(scope, id, props);

        const { blockerFn } = props;
        //ブロックしたいipリストをWAF側に持たせる
        const blockIpSet = new wafv2.CfnIPSet(this, "BlockIpSet", {
            name: "auto-block-ipset",
            scope: "CLOUDFRONT", // CloudFrontなら "CLOUDFRONT"
            ipAddressVersion: "IPV4",
            addresses: [],
        });

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
                    name: "RateLimit",
                    priority: 1,
                    action: { block: {} },
                    statement: {
                        rateBasedStatement: {
                            limit: 30, // 5分あたり
                            aggregateKeyType: "IP"
                        },
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: "RateLimit",
                        sampledRequestsEnabled: true,
                    },
                },
                {
                    name: "AWSManagedCommonRuleSet",
                    priority: 2,
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
                //IPSetに入ったIPを WAFが実際に遮断するため
                {
                    name: "BlockIpSetRule",
                    priority: 0,
                    action: { block: {} },
                    statement: {
                        ipSetReferenceStatement: { arn: blockIpSet.attrArn },
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: "block-ipset",
                        sampledRequestsEnabled: true,
                    },
                },
            ],
        });

        //WAFのアクセス/ブロックログを CloudWatch Logsに出す
        const wafLogGroup = new logs.LogGroup(this, "WafLogGroup", {
            // これ重要：aws-waf-logs- で始める, 命名制約
            logGroupName: "aws-waf-logs-app-web-acl",
            retention: logs.RetentionDays.ONE_MONTH,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        //WAFサービス（wafv2.amazonaws.com）がそのLogGroupへ 書き込める権限
        wafLogGroup.addToResourcePolicy(
            new iam.PolicyStatement({
                principals: [new iam.ServicePrincipal("wafv2.amazonaws.com")],
                actions: ["logs:CreateLogStream", "logs:PutLogEvents"],
                resources: [wafLogGroup.logGroupArn, `${wafLogGroup.logGroupArn}:*`],
            })
        );

        //WAF → CloudWatch Logs にログを流す設定
        new wafv2.CfnLoggingConfiguration(this, "WafLogging", {
            resourceArn: webAcl.attrArn,
            logDestinationConfigs: [wafLogGroup.logGroupArn],
            loggingFilter: {
                DefaultBehavior: "DROP",
                Filters: [
                    {
                        Behavior: "KEEP",
                        Requirement: "MEETS_ANY",
                        Conditions: [
                            { ActionCondition: { Action: "BLOCK" } },
                        ],
                    },
                ],
            },
            // フィルタはCDK/CFNの仕様差でコケることがあるので、まずは無しで安定優先
        }); // :contentReference[oaicite:2]{index=2}

        // WAFログが入ったら 即Lambdaを起動してIPSet更新させる
        new logs.SubscriptionFilter(this, "WafLogsToLambda", {
            logGroup: wafLogGroup,
            destination: new subscriptions.LambdaDestination(blockerFn),
            filterPattern: logs.FilterPattern.literal('{ $.action = "BLOCK" }'),
        });

        this.webAclArn = webAcl.attrArn;

        new cdk.CfnOutput(this, "WebAclArn", {
            value: this.webAclArn,
        });
    }
}
