import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as cwActions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";

type MonitoringStackProps = cdk.StackProps & {
    api: apigw.RestApi;

    courseHandler: lambda.IFunction;
    threadHandler: lambda.IFunction;
    videoHandler: lambda.IFunction;

    // distribution?: cloudfront.IDistribution;
    // webAclName?: string; // WAFv2 metric name 連結時　必要
};

export class MonitoringStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: MonitoringStackProps) {
        super(scope, id, props);

        // 1) channel: SNS Topic
        const alarmTopic = new sns.Topic(this, "AlarmTopic", {
            displayName: "Course Platform Alarms",
        });

        // email alarm
        alarmTopic.addSubscription(new subs.EmailSubscription("jung.wonhyung@m.leaedinge.co.jp"));

        // 共通アラム
        const alarmAction = new cwActions.SnsAction(alarmTopic);

        // -------------------------
        // API Gateway Metrics
        // -------------------------
        const apiCountPerMin = props.api.metricCount({
            period: cdk.Duration.minutes(1),
            statistic: "Sum",
        });

        const api5xxPerMin = props.api.metricServerError({
            period: cdk.Duration.minutes(1),
            statistic: "Sum",
        });

        const api4xxPerMin = props.api.metricClientError({
            period: cdk.Duration.minutes(1),
            statistic: "Sum",
        });

        const apiLatencyP95 = props.api.metricLatency({
            period: cdk.Duration.minutes(1),
            statistic: "p95",
        });

        const apiHighRpmAlarm = new cloudwatch.Alarm(this, "ApiHighRpmAlarm", {
            metric: apiCountPerMin,
            threshold: 50, // トラフィック (例: 300 req/min)
            evaluationPeriods: 1, // 3分連続で
            datapointsToAlarm: 1,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            alarmDescription: "API request count is high (req/min).",
        });
        apiHighRpmAlarm.addAlarmAction(alarmAction);

        // (B) spike — Anomaly Detection
        // CDK L2では “アラム” 構成が 制限的であり、 L1(CfnAlarm)で
        // - band = ANOMALY_DETECTION_BAND(m1, 2)
        // - m1がバンド上段を超える場合
        new cloudwatch.CfnAlarm(this, "ApiRequestSurgeAnomalyAlarm", {
            alarmName: `${cdk.Stack.of(this).stackName}-ApiRequestSurgeAnomaly`,
            comparisonOperator: "GreaterThanUpperThreshold",
            evaluationPeriods: 3,
            datapointsToAlarm: 3,
            thresholdMetricId: "ad1",
            treatMissingData: "notBreaching",
            metrics: [
                {
                    id: "m1",
                    metricStat: {
                        metric: {
                            namespace: "AWS/ApiGateway",
                            metricName: "Count",
                            dimensions: [
                                { name: "ApiName", value: props.api.restApiName },
                            ],
                        },
                        period: 60,
                        stat: "Sum",
                    },
                    returnData: true,
                },
                {
                    id: "ad1",
                    expression: "ANOMALY_DETECTION_BAND(m1, 2)",
                    label: "ApiCountAnomalyBand",
                    returnData: true,
                },
            ],
            alarmActions: [alarmTopic.topicArn],
            alarmDescription: "API request surge detected by anomaly detection (req/min).",
        });

        // (C) 5xx 急増
        const api5xxAlarm = new cloudwatch.Alarm(this, "Api5xxAlarm", {
            metric: api5xxPerMin,
            threshold: 5, // 1分に 5件 以上 5xxなら 危険信号
            evaluationPeriods: 3,
            datapointsToAlarm: 2,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            alarmDescription: "API 5XX errors are elevated.",
        });
        api5xxAlarm.addAlarmAction(alarmAction);

        const apiLatencyAlarm = new cloudwatch.Alarm(this, "ApiLatencyP95Alarm", {
            metric: apiLatencyP95,
            threshold: 2000, // ms (2秒)
            evaluationPeriods: 5,
            datapointsToAlarm: 3,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            alarmDescription: "API latency p95 is high.",
        });
        apiLatencyAlarm.addAlarmAction(alarmAction);

        // -------------------------
        // Lambda Metrics (ex: courseHandler, threadHandler)
        // -------------------------
        const lambdaTargets = [
            { name: "courseHandler", function: props.courseHandler },
            { name: "threadHandler", function: props.threadHandler },
            { name: "videoHandler", function: props.videoHandler }
        ];

        for (const target of lambdaTargets) {
            const errors = target.function.metricErrors({
                period: cdk.Duration.minutes(1),
                statistic: "Sum",
            });

            const throttles = target.function.metricThrottles({
                period: cdk.Duration.minutes(1),
                statistic: "Sum",
            });

            const durationP95 = target.function.metricDuration({
                period: cdk.Duration.minutes(1),
                statistic: "p95",
            });

            // Lambda Errors
            const errAlarm = new cloudwatch.Alarm(this, `${target.name}ErrorsAlarm`, {
                metric: errors,
                threshold: 1,
                evaluationPeriods: 3,
                datapointsToAlarm: 2,
                comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
                alarmDescription: `${target.name} Lambda errors detected.`,
            });
            errAlarm.addAlarmAction(alarmAction);

            // Lambda Throttles
            const thrAlarm = new cloudwatch.Alarm(this, `${target.name}ThrottlesAlarm`, {
                metric: throttles,
                threshold: 1, //
                evaluationPeriods: 3,
                datapointsToAlarm: 1,
                comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
                alarmDescription: `${target.name} Lambda throttles detected (count per minute).`,
            });
            thrAlarm.addAlarmAction(alarmAction);

            // Lambda Duration p95
            const durAlarm = new cloudwatch.Alarm(this, `${target.name}DurationP95Alarm`, {
                metric: durationP95,
                threshold: 3000, // ms (3초)
                evaluationPeriods: 5,
                datapointsToAlarm: 3,
                comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
                alarmDescription: `${target.name} Lambda duration p95 is high.`,
            });
            durAlarm.addAlarmAction(alarmAction);
        }

        const dashboard = new cloudwatch.Dashboard(this, "OpsDashboard", {
            dashboardName: `${cdk.Stack.of(this).stackName}-ops`,
        });

        dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: "API Requests (per min)",
                left: [apiCountPerMin],
            }),
            new cloudwatch.GraphWidget({
                title: "API Errors (4xx/5xx per min)",
                left: [api4xxPerMin, api5xxPerMin],
            }),
            new cloudwatch.GraphWidget({
                title: "API Latency p95",
                left: [apiLatencyP95],
            })
        );
    }
}
