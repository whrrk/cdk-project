const { listCourseVideos, createCourseVideos } = require('../service/videosService');
const { ok, fail, corsHeaders } = require('../http');
const { buildAuthContext } = require('../auth');

exports.handler = async (event) => {
    const {
        httpMethod,
        resource,
        pathParameters = {},
        // body,
        requestContext,
    } = event;

    const auth = await buildAuthContext(requestContext);

    try {
        if (event.httpMethod === "OPTIONS") {
            return { statusCode: 204, headers: corsHeaders, body: "" };
        }

        //post時
        // const parsedBody = body ? JSON.parse(body) : null;

        if (resource === "/courses/{courseId}/videos" && httpMethod === "GET") {
            const { courseId } = pathParameters;
            const items = await listCourseVideos(auth, courseId);
            return ok(items);
        }

        //後ほどCreateCourseVideo
        // if (resource === "/courses/{courseId}/videos" && httpMethod === "POST") {
        //     const { courseId } = pathParameters;
        //     const items = await listCourseVideos(auth, courseId);
        //     return ok(items);
        // }

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
