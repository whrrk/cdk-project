const { requireEnrolled, getAuthContext, requireRole } = require("../auth");
const { fail } = require("../http");
const { docClient, PutCommand, QueryCommand } = require("../db");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand, PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

const TABLE_NAME = process.env.TABLE_NAME || "LocalTable"; // 最後 fallback
const VIDEO_BUCKET = process.env.VIDEO_BUCKET;

const s3 = new S3Client({
    region: process.env.AWS_REGION || "ap-northeast-1",
});

async function listCourseVideos(auth, courseId) {
    if (!courseId) {
        const err = new Error("courseId missing");
        err.statusCode = 400;
        throw err;
    }

    if (!VIDEO_BUCKET) {
        const err = new Error("VIDEO_BUCKET env missing");
        err.statusCode = 500;
        throw err;
    }

    if (auth.groups === "STUDENT") {
        await requireEnrolled(auth.userId, courseId);
    }

    // auth から userId(sub) を取る（buildAuthContext の戻りに合わせて調整）
    const userId = auth.userId || auth.sub;
    if (!userId) {
        const err = new Error("Unauthorized");
        err.statusCode = 401;
        throw err;
    }

    // pk=COURSE#${courseId}, sk begins_with VIDEO#
    const videosRes = await docClient.send(
        new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :prefix)",
            ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
            ExpressionAttributeValues: {
                ":pk": `COURSE#${courseId}`,
                ":prefix": "VIDEO#",
            },
        })
    );

    const items = videosRes.Items ?? [];

    const expiresIn = 60 * 5;

    const videos = await Promise.all(
        items.map(async (v) => {
            const cmd = new GetObjectCommand({
                Bucket: VIDEO_BUCKET,
                Key: v.s3Key,
            });

            const url = await getSignedUrl(s3, cmd, { expiresIn });

            return {
                videoId: (v.sk || "").replace("VIDEO#", ""),
                title: v.title ?? "",
                url,
            };
        })
    );

    return { courseId, videos };
}

async function uploadCourseVideos(auth, body, courseId) {
    try {
        const ctx = await getAuthContext(auth);

        await requireRole(ctx, ["TEACHER"]);

        const { filename, contentType } = body;

        const key = `courses/${courseId}/${Date.now()}_${filename}`;

        const command = new PutObjectCommand({
            Bucket: VIDEO_BUCKET,
            Key: key,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(s3, command, {
            expiresIn: 60 * 5,
        });

        return {
            uploadUrl,
            s3Key: key
        };
    } catch (e) {
        console.error("uploadCourseVideos error:", e?.message || e, e?.stack);

        e.statu
        if (e?.message === "Forbidden") {
            return fail(403, { message: "Forbidden" });
        }

        // 認証(にんしょう)が無い / 壊(こわ)れてる場合
        if ((e?.message || "").includes("Unauthorized")) {
            return fail("Unauthorized", 401);
        }

        console.error(e);
        return fail("Internal Server Error", 500);
    }
}

async function saveVideoMetadata(courseId, title, s3Key, userId) {
    if (!title || !s3Key) throw new Error("title and s3Key are required");

    const videoId = `vid_${Date.now()}`;
    const item = {
        pk: `COURSE#${courseId}`,
        sk: `VIDEO#${videoId}`,
        type: "VIDEO",
        title,
        s3Key,
        createdAt: new Date().toISOString(),
        createdBy: userId,
    };

    await docClient.send(new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: item,
    }));

    return { videoId, ...item };
}

module.exports = { listCourseVideos, uploadCourseVideos, saveVideoMetadata };