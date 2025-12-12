#!/usr/bin/env bash
set -e  # エラーが出たら即終了

PROFILE=wh
REGION=ap-northeast-1
WEB_STACK=Dev-WebStack

echo "🔍 Fetching CloudFormation Outputs..."

WEB_BUCKET=$(aws cloudformation describe-stacks \
  --profile $PROFILE \
  --region $REGION \
  --stack-name $WEB_STACK \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text)

WEB_DIST_ID=$(aws cloudformation describe-stacks \
  --profile $PROFILE \
  --region $REGION \
  --stack-name $WEB_STACK \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendDistributionId'].OutputValue" \
  --output text)

echo "🪣 S3 Bucket: $WEB_BUCKET"
echo "🌐 CloudFront Distribution: $WEB_DIST_ID"

cd web

npm run dev

echo "🚀 Uploading frontend..."
aws s3 sync dist/ s3://$WEB_BUCKET --delete \
  --profile $PROFILE --region $REGION

echo "♻️ Creating CloudFront invalidation..."
aws cloudfront create-invalidation \
  --distribution-id $WEB_DIST_ID \
  --paths '/*' \
  --profile $PROFILE --region $REGION

echo "✅ Frontend deploy completed!"
