const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { getClaims, requireEnrolled } = require("../auth");
const { ok, fail, corsHeaders } = require('../http');

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

const TABLE_NAME = process.env.TABLE_NAME;
const VIDEO_BUCKET = process.env.VIDEO_BUCKET;

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: corsHeaders, body: "" };
    }

    const claims = await getClaims(event);
    const userId = claims.sub;

    const { courseId, videoId } = event.pathParameters || {};
    if (!courseId || !videoId) {
      return fail("courseId, videoId required", 400);
    }

    await requireEnrolled(userId, courseId);

    const videoRes = await db.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `COURSE#${courseId}`,
        sk: `VIDEO#${videoId}`,
      },
    }));

    if (!videoRes.Item?.s3Key) {
      return fail("Video not found", 404);
    }

    const s3Key = videoRes.Item.s3Key;

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: VIDEO_BUCKET,
        Key: s3Key,
        // ResponseContentType: "video/mp4",
      }),
      { expiresIn: 300 }
    );

    return ok(JSON.stringify({
      playbackUrl: url,
      expiresIn: 300,
    }));
  } catch (e) {
    const statusCode = e.statusCode || (e.message === "Unauthorized" ? 401 : 500);
    return fail(e.message || "error", statusCode);
  }
};
