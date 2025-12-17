const { requireEnrolled } = require("../auth");
const { docClient, PutCommand, QueryCommand } = require("../db");

const TABLE_NAME = process.env.TABLE_NAME || "LocalTable"; // 最後 fallback
const VIDEO_BUCKET = process.env.VIDEO_BUCKET;

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
        console.log("Checking enrollment for user:", auth.userId, "in course:", courseId);
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

async function createCourseVideos(auth, courseId) {

}


module.exports = { listCourseVideos, createCourseVideos };