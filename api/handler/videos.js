const { listCourseVideos, uploadCourseVideos, saveVideoMetadata } = require('../service/videosService');
const { ok, fail, corsHeaders } = require('../http');
const { buildAuthContext } = require('../auth');

exports.handler = async (event) => {
    const {
        httpMethod,
        resource,
        pathParameters = {},
        body,
        requestContext,
    } = event;

    const auth = await buildAuthContext(requestContext);

    try {
        if (event.httpMethod === "OPTIONS") {
            return { statusCode: 204, headers: corsHeaders, body: "" };
        }

        const { courseId } = pathParameters;

        //ここから
        if (resource === "/courses/{courseId}/videos" && httpMethod === "GET") {
            const items = await listCourseVideos(auth, courseId);
            return ok(items);
        }

        if (resource === "/courses/{courseId}/videos" && httpMethod === "POST") {
            const { title, s3Key } = JSON.parse(body || "{}");
            const items = await saveVideoMetadata(courseId, title, s3Key, auth.userId);
            return ok(items);
        }

        const parsedBody = body ? JSON.parse(body) : null;

        if (resource === "/courses/{courseId}/videos/upload" && httpMethod === "POST") {
            const result = await uploadCourseVideos(auth, parsedBody, courseId);
            return ok(result);
        }

        // videos Lambda で扱わないパス → 404
        return fail("Not Found", 404);
    } catch (e) {
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
};
